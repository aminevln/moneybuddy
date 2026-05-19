"use client";

/**
 * Widget compatto per la home: mostra i budget più "tirati".
 *
 * Logica: prendiamo TUTTI gli active, ordiniamo per % decrescente,
 * mostriamo i primi 3 (quelli più vicini al limite o già sforati).
 */

import { ArrowRight, PiggyBank, Plus } from "lucide-react";
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
  
  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5">
        <Header />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-24 bg-bg-elevated rounded-md animate-pulse" />
              <div className="h-1.5 bg-bg-elevated rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // ============================================================
  // ERROR
  // ============================================================
  if (error || !statuses) return null;
  
  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (statuses.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5">
        <Header />
        <p className="text-fg-secondary text-sm mb-3">
          Nessun budget attivo.
        </p>
        <Link
          href="/budgets"
          className="
            inline-flex items-center gap-1.5
            text-sm text-accent hover:text-accent-hover font-medium
            transition-colors duration-150
          "
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Crea il primo</span>
        </Link>
      </div>
    );
  }
  
  // ============================================================
  // POPULATED STATE
  // ============================================================
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-fg-muted" />
          <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
            Budget
          </div>
        </div>
        <Link
          href="/budgets"
          className="
            inline-flex items-center gap-1
            text-xs text-accent hover:text-accent-hover font-medium
            transition-colors duration-150
          "
        >
          <span>vedi tutti</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {top.map((status) => (
          <div key={status.budget.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-fg-primary truncate font-medium">
                {status.category_name ?? "Budget generico"}
              </span>
              <span className="text-xs text-fg-muted tabular-nums whitespace-nowrap">
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


// ============================================================
// SUB-COMPONENT
// ============================================================

function Header() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <PiggyBank className="w-4 h-4 text-fg-muted" />
      <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
        Budget
      </div>
    </div>
  );
}