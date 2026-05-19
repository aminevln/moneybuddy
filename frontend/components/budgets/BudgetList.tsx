"use client";

import { AlertCircle, PiggyBank } from "lucide-react";

import {
  type BudgetStatus,
  useBudgetStatusQuery,
} from "@/lib/api/budgets";
import { BudgetCard } from "./BudgetCard";


interface BudgetListProps {
  onEdit: (status: BudgetStatus) => void;
}


export function BudgetList({ onEdit }: BudgetListProps) {
  const { data: statuses, isLoading, error } = useBudgetStatusQuery(true);
  
  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 bg-bg-elevated rounded-xl animate-pulse"
          />
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
  // EMPTY
  // ============================================================
  if (!statuses || statuses.length === 0) {
    return (
      <div className="text-center py-10 bg-bg-elevated/40 border border-border rounded-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
          <PiggyBank className="w-5 h-5 text-fg-muted" />
        </div>
        <p className="text-fg-primary font-medium mb-1">
          Nessun budget attivo
        </p>
        <p className="text-fg-secondary text-sm">
          Crea il primo per tenere d'occhio le tue spese.
        </p>
      </div>
    );
  }
  
  // ============================================================
  // POPULATED
  // ============================================================
  return (
    <div className="space-y-3">
      {statuses.map((status) => (
        <BudgetCard key={status.budget.id} status={status} onEdit={onEdit} />
      ))}
    </div>
  );
}