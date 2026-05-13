"use client";

import {
  useBudgetStatusQuery,
  type BudgetStatus,
} from "@/lib/api/budgets";
import { BudgetCard } from "./BudgetCard";


interface BudgetListProps {
  onEdit: (status: BudgetStatus) => void;
}

export function BudgetList({ onEdit }: BudgetListProps) {
  const { data: statuses, isLoading, error } = useBudgetStatusQuery(true);
  
  if (isLoading) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        Caricamento budget...
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
  
  if (!statuses || statuses.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        Nessun budget attivo. Crea il primo per tenere d'occhio le tue spese!
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {statuses.map((status) => (
        <BudgetCard key={status.budget.id} status={status} onEdit={onEdit} />
      ))}
    </div>
  );
}