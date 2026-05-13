"use client";

import { useDebtsQuery, type Debt } from "@/lib/api/debts";
import { DebtRow } from "./DebtRow";


interface DebtListProps {
  onEdit: (debt: Debt) => void;
}

export function DebtList({ onEdit }: DebtListProps) {
  const { data: debts, isLoading, error } = useDebtsQuery();
  
  if (isLoading) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        Caricamento debiti...
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
  
  if (!debts || debts.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        Nessun debito. Aggiungi mutui, finanziamenti, prestiti...
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