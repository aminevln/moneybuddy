"use client";

/**
 * Widget "Totale spendibile" + breakdown.
 *
 * Mostra:
 * - Il totale spendibile in grande (il numero che conta)
 * - Sotto: buoni pasto e investimenti separati
 */

import { ArrowRight, Plus, TrendingUp, Utensils, Wallet } from "lucide-react";
import Link from "next/link";

import { useAccountsSummaryQuery } from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/format/currency";


export function BalanceSummary() {
  const { data: summary, isLoading, error } = useAccountsSummaryQuery();
  
  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-fg-muted" />
          <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
            Disponibile
          </div>
        </div>
        <div className="h-9 w-32 bg-bg-elevated rounded-md animate-pulse" />
      </div>
    );
  }
  
  // ============================================================
  // ERROR (silent fail)
  // ============================================================
  if (error || !summary) {
    return null;
  }
  
  // ============================================================
  // EMPTY STATE (no accounts)
  // ============================================================
  if (summary.accounts_count === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-fg-muted" />
          <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
            Disponibile
          </div>
        </div>
        <p className="text-fg-secondary text-sm mb-3">
          Nessun account configurato.
        </p>
        <Link
          href="/settings/accounts"
          className="
            inline-flex items-center gap-1.5
            text-sm text-accent hover:text-accent-hover font-medium
            transition-colors duration-150
          "
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Aggiungi il primo</span>
        </Link>
      </div>
    );
  }
  
  const hasMealVouchers = Number(summary.total_meal_vouchers) > 0;
  const hasInvestments = Number(summary.total_investments) > 0;
  const hasExtras = hasMealVouchers || hasInvestments;
  
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-fg-muted" />
          <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
            Disponibile
          </div>
        </div>
        <Link
          href="/settings/accounts"
          className="
            inline-flex items-center gap-1
            text-xs text-accent hover:text-accent-hover font-medium
            transition-colors duration-150
          "
        >
          <span>gestisci</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      {/* Big number */}
      <div className="font-display text-4xl font-bold text-fg-primary tabular-nums tracking-tight">
        {formatCurrency(summary.total_spendable)}
      </div>
      
      {/* Extras (meal vouchers + investments) */}
      {hasExtras && (
        <div className="mt-4 pt-4 border-t border-border-muted space-y-2 text-sm">
          {hasMealVouchers && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-fg-secondary">
                <Utensils className="w-3.5 h-3.5 text-viz-3" />
                <span>Buoni pasto</span>
              </div>
              <span className="text-fg-primary tabular-nums font-medium">
                {formatCurrency(summary.total_meal_vouchers)}
              </span>
            </div>
          )}
          {hasInvestments && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-fg-secondary">
                <TrendingUp className="w-3.5 h-3.5 text-viz-5" />
                <span>Investimenti</span>
              </div>
              <span className="text-fg-primary tabular-nums font-medium">
                {formatCurrency(summary.total_investments)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}