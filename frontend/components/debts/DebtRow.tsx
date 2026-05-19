"use client";

import {
  Calendar,
  Coins,
  Percent,
  Pencil,
  Trash2,
  Landmark,
} from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";
import {
  type Debt,
  decimalToPercent,
  useDeleteDebtMutation,
} from "@/lib/api/debts";
import { formatCurrency } from "@/lib/format/currency";
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
    <div
      className="
        p-4 rounded-xl space-y-3
        bg-bg-elevated/50 border border-border
        transition-all duration-150
        hover:border-border-strong
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Icona creditore */}
          <div
            className="
              shrink-0 inline-flex items-center justify-center
              w-10 h-10 rounded-lg
              bg-danger-soft
            "
          >
            <Landmark className="w-5 h-5 text-danger" />
          </div>
          
          {/* Creditore + meta */}
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-fg-primary truncate">
              {debt.creditor}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-fg-muted">
              {debt.monthly_payment && (
                <span className="inline-flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  <span>
                    <span className="text-fg-secondary font-medium tabular-nums">
                      {formatCurrency(debt.monthly_payment)}
                    </span>
                    <span className="ml-0.5">/mese</span>
                  </span>
                </span>
              )}
              {debt.interest_rate && (
                <span className="inline-flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  <span className="text-fg-secondary font-medium tabular-nums">
                    {decimalToPercent(debt.interest_rate)}%
                  </span>
                </span>
              )}
              {debt.due_date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-fg-secondary font-medium tabular-nums">
                    {new Date(debt.due_date).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Azioni */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            size="sm"
            onClick={() => onEdit(debt)}
            aria-label="Modifica"
            title="Modifica"
          >
            <Pencil className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton
            size="sm"
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            aria-label="Elimina"
            title="Elimina"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
      
      {/* Progress bar */}
      <DebtProgressBar
        original={debt.original_amount}
        remaining={debt.remaining_amount}
      />
      
      {/* Note */}
      {debt.notes && (
        <p className="text-xs text-fg-secondary pt-3 border-t border-border-muted italic">
          {debt.notes}
        </p>
      )}
    </div>
  );
}