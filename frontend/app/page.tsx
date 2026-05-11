/**
 * Pagina home di MoneyBuddy.
 *
 * Mostra una landing minimale con lo stato live dei servizi backend.
 */

import { HealthStatus } from "@/components/HealthStatus";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">
          MoneyBuddy
        </h1>
        <p className="text-slate-400 mb-6">
          Il tuo assistente finanziario con AI
        </p>
        
        <HealthStatus />
        
        <p className="text-xs text-slate-500 mt-6 text-center">
          Fase 1 · Setup iniziale
        </p>
      </div>
    </main>
  );
}