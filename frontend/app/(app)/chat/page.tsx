"use client";

/**
 * Pagina chat principale.
 *
 * Accetta ?q=... per pre-popolare e inviare automaticamente un messaggio.
 * Wrappata in Suspense per useSearchParams in build prod.
 */

import { AlertCircle, ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

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
    <main className="flex flex-col h-screen bg-bg-base">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-fg-secondary text-sm">
          <span className="w-2 h-2 bg-fg-muted rounded-full animate-pulse" />
          <span>Caricamento chat...</span>
        </div>
      </div>
    </main>
  );
}


function ChatContent() {
  const { data: history, isLoading, error } = useChatHistoryQuery();
  const sendMutation = useSendMessageMutation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoSentQueryRef = useRef<string | null>(null);
  
  // Se arriviamo con ?q=..., invia subito quel messaggio (una sola volta)
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || !history) return;
    if (autoSentQueryRef.current === q) return;
    if (sendMutation.isPending) return;
    
    autoSentQueryRef.current = q;
    sendMutation.mutate({ content: q });
    router.replace("/chat");
  }, [searchParams, history, sendMutation, router]);
  
  // Auto-scroll al nuovo messaggio
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
    <main className="flex flex-col h-screen bg-bg-base">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg-base/85 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Avatar + name + status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Image
                src="/brand/logo-mark.svg"
                alt=""
                width={36}
                height={36}
                className="w-9 h-9"
                priority
              />
              {/* Status indicator */}
              <span
                className={`
                  absolute -bottom-0.5 -right-0.5
                  w-3 h-3 rounded-full border-2 border-bg-base
                  ${sendMutation.isPending ? "bg-warning animate-pulse" : "bg-success"}
                `}
                aria-hidden
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base font-semibold text-fg-primary leading-tight">
                MoneyBuddy
              </h1>
              <p className="text-xs text-fg-muted leading-tight">
                {sendMutation.isPending ? "sta scrivendo..." : "online"}
              </p>
            </div>
          </div>
          
          {/* Home link */}
          <Link
            href="/"
            className="
              inline-flex items-center gap-1.5 shrink-0
              px-3 py-1.5 rounded-md text-xs font-medium
              text-fg-secondary hover:text-fg-primary hover:bg-bg-elevated
              transition-colors duration-150
            "
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-fg-secondary text-sm">
                <span className="w-2 h-2 bg-fg-muted rounded-full animate-pulse" />
                <span>Caricamento conversazione...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div
              className="
                flex items-start gap-2.5
                bg-danger-soft border border-danger/30
                text-danger text-sm
                rounded-lg px-3 py-2.5
              "
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Errore: {error.message}</span>
            </div>
          )}
          
          {isEmpty && <EmptyState onSuggest={handleSend} />}
          
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

const SUGGESTIONS = [
  "Quanto ho speso questo mese?",
  "Qual è il mio saldo totale?",
  "Sono in regola con i budget?",
  "Mostrami le ultime transazioni",
  "Quali sono le mie spese più alte?",
  "Quanto ho speso in cibo questo mese?",
];


function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="py-8 sm:py-12 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-5">
          <Image
            src="/brand/logo-mark.svg"
            alt=""
            width={72}
            height={72}
            className="w-16 h-16 sm:w-18 sm:h-18"
            priority
          />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-fg-primary mb-2 tracking-tight">
          Ciao, sono MoneyBuddy
        </h2>
        <p className="text-fg-secondary text-sm max-w-md mx-auto">
          Posso aiutarti a capire le tue finanze, registrare spese e darti
          consigli sui tuoi budget. Chiedimi qualunque cosa.
        </p>
      </div>
      
      {/* Suggerimenti */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <p className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
            Prova a chiedere
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSuggest(s)}
              className="
                text-left px-3 py-2.5 rounded-lg text-sm
                bg-bg-surface hover:bg-bg-elevated
                text-fg-secondary hover:text-fg-primary
                border border-border hover:border-accent/40
                transition-colors duration-150
              "
            >
              <span className="line-clamp-2">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}