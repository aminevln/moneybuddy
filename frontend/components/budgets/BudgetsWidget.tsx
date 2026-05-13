"use client";

/**
 * Widget compatto per la home: mostra i budget più "tirati".
 *
 * Logica: prendiamo TUTTI gli active, ordiniamo per % decrescente,
 * mostriamo i primi 3 (quelli più vicini al limite o già sforati).
 *
 * Se nessun budget è attivo: invito a crearne uno.
 */

import Link from "next/link";
import { useMemo } from "react";

import { useBudgetStatusQuery } from "@/lib/api/budgets";
import { formatCurrency } from "@/lib/format/currency";
import { BudgetProgressBar } from "./BudgetProgressBar";


export function BudgetsWidget() {
  const { data: statuses, isLoading, error } = useBudgetStatusQuery(true);
  
  // Top 3 più "tirati" (% decrescente)
  const top = useMemo(() => {
    if (!statuses) return [];
    return [...statuses]
      .sort((a, b) => Number(b.percentage) - Number(a.percentage))
      .slice(0, 3);
  }, [statuses]);
  
  if (isLoading) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Budget
        </div>
        <div className="text-slate-500 text-sm">caricamento...</div>
      </div>
    );
  }
  
  if (error || !statuses) return null;
  
  if (statuses.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Budget
        </div>
        <p className="text-slate-400 text-sm mb-3">
          Nessun budget attivo.
        </p>
        <Link
          href="/budgets"
          className="text-sm text-emerald-400 hover:text-emerald-300 underline"
        >
          Crea il primo →
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          Budget
        </div>
        <Link
          href="/budgets"
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          vedi tutti →
        </Link>
      </div>
      
      <div className="space-y-3">
        {top.map((status) => (
          <div key={status.budget.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-slate-200 truncate">
                {status.category_name ?? "Budget generico"}
              </span>
              <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                {formatCurrency(status.spent)} / {formatCurrency(status.budget.amount_limit)}
              </span>
            </div>
            <BudgetProgressBar percentage={status.percentage} showLabel={false} />
          </div>
        ))}
      </div>
    </div>
  );
}