import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountKeys } from "@/lib/api/accounts";
import { analyticsKeys } from "@/lib/api/analytics";
import { budgetKeys } from "@/lib/api/budgets";
import { transactionKeys } from "@/lib/api/transactions";
import { getChatHistory, sendChatMessage, confirmProposal, rejectProposal, } from "./api";
import type {
  ChatHistoryResponse,
  ChatMessage,
  ChatMessageCreatePayload,
  ProposalConfirmationResponse,
} from "./types";


export const chatKeys = {
  history: ["chat", "history"] as const,
};


// ============================================================
// QUERY
// ============================================================

export function useChatHistoryQuery() {
  return useQuery({
    queryKey: chatKeys.history,
    queryFn: getChatHistory,
    // Le chat hanno alta freschezza: ogni volta che monti il componente,
    // refetchiamo. Niente stale.
    staleTime: 0,
  });
}


// ============================================================
// MUTATION
// ============================================================

/**
 * Invia un messaggio in chat.
 *
 * Strategia di UI:
 * 1. Quando parte la mutation, aggiungiamo SUBITO il messaggio user alla
 *    history (optimistic update) → l'utente vede la sua bolla
 * 2. Mostriamo "sta scrivendo..." (controllato da isPending)
 * 3. Quando arriva la risposta, sostituiamo il record optimistic con quello vero
 *    e aggiungiamo la risposta assistant
 * 4. Invalidiamo le query "dati" (balance, transactions, ecc.) perché in futuro
 *    l'AI potrebbe averli modificati via tool use
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: ChatMessageCreatePayload) => sendChatMessage(payload),
    
    // Optimistic: aggiungiamo la bolla user prima ancora che il backend risponda
    onMutate: async (payload) => {
      // Cancella query in volo per evitare race
      await queryClient.cancelQueries({ queryKey: chatKeys.history });
      
      // Snapshot dello stato attuale (per rollback)
      const previous = queryClient.getQueryData<ChatHistoryResponse>(chatKeys.history);
      
      if (previous) {
        // Crea un fake user message con id temporaneo
        const optimisticUserMsg: ChatMessage = {
          id: `temp-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`,
          session_id: previous.session_id,
          role: "user",
          content: payload.content,
          tool_calls: null,
          tokens_in: null,
          tokens_out: null,
          created_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<ChatHistoryResponse>(chatKeys.history, {
          ...previous,
          messages: [...previous.messages, optimisticUserMsg],
        });
      }
      
      return { previous };
    },
    
    // Risposta arrivata: aggiungiamo i 2 veri messaggi
    onSuccess: (data) => {
      queryClient.setQueryData<ChatHistoryResponse>(chatKeys.history, (old) => {
        if (!old) {
          return {
            session_id: data.user_message.session_id,
            messages: [data.user_message, ...data.assistant_messages],
          };
        }
        const withoutTemp = old.messages.filter((m) => !m.id.startsWith("temp-"));
        return {
          ...old,
          messages: [
            ...withoutTemp,
            data.user_message,
            ...data.assistant_messages,
          ],
        };
      });

      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.summary });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.overview });
    },
    
    // Errore: rollback
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(chatKeys.history, context.previous);
      }
    },
  });
}

/**
 * Helper: dopo una conferma/rifiuto, aggiorna la cache della chat.
 * - Sostituisci il messaggio proposta (updated_message)
 * - Aggiungi il nuovo messaggio (new_message)
 */
function applyProposalResponse(
  queryClient: ReturnType<typeof useQueryClient>,
  data: ProposalConfirmationResponse
) {
  queryClient.setQueryData<ChatHistoryResponse>(chatKeys.history, (old) => {
    if (!old) return old;
    const updatedMessages = old.messages.map((m) =>
      m.id === data.updated_message.id ? data.updated_message : m
    );
    return {
      ...old,
      messages: [...updatedMessages, data.new_message],
    };
  });
}


/**
 * Hook per confermare una proposta di transazione.
 *
 * Strategia:
 * - Optimistic: cambiamo subito lo status del messaggio a "confirmed"
 * - On success: applichiamo la response (updated + new message)
 * - Invalidiamo TUTTE le query che dipendono da transazioni
 */
export function useConfirmProposalMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => confirmProposal(messageId),
    
    // Optimistic: cambia status della proposta a "confirmed"
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.history });
      const previous = queryClient.getQueryData<ChatHistoryResponse>(chatKeys.history);
      
      if (previous) {
        queryClient.setQueryData<ChatHistoryResponse>(chatKeys.history, {
          ...previous,
          messages: previous.messages.map((m) => {
            if (m.id !== messageId) return m;
            const tc = m.tool_calls as Record<string, unknown> | null;
            if (!tc) return m;
            return {
              ...m,
              tool_calls: { ...tc, status: "confirmed" },
            };
          }),
        });
      }
      
      return { previous };
    },
    
    onSuccess: (data) => {
      applyProposalResponse(queryClient, data);
      // La transazione è stata davvero creata → invalida tutto il "money state"
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.summary });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.overview });
    },
    
    onError: (_err, _id, context) => {
      // Rollback dell'optimistic
      if (context?.previous) {
        queryClient.setQueryData(chatKeys.history, context.previous);
      }
    },
  });
}


/**
 * Hook per rifiutare una proposta. Simile al confirm ma più semplice
 * (no creazione transazione, no invalidazione data queries).
 */
export function useRejectProposalMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => rejectProposal(messageId),
    
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.history });
      const previous = queryClient.getQueryData<ChatHistoryResponse>(chatKeys.history);
      
      if (previous) {
        queryClient.setQueryData<ChatHistoryResponse>(chatKeys.history, {
          ...previous,
          messages: previous.messages.map((m) => {
            if (m.id !== messageId) return m;
            const tc = m.tool_calls as Record<string, unknown> | null;
            if (!tc) return m;
            return {
              ...m,
              tool_calls: { ...tc, status: "rejected" },
            };
          }),
        });
      }
      
      return { previous };
    },
    
    onSuccess: (data) => {
      applyProposalResponse(queryClient, data);
    },
    
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(chatKeys.history, context.previous);
      }
    },
  });
}