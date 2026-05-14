import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountKeys } from "@/lib/api/accounts";
import { analyticsKeys } from "@/lib/api/analytics";
import { budgetKeys } from "@/lib/api/budgets";
import { transactionKeys } from "@/lib/api/transactions";
import { getChatHistory, sendChatMessage } from "./api";
import type {
  ChatHistoryResponse,
  ChatMessage,
  ChatMessageCreatePayload,
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
            messages: [data.user_message, data.assistant_message],
          };
        }
        // Rimuovi il messaggio optimistic (id che inizia con "temp-") e aggiungi i veri
        const withoutTemp = old.messages.filter((m) => !m.id.startsWith("temp-"));
        return {
          ...old,
          messages: [...withoutTemp, data.user_message, data.assistant_message],
        };
      });
      
      // Invalida tutte le query "dati" - in futuro l'AI potrebbe averli modificati
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