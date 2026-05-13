"use client";

/**
 * Lista delle transazioni raggruppate per data.
 *
 * "Oggi", "Ieri", e poi date specifiche più indietro nel tempo.
 */

import { useMemo } from "react";

import {
  useTransactionsQuery,
  type Transaction,
  type TransactionListFilters,
} from "@/lib/api/transactions";
import { formatDateGroup } from "@/lib/format/date";
import { TransactionRow } from "./TransactionRow";


interface TransactionListProps {
  filters: TransactionListFilters;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionList({ filters, onEdit }: TransactionListProps) {
  const { data, isLoading, error } = useTransactionsQuery(filters);
  
  // Raggruppa per data (Oggi, Ieri, 10 mag, ecc.)
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
  
  if (isLoading) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        Caricamento transazioni...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
        Errore: {error.message}
      </div>
    );
  }
  
  if (!data || data.items.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        Nessuna transazione. Aggiungine una per iniziare!
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <section key={group.label}>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-1">
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