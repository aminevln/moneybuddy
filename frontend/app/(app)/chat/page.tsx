"use client";

/**
 * Pagina chat principale.
 *
 * Layout:
 * - Header con titolo e link home
 * - Lista messaggi scrollabile (auto-scroll al fondo)
 * - Input fisso in basso
 *
 * Pattern: full-height layout con flex column.
 */

import Link from "next/link";
import { useEffect, useRef } from "react";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import {
  useChatHistoryQuery,
  useSendMessageMutation,
} from "@/lib/api/chat";


export default function ChatPage() {
  const { data: history, isLoading, error } = useChatHistoryQuery();
  const sendMutation = useSendMessageMutation();
  
  // Auto-scroll quando arriva un nuovo messaggio
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history?.messages.length, sendMutation.isPending]);
  
  function handleSend(content: string) {
    sendMutation.mutate({ content });
  }
  
  const messages = history?.messages ?? [];
  const isEmpty = !isLoading && messages.length === 0;
  
  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>💬</span>
            <div>
              <h1 className="text-lg font-bold text-white">MoneyBuddy</h1>
              <p className="text-xs text-slate-400">
                {sendMutation.isPending ? "sta scrivendo..." : "online"}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← Home
          </Link>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {isLoading && (
            <div className="text-center text-slate-500 text-sm py-8">
              Caricamento conversazione...
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              Errore: {error.message}
            </div>
          )}
          
          {isEmpty && <EmptyState />}
          
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          
          {sendMutation.isPending && <TypingIndicator />}
          
          {/* Anchor per auto-scroll */}
          <div ref={scrollRef} />
        </div>
      </div>
      
      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={sendMutation.isPending}
      />
    </main>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState() {
  const suggestions = [
    "Quanto ho speso questo mese?",
    "Qual è il mio saldo totale?",
    "Sono in regola con i budget?",
    "Mostrami le ultime transazioni",
  ];
  
  return (
    <div className="py-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">👋</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Ciao, sono MoneyBuddy
        </h2>
        <p className="text-slate-400 text-sm">
          Posso aiutarti a capire le tue finanze. Chiedimi qualunque cosa!
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Prova a chiedere:
        </p>
        {suggestions.map((s, i) => (
          <SuggestionCard key={i} text={s} />
        ))}
      </div>
    </div>
  );
}


function SuggestionCard({ text }: { text: string }) {
  // Per ora i suggerimenti sono statici (decorativi).
  // Click → pre-popolerebbe l'input, ma serve un ref globale → lo facciamo dopo se serve.
  return (
    <div className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300">
      "{text}"
    </div>
  );
}