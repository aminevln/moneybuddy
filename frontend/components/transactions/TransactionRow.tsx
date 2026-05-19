"use client";

/**
 * Singola riga della lista transazioni.
 *
 * Mostra:
 * - Pallino direzione (income/expense) con icona Lucide
 * - Description + meta (ora, merchant, categoria)
 * - Amount colorato a destra
 * - Bottoni Edit / Void (IconButton)
 *
 * Se voided: tutta la riga appare attenuata e barrata.
 */

import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ColorDot } from "@/components/ui/ColorDot";
import { IconButton } from "@/components/ui/IconButton";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  type Transaction,
  useVoidTransactionMutation,
} from "@/lib/api/transactions";
import { formatCurrency } from "@/lib/format/currency";
import { formatTime } from "@/lib/format/date";


interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
}


export function TransactionRow({ transaction, onEdit }: TransactionRowProps) {
  const voidMutation = useVoidTransactionMutation();
  const { data: categories } = useCategoriesQuery();
  
  const category = categories?.find((c) => c.id === transaction.category_id);
  const isVoided = transaction.voided_at !== null;
  const isIncome = transaction.direction === "income";
  
  const sign = isIncome ? "+" : "−";
  const directionColor = isIncome ? "text-success" : "text-danger";
  const directionBg = isIncome ? "bg-success-soft" : "bg-danger-soft";
  const DirectionIcon = isIncome ? ArrowUpRight : ArrowDownRight;
  
  async function handleVoid() {
    if (
      !confirm(
        `Annullare "${transaction.description}"? La transazione resterà nello storico.`
      )
    )
      return;
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
        flex items-center gap-3 p-3 rounded-lg
        bg-bg-surface border border-border
        transition-all duration-150
        ${
          isVoided
            ? "opacity-50"
            : "hover:bg-bg-elevated hover:border-border-strong"
        }
      `}
    >
      {/* Pallino direzione */}
      <div
        className={`
          shrink-0 inline-flex items-center justify-center
          w-9 h-9 rounded-full
          ${directionBg}
        `}
      >
        <DirectionIcon className={`w-4 h-4 ${directionColor}`} />
      </div>
      
      {/* Descrizione + meta */}
      <div className="min-w-0 flex-1">
        <p
          className={`
            text-sm text-fg-primary truncate font-medium
            ${isVoided ? "line-through" : ""}
          `}
        >
          {transaction.description}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-fg-muted">
          <span className="tabular-nums">
            {formatTime(transaction.occurred_at)}
          </span>
          {transaction.merchant && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{transaction.merchant}</span>
            </>
          )}
          {category && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <ColorDot color={category.color} size="sm" />
                <span className="truncate">{category.name}</span>
              </span>
            </>
          )}
          {isVoided && (
            <>
              <span aria-hidden>·</span>
              <Badge variant="danger" size="sm">
                annullata
              </Badge>
            </>
          )}
        </div>
      </div>
      
      {/* Amount + azioni */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`
            text-sm font-semibold tabular-nums whitespace-nowrap
            ${
              isVoided
                ? "text-fg-muted line-through"
                : directionColor
            }
          `}
        >
          {sign}{formatCurrency(transaction.amount)}
        </span>
        
        {!isVoided && (
          <div className="flex items-center gap-0.5">
            <IconButton
              size="sm"
              onClick={() => onEdit(transaction)}
              aria-label="Modifica"
              title="Modifica"
            >
              <Pencil className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton
              size="sm"
              variant="danger"
              onClick={handleVoid}
              disabled={voidMutation.isPending}
              aria-label="Annulla"
              title="Annulla"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}