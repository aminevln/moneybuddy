"use client";

/**
 * Singola "bolla" di un messaggio in chat.
 *
 * User: bolla a destra, sfondo emerald
 * Assistant: bolla a sinistra, sfondo slate
 *
 * Mostra anche timestamp se hover.
 */

import type { ChatMessage } from "@/lib/api/chat";


interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  
  const timeLabel = formatBubbleTime(message.created_at);
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-2.5
          ${
            isUser
              ? "bg-emerald-500 text-white rounded-br-sm"
              : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700"
          }
        `}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
        <div
          className={`
            text-[10px] mt-1 tabular-nums
            ${isUser ? "text-emerald-100/70 text-right" : "text-slate-500"}
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