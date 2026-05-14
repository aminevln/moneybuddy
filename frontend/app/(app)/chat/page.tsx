"use client";

/**
 * Pagina chat principale.
 *
 * Accetta ?q=... per pre-popolare e inviare automaticamente un messaggio.
 * Wrappata in Suspense per useSearchParams in build prod.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import {
  useChatHistoryQuery,
  useSendMessageMutation,
} from "@/lib/api/chat";


export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}


function ChatLoading() {
  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Caricamento chat...
      </div>
    </main>
  );
}


function ChatContent() {
  const { data: history, isLoading, error } = useChatHistoryQuery();
  const sendMutation = useSendMessageMutation();
  const searchParams = useSearchParams();
  const router = useRouter();          // ← NUOVA RIGA
  const autoSentQueryRef = useRef<string | null>(null);
  
  // Se arriviamo con ?q=..., invia subito quel messaggio (una sola volta)
  // Se arriviamo con ?q=..., invia subito quel messaggio (una sola volta)
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || !history) return;
    // Guard sincrono via ref: se abbiamo già processato questo `q`, esci subito
    if (autoSentQueryRef.current === q) return;
    if (sendMutation.isPending) return;
    
    autoSentQueryRef.current = q;     // marca PRIMA di mutate, no race possibile
    sendMutation.mutate({ content: q });
    router.replace("/chat");
  }, [searchParams, history, sendMutation, router]);
  
  // Auto-scroll quando arriva un nuovo messaggio
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history?.messages.length, sendMutation.isPending]);
  
  function handleSend(content: string) {
    sendMutation.mutate({ content });
  }
  
  const messages = history?.messages ?? [];
  const isEmpty = !isLoading && messages.length === 0 && !sendMutation.isPending;
  
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
          
          {dedupeById(messages).map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          
          {sendMutation.isPending && <TypingIndicator />}
          
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

/**
 * Rimuove duplicati per id mantenendo il primo apparso.
 * Difesa contro race conditions di optimistic update.
 */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
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
  return (
    <div className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300">
      "{text}"
    </div>
  );
}