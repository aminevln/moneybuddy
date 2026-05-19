"use client";

/**
 * Widget compatto per la home: ultime 5 transazioni.
 *
 * Click su "vedi tutte" → pagina transazioni.
 */

import { ArrowRight, ArrowUpRight, ArrowDownRight, Plus, Receipt } from "lucide-react";
import Link from "next/link";

import { useTransactionsQuery } from "@/lib/api/transactions";
import { formatCurrency } from "@/lib/format/currency";
import { formatDateGroup } from "@/lib/format/date";


export function RecentTransactionsWidget() {
  const { data, isLoading, error } = useTransactionsQuery({
    page: 1,
    page_size: 5,
  });
  
  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5">
        <Header />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1">
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-bg-elevated rounded-md animate-pulse" />
                <div className="h-3 w-20 bg-bg-elevated rounded-md animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-bg-elevated rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // ============================================================
  // ERROR
  // ============================================================
  if (error || !data) return null;
  
  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (data.items.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5">
        <Header />
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
            <Receipt className="w-5 h-5 text-fg-muted" />
          </div>
          <p className="text-fg-secondary text-sm mb-3">
            Nessuna transazione ancora.
          </p>
          <Link
            href="/transactions"
            className="
              inline-flex items-center gap-1.5
              text-sm text-accent hover:text-accent-hover font-medium
              transition-colors duration-150
            "
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registra la prima</span>
          </Link>
        </div>
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
          <Receipt className="w-4 h-4 text-fg-muted" />
          <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
            Ultime transazioni
          </div>
        </div>
        <Link
          href="/transactions"
          className="
            inline-flex items-center gap-1
            text-xs text-accent hover:text-accent-hover font-medium
            transition-colors duration-150
          "
        >
          <span>vedi tutte</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-0.5 -mx-2">
        {data.items.map((txn) => {
          const isIncome = txn.direction === "income";
          const sign = isIncome ? "+" : "−";
          const color = isIncome ? "text-success" : "text-danger";
          const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
          
          return (
            <Link
              key={txn.id}
              href="/transactions"
              className="
                flex items-center gap-3 px-2 py-2 rounded-md
                hover:bg-bg-elevated
                transition-colors duration-150
              "
            >
              {/* Icona direzione */}
              <div
                className={`
                  shrink-0 inline-flex items-center justify-center
                  w-8 h-8 rounded-full
                  ${isIncome ? "bg-success-soft" : "bg-danger-soft"}
                `}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              
              {/* Descrizione + data */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg-primary truncate font-medium">
                  {txn.description}
                </p>
                <p className="text-xs text-fg-muted">
                  {formatDateGroup(txn.occurred_at)}
                </p>
              </div>
              
              {/* Importo */}
              <span className={`text-sm tabular-nums whitespace-nowrap font-semibold ${color}`}>
                {sign}{formatCurrency(txn.amount)}
              </span>
            </Link>
          );
        })}
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
      <Receipt className="w-4 h-4 text-fg-muted" />
      <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
        Ultime transazioni
      </div>
    </div>
  );
}