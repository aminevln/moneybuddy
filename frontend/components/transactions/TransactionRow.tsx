"use client";

/**
 * Singola riga della lista transazioni.
 *
 * Mostra:
 * - Direction emoji + amount (colorato)
 * - Description + merchant
 * - Categoria (chip)
 * - Bottoni Edit / Void
 *
 * Se voided: tutta la riga appare attenuata e barrata.
 */

import { Badge } from "@/components/ui/Badge";
import { ColorDot } from "@/components/ui/ColorDot";
import { IconButton } from "@/components/ui/IconButton";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  DIRECTION_COLOR,
  DIRECTION_EMOJI,
  useVoidTransactionMutation,
  type Transaction,
} from "@/lib/api/transactions";
import { formatTime } from "@/lib/format/date";
import { formatCurrency } from "@/lib/format/currency";


interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction, onEdit }: TransactionRowProps) {
  const voidMutation = useVoidTransactionMutation();
  const { data: categories } = useCategoriesQuery();
  
  const category = categories?.find((c) => c.id === transaction.category_id);
  const isVoided = transaction.voided_at !== null;
  
  // Segno del numero: + per income, - per expense (visivamente, l'amount è sempre positivo)
  const sign = transaction.direction === "income" ? "+" : "−";
  
  async function handleVoid() {
    if (!confirm(`Annullare "${transaction.description}"? La transazione resterà nello storico.`)) return;
    try {
      await voidMutation.mutateAsync(transaction.id);
    } catch (err) {
      alert("Errore durante l'annullamento");
      console.error(err);
    }
  }
  
  return (
    <div
      className={`
        flex items-center justify-between gap-3 p-3 rounded-lg transition
        ${isVoided ? "bg-slate-900/30 opacity-60" : "bg-slate-900/50 hover:bg-slate-900/70"}
      `}
    >
      {/* Sinistra: descrizione + categoria */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="text-xl mt-0.5 flex-shrink-0" aria-hidden>
          {DIRECTION_EMOJI[transaction.direction]}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-slate-200 truncate ${isVoided ? "line-through" : ""}`}>
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span>{formatTime(transaction.occurred_at)}</span>
            {transaction.merchant && (
              <>
                <span>·</span>
                <span className="truncate">{transaction.merchant}</span>
              </>
            )}
            {category && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ColorDot color={category.color} size="sm" />
                  {category.name}
                </span>
              </>
            )}
            {isVoided && (
              <>
                <span>·</span>
                <Badge variant="danger">annullata</Badge>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Destra: amount + azioni */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`
            font-medium tabular-nums whitespace-nowrap
            ${isVoided ? "text-slate-500 line-through" : DIRECTION_COLOR[transaction.direction]}
          `}
        >
          {sign}{formatCurrency(transaction.amount)}
        </span>
        {!isVoided && (
          <div className="flex items-center gap-1">
            <IconButton
              onClick={() => onEdit(transaction)}
              aria-label="Modifica"
              title="Modifica"
            >
              ✏️
            </IconButton>
            <IconButton
              variant="danger"
              onClick={handleVoid}
              disabled={voidMutation.isPending}
              aria-label="Annulla"
              title="Annulla"
            >
              🗑️
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}