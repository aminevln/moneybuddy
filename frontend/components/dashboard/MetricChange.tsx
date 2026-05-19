/**
 * Mostra un delta numerico con icona, segno e colore semantico.
 *
 * Es: +€350 in verde con freccia su, -€120 in rosso con freccia giù.
 */

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { formatCurrency } from "@/lib/format/currency";


interface MetricChangeProps {
  delta: string | number;
  /** Se true, "positivo è cattivo" (es. spese in aumento) */
  inverted?: boolean;
}


export function MetricChange({ delta, inverted = false }: MetricChangeProps) {
  const value = typeof delta === "string" ? Number(delta) : delta;
  
  // Caso "invariato"
  if (!Number.isFinite(value) || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-fg-muted tabular-nums">
        <Minus className="w-3 h-3" aria-hidden />
        <span>invariato</span>
      </span>
    );
  }
  
  const isPositive = value > 0;
  
  // Logica colore:
  // - Crescita ENTRATE → positivo (verde)
  // - Crescita SPESE (inverted=true) → negativo (rosso)
  const isGood = inverted ? !isPositive : isPositive;
  
  const colorClass = isGood ? "text-success" : "text-danger";
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const sign = isPositive ? "+" : "−";
  
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${colorClass}`}>
      <Icon className="w-3 h-3" aria-hidden />
      <span>{sign}{formatCurrency(Math.abs(value))}</span>
    </span>
  );
}