"use client";

/**
 * Card "ricca" per un budget con il suo status.
 *
 * Mostra:
 * - Nome categoria (o "Budget generico") + periodo
 * - Speso / Limite in grande
 * - Barra di progresso colorata
 * - Periodo di riferimento (data inizio/fine)
 * - Bottoni edit/delete
 *
 * Se inattivo: appare attenuato.
 */

import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format/currency";
import {
  getBudgetSeverity,
  PERIOD_LABELS_SHORT,
  useDeleteBudgetMutation,
  type BudgetStatus,
} from "@/lib/api/budgets";
import { BudgetProgressBar } from "./BudgetProgressBar";


interface BudgetCardProps {
  status: BudgetStatus;
  onEdit: (status: BudgetStatus) => void;
}

export function BudgetCard({ status, onEdit }: BudgetCardProps) {
  const deleteMutation = useDeleteBudgetMutation();
  
  const severity = getBudgetSeverity(status.percentage);
  const isInactive = !status.budget.is_active;
  
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
  
  // Formatta date "dd MMM" (es. "1 mag - 31 mag")
  const periodLabel = `${formatDateShort(status.period_start)} - ${formatDateShort(status.period_end)}`;
  
  // Determina colore importi
  const spentColor = {
    ok: "text-slate-100",
    warning: "text-amber-400",
    danger: "text-rose-400",
  }[severity];
  
  return (
    <div
      className={`
        p-4 bg-slate-900/50 rounded-lg space-y-3
        ${isInactive ? "opacity-50" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-slate-100 font-medium truncate">
              {status.category_name ?? "Budget generico"}
            </h3>
            {isInactive && <Badge>inattivo</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {PERIOD_LABELS_SHORT[status.budget.period].replace("/", "Budget ")}
            {" · "}
            {periodLabel}
          </p>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <IconButton onClick={() => onEdit(status)} aria-label="Modifica" title="Modifica">
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
      
      {/* Numeri grandi */}
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-2xl font-bold tabular-nums ${spentColor}`}>
          {formatCurrency(status.spent)}
        </span>
        <span className="text-sm text-slate-500 tabular-nums">
          su {formatCurrency(status.budget.amount_limit)}
        </span>
      </div>
      
      {/* Barra */}
      <BudgetProgressBar percentage={status.percentage} />
      
      {/* Residuo */}
      <div className="flex items-baseline justify-between pt-1 border-t border-slate-800 text-sm">
        <span className="text-slate-500">
          {Number(status.remaining) >= 0 ? "Restano" : "Hai sforato di"}
        </span>
        <span
          className={`tabular-nums font-medium ${
            Number(status.remaining) >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {formatCurrency(Math.abs(Number(status.remaining)))}
        </span>
      </div>
    </div>
  );
}


// Helper locale: "2026-05-01" → "1 mag"
function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}