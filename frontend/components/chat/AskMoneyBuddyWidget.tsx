"use client";

/**
 * Widget "Chiedi a MoneyBuddy" per la home.
 *
 * Comportamento:
 * - Input testuale + bottone "Chiedi"
 * - Suggerimenti rapidi (chip cliccabili)
 * - Submit → naviga a /chat?q=<domanda>
 *   La pagina chat la riceve via searchParams e la invia automaticamente.
 *
 * Non genera la risposta inline: porta sempre alla chat completa.
 * Vantaggio: storico preservato, UX coerente, codice minimo.
 */

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
    <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl" aria-hidden>💬</span>
        <h2 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">
          Chiedi a MoneyBuddy
        </h2>
      </div>
      
      {/* Suggerimenti */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => navigateToChat(s)}
            className="
              text-xs px-3 py-1.5 rounded-full
              bg-slate-800/70 hover:bg-slate-700 text-slate-300
              border border-slate-700 hover:border-emerald-500/50
              transition
            "
          >
            {s}
          </button>
        ))}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="...oppure scrivi qualunque cosa"
          className="
            flex-1 px-3 py-2 rounded-lg text-sm
            bg-slate-900/50 text-slate-100
            border border-slate-700
            focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
            placeholder:text-slate-500
            transition
          "
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="
            px-4 py-2 rounded-lg text-sm font-medium
            bg-emerald-500 hover:bg-emerald-600 text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            transition flex items-center gap-1
          "
          aria-label="Chiedi"
        >
          <span>Chiedi</span>
          <span aria-hidden>→</span>
        </button>
      </form>
    </div>
  );
}