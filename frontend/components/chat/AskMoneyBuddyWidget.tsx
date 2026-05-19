"use client";

/**
 * Widget "Chiedi a MoneyBuddy" per la home.
 *
 * Comportamento:
 * - Input testuale + bottone "Chiedi"
 * - Suggerimenti rapidi (chip cliccabili)
 * - Submit → naviga a /chat?q=<domanda>
 *   La pagina chat la riceve via searchParams e la invia automaticamente.
 */

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";


const SUGGESTIONS: string[] = [
  "Quanto ho speso questo mese?",
  "Saldo dei miei conti?",
  "Sono in regola con i budget?",
  "Ultime spese importanti",
];


export function AskMoneyBuddyWidget() {
  const router = useRouter();
  const [value, setValue] = useState("");
  
  function navigateToChat(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
  }
  
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigateToChat(value);
  }
  
  return (
    <div
      className="
        relative overflow-hidden
        bg-gradient-to-br from-accent-soft to-transparent
        border border-accent/30
        rounded-xl p-5
      "
    >
      {/* Decoration: alone luminoso in alto a destra */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />
      
      {/* Header */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-accent text-accent-fg">
          <Sparkles className="w-4 h-4" />
        </div>
        <h2 className="font-display text-sm font-semibold text-fg-primary uppercase tracking-wider">
          Chiedi a MoneyBuddy
        </h2>
      </div>
      
      {/* Suggerimenti chip */}
      <div className="relative flex flex-wrap gap-1.5 mb-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => navigateToChat(s)}
            className="
              text-xs px-3 py-1.5 rounded-full
              bg-bg-surface hover:bg-bg-elevated
              text-fg-secondary hover:text-fg-primary
              border border-border hover:border-accent/40
              transition-colors duration-150
            "
          >
            {s}
          </button>
        ))}
      </div>
      
      {/* Input + submit */}
      <form onSubmit={handleSubmit} className="relative flex gap-2">
        <div className="relative flex-1">
          <Sparkles
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted pointer-events-none"
            aria-hidden
          />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="...oppure scrivi qualunque cosa"
            className="
              w-full pl-10 pr-3 py-2.5 rounded-lg text-sm
              bg-bg-surface text-fg-primary
              border border-border
              focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
              placeholder:text-fg-muted
              transition-colors duration-150
            "
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim()}
          className="
            inline-flex items-center gap-1.5 shrink-0
            px-4 py-2.5 rounded-lg text-sm font-medium
            bg-accent hover:bg-accent-hover active:bg-accent-pressed text-accent-fg
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent
            transition-colors duration-150
          "
          aria-label="Chiedi"
        >
          <span>Chiedi</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}