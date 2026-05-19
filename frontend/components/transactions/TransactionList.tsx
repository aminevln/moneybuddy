"use client";

/**
 * Lista delle transazioni raggruppate per data.
 *
 * "Oggi", "Ieri", e poi date specifiche più indietro nel tempo.
 */

import { AlertCircle, Receipt } from "lucide-react";
import { useMemo } from "react";

import {
  type Transaction,
  type TransactionListFilters,
  useTransactionsQuery,
} from "@/lib/api/transactions";
import { formatDateGroup } from "@/lib/format/date";
import { TransactionRow } from "./TransactionRow";


interface TransactionListProps {
  filters: TransactionListFilters;
  onEdit: (transaction: Transaction) => void;
}


export function TransactionList({ filters, onEdit }: TransactionListProps) {
  const { data, isLoading, error } = useTransactionsQuery(filters);
  
  const grouped = useMemo(() => {
    if (!data?.items) return [];
    
    const groups: Array<{ label: string; items: Transaction[] }> = [];
    for (const txn of data.items) {
      const label = formatDateGroup(txn.occurred_at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.items.push(txn);
      } else {
        groups.push({ label, items: [txn] });
      }
    }
    return groups;
  }, [data]);
  
  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((g) => (
          <section key={g}>
            <div className="h-3 w-16 bg-bg-elevated rounded-md animate-pulse mb-2 ml-1" />
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-bg-surface border border-border rounded-lg animate-pulse"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }
  
  // ============================================================
  // ERROR
  // ============================================================
  if (error) {
    return (
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
    );
  }
  
  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-12 bg-bg-surface border border-border rounded-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
          <Receipt className="w-5 h-5 text-fg-muted" />
        </div>
        <p className="text-fg-primary font-medium mb-1">
          Nessuna transazione
        </p>
        <p className="text-fg-secondary text-sm">
          Quando ne registrerai una, apparirà qui.
        </p>
      </div>
    );
  }
  
  // ============================================================
  // GROUPED LIST
  // ============================================================
  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <section key={group.label}>
          <h3 className="
            text-xs uppercase tracking-wider text-fg-muted font-medium
            mb-2 px-1
          ">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.items.map((txn) => (
              <TransactionRow key={txn.id} transaction={txn} onEdit={onEdit} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}