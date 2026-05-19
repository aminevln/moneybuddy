"use client";

/**
 * Singola bolla messaggio.
 *
 * Decide il render:
 * - Se è una proposta di transazione → delega a ProposalCard
 * - Altrimenti → bolla normale (user destra accent, assistant sinistra surface)
 */

import { isTransactionProposal, type ChatMessage } from "@/lib/api/chat";
import { ProposalCard } from "./ProposalCard";


interface ChatBubbleProps {
  message: ChatMessage;
}


export function ChatBubble({ message }: ChatBubbleProps) {
  // Se è una proposta, usa il componente speciale
  if (isTransactionProposal(message)) {
    return <ProposalCard message={message} />;
  }
  
  const isUser = message.role === "user";
  const timeLabel = formatBubbleTime(message.created_at);
  
  return (
    <div
      className={`
        flex animate-fade-in
        ${isUser ? "justify-end" : "justify-start"}
      `}
    >
      <div
        className={`
          max-w-[80%] sm:max-w-[75%]
          px-4 py-2.5
          ${
            isUser
              ? "bg-accent text-accent-fg rounded-2xl rounded-br-md"
              : "bg-bg-surface text-fg-primary border border-border rounded-2xl rounded-bl-md"
          }
        `}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
        <div
          className={`
            text-[10px] mt-1 tabular-nums font-medium
            ${
              isUser
                ? "text-accent-fg/70 text-right"
                : "text-fg-muted"
            }
          `}
        >
          {timeLabel}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// HELPERS
// ============================================================

function formatBubbleTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}