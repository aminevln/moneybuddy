"use client";

/**
 * Widget compatto per la home: ultime 5 transazioni.
 *
 * Click su una transazione → vai alla pagina transazioni.
 */

import Link from "next/link";

import { useTransactionsQuery } from "@/lib/api/transactions";
import { formatCurrency } from "@/lib/format/currency";
import { formatDateGroup } from "@/lib/format/date";


export function RecentTransactionsWidget() {
  const { data, isLoading, error } = useTransactionsQuery({
    page: 1,
    page_size: 5,
  });
  
  if (isLoading) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Ultime transazioni
        </div>
        <div className="text-slate-500 text-sm">caricamento...</div>
      </div>
    );
  }
  
  if (error || !data) return null;
  
  if (data.items.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Ultime transazioni
        </div>
        <p className="text-slate-400 text-sm mb-3">
          Nessuna transazione ancora.
        </p>
        <Link
          href="/transactions"
          className="text-sm text-emerald-400 hover:text-emerald-300 underline"
        >
          Registra la prima →
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          Ultime transazioni
        </div>
        <Link
          href="/transactions"
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          vedi tutte →
        </Link>
      </div>
      
      <div className="space-y-2">
        {data.items.map((txn) => {
          const sign = txn.direction === "income" ? "+" : "−";
          const color =
            txn.direction === "income" ? "text-emerald-400" : "text-rose-400";
          return (
            <div key={txn.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="text-slate-200 truncate">{txn.description}</p>
                <p className="text-xs text-slate-500">
                  {formatDateGroup(txn.occurred_at)}
                </p>
              </div>
              <span className={`tabular-nums whitespace-nowrap ${color}`}>
                {sign}{formatCurrency(txn.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}