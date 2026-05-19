"use client";

import { AlertCircle, CreditCard } from "lucide-react";

import { type Debt, useDebtsQuery } from "@/lib/api/debts";
import { DebtRow } from "./DebtRow";


interface DebtListProps {
  onEdit: (debt: Debt) => void;
}


export function DebtList({ onEdit }: DebtListProps) {
  const { data: debts, isLoading, error } = useDebtsQuery();
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 bg-bg-elevated rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }
  
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
  
  if (!debts || debts.length === 0) {
    return (
      <div className="text-center py-10 bg-bg-elevated/40 border border-border rounded-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
          <CreditCard className="w-5 h-5 text-fg-muted" />
        </div>
        <p className="text-fg-primary font-medium mb-1">
          Nessun debito
        </p>
        <p className="text-fg-secondary text-sm max-w-sm mx-auto">
          Aggiungi mutui, finanziamenti o prestiti per tenerne traccia.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {debts.map((debt) => (
        <DebtRow key={debt.id} debt={debt} onEdit={onEdit} />
      ))}
    </div>
  );
}