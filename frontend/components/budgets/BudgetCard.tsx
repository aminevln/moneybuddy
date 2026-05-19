"use client";

/**
 * Card "ricca" per un budget con il suo status.
 */

import { CalendarDays, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import {
  type BudgetStatus,
  getBudgetSeverity,
  PERIOD_LABELS_SHORT,
  useDeleteBudgetMutation,
} from "@/lib/api/budgets";
import { formatCurrency } from "@/lib/format/currency";
import { BudgetProgressBar } from "./BudgetProgressBar";


interface BudgetCardProps {
  status: BudgetStatus;
  onEdit: (status: BudgetStatus) => void;
}


export function BudgetCard({ status, onEdit }: BudgetCardProps) {
  const deleteMutation = useDeleteBudgetMutation();
  
  const severity = getBudgetSeverity(status.percentage);
  const isInactive = !status.budget.is_active;
  const remaining = Number(status.remaining);
  const isOver = remaining < 0;
  
  async function handleDelete() {
    const label = status.category_name ?? "Budget generico";
    if (!confirm(`Eliminare il budget "${label}"?`)) return;
    try {
      await deleteMutation.mutateAsync(status.budget.id);
    } catch (err) {
      alert("Errore durante l'eliminazione");
      console.error(err);
    }
  }
  
  const periodLabel = `${formatDateShort(status.period_start)} – ${formatDateShort(status.period_end)}`;
  
  // Colore amount speso in base alla severità
  const spentColor = {
    ok: "text-fg-primary",
    warning: "text-warning",
    danger: "text-danger",
  }[severity];
  
  return (
    <div
      className={`
        p-5 bg-bg-elevated/50 border border-border rounded-xl space-y-4
        transition-all duration-150
        ${isInactive ? "opacity-50" : "hover:border-border-strong"}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base font-semibold text-fg-primary truncate">
              {status.category_name ?? "Budget generico"}
            </h3>
            {isInactive && <Badge size="sm">inattivo</Badge>}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-fg-muted">
            <CalendarDays className="w-3 h-3 shrink-0" />
            <span className="font-medium">
              {PERIOD_LABELS_SHORT[status.budget.period]}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{periodLabel}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            size="sm"
            onClick={() => onEdit(status)}
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
      
      {/* Big number row */}
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`
            font-display text-2xl font-bold tabular-nums tracking-tight
            ${spentColor}
          `}
        >
          {formatCurrency(status.spent)}
        </span>
        <span className="text-xs text-fg-muted tabular-nums">
          su <span className="text-fg-secondary font-medium">{formatCurrency(status.budget.amount_limit)}</span>
        </span>
      </div>
      
      {/* Progress bar */}
      <BudgetProgressBar percentage={status.percentage} />
      
      {/* Residuo / sforato */}
      <div className="flex items-baseline justify-between pt-3 border-t border-border-muted text-sm">
        <span className="text-fg-secondary">
          {isOver ? "Hai sforato di" : "Restano"}
        </span>
        <span
          className={`
            tabular-nums font-semibold
            ${isOver ? "text-danger" : "text-success"}
          `}
        >
          {isOver ? "−" : "+"}{formatCurrency(Math.abs(remaining))}
        </span>
      </div>
    </div>
  );
}


// Helper: "2026-05-01" → "1 mag"
function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}