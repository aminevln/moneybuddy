"use client";

/**
 * Widget "Totale spendibile" + breakdown.
 *
 * Usato sulla home dell'app. Mostra:
 * - Il totale spendibile in grande (il numero che conta)
 * - Sotto: buoni pasto e investimenti separati
 */

import Link from "next/link";

import { formatCurrency } from "@/lib/format/currency";
import { useAccountsSummaryQuery } from "@/lib/api/accounts";


export function BalanceSummary() {
  const { data: summary, isLoading, error } = useAccountsSummaryQuery();
  
  if (isLoading) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Disponibile
        </div>
        <div className="text-slate-500 text-sm">caricamento...</div>
      </div>
    );
  }
  
  if (error || !summary) {
    return null;  // Silent fail: il box scompare in caso di errore
  }
  
  // Se l'utente non ha ancora nessun account, mostriamo un CTA
  if (summary.accounts_count === 0) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Disponibile
        </div>
        <p className="text-slate-400 text-sm mb-3">
          Nessun account configurato.
        </p>
        <Link
          href="/settings/accounts"
          className="text-sm text-emerald-400 hover:text-emerald-300 underline"
        >
          Aggiungi il primo →
        </Link>
      </div>
    );
  }
  
  const hasExtras =
    Number(summary.total_meal_vouchers) > 0 ||
    Number(summary.total_investments) > 0;
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          Disponibile
        </div>
        <Link
          href="/settings/accounts"
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          gestisci →
        </Link>
      </div>
      
      <div className="text-3xl font-bold text-white tabular-nums">
        {formatCurrency(summary.total_spendable)}
      </div>
      
      {hasExtras && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1 text-sm">
          {Number(summary.total_meal_vouchers) > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>🍽️ Buoni pasto</span>
              <span className="tabular-nums">
                {formatCurrency(summary.total_meal_vouchers)}
              </span>
            </div>
          )}
          {Number(summary.total_investments) > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>📈 Investimenti</span>
              <span className="tabular-nums">
                {formatCurrency(summary.total_investments)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}