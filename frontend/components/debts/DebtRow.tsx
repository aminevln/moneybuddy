"use client";

import { IconButton } from "@/components/ui/IconButton";
import { formatCurrency } from "@/lib/format/currency";
import {
  decimalToPercent,
  useDeleteDebtMutation,
  type Debt,
} from "@/lib/api/debts";
import { DebtProgressBar } from "./DebtProgressBar";


interface DebtRowProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
}

export function DebtRow({ debt, onEdit }: DebtRowProps) {
  const deleteMutation = useDeleteDebtMutation();
  
  async function handleDelete() {
    if (!confirm(`Eliminare il debito con "${debt.creditor}"?`)) return;
    try {
      await deleteMutation.mutateAsync(debt.id);
    } catch (err) {
      alert("Errore durante l'eliminazione");
      console.error(err);
    }
  }
  
  return (
    <div className="p-3 bg-slate-900/50 rounded-lg space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-slate-200 truncate font-medium">{debt.creditor}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
            {debt.monthly_payment && (
              <span>Rata: {formatCurrency(debt.monthly_payment)}/mese</span>
            )}
            {debt.interest_rate && (
              <span>Tasso: {decimalToPercent(debt.interest_rate)}%</span>
            )}
            {debt.due_date && (
              <span>Fino al: {new Date(debt.due_date).toLocaleDateString("it-IT")}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <IconButton onClick={() => onEdit(debt)} aria-label="Modifica" title="Modifica">
            ✏️
          </IconButton>
          <IconButton
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            aria-label="Elimina"
            title="Elimina"
          >
            🗑️
          </IconButton>
        </div>
      </div>
      
      <DebtProgressBar
        original={debt.original_amount}
        remaining={debt.remaining_amount}
      />
      
      {debt.notes && (
        <p className="text-xs text-slate-400 italic pt-1 border-t border-slate-800">
          {debt.notes}
        </p>
      )}
    </div>
  );
}