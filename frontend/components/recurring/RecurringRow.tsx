"use client";

/**
 * Singola riga della lista spese fisse (ricorrenti).
 */

import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Pencil,
  Repeat,
  Trash2,
} from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";
import {
  type RecurringTransaction,
  FREQUENCY_LABELS_SHORT,
  useDeleteRecurringMutation,
} from "@/lib/api/recurring";
import { formatCurrency } from "@/lib/format/currency";


interface RecurringRowProps {
  item: RecurringTransaction;
  onEdit: (item: RecurringTransaction) => void;
}


export function RecurringRow({ item, onEdit }: RecurringRowProps) {
  const deleteMutation = useDeleteRecurringMutation();
  
  const isIncome = item.direction === "income";
  // Icona e colore variano per income/expense
  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
  const iconColor = isIncome ? "var(--color-success)" : "var(--color-danger)";
  
  // Importo con segno + colore
  const amountSign = isIncome ? "+" : "-";
  const amountColor = isIncome ? "text-success" : "text-fg-primary";
  
  // Data della prossima occorrenza in formato breve "21 mag"
  const nextDate = new Date(item.next_occurrence);
  const formattedDate = nextDate.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
  
  async function handleDelete() {
    if (!confirm(`Eliminare "${item.description}"?`)) return;
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante l'eliminazione";
      alert(message);
      console.error(err);
    }
  }
  
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg
        bg-bg-surface border border-border
        transition-all duration-150
        ${!item.is_active ? "opacity-60" : ""}
      `}
    >
      {/* Icona direzione (income/expense) */}
      <div
        className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg"
        style={{
          backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      
      {/* Descrizione + meta */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg-primary truncate font-medium">
          {item.description}
          {!item.is_active && (
            <span className="ml-2 text-xs text-fg-muted">(pausa)</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <Repeat className="w-3 h-3" aria-hidden />
            {FREQUENCY_LABELS_SHORT[item.frequency]}
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" aria-hidden />
            prossima: {formattedDate}
          </span>
        </div>
      </div>
      
      {/* Amount + azioni */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`font-display text-sm font-semibold tabular-nums whitespace-nowrap ${amountColor}`}
        >
          {amountSign}
          {formatCurrency(item.amount)}
        </span>
        
        <div className="flex items-center gap-0.5">
          <IconButton
            size="sm"
            onClick={() => onEdit(item)}
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
    </div>
  );
}