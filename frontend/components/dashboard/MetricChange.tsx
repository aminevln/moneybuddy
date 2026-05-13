/**
 * Mostra un delta numerico con segno e colore.
 * 
 * Es: +€350 in verde, -€120 in rosso.
 */

import { formatCurrency } from "@/lib/format/currency";


interface MetricChangeProps {
  delta: string | number;
  /** Se true, "positivo è cattivo" (es. spese in aumento) */
  inverted?: boolean;
}

export function MetricChange({ delta, inverted = false }: MetricChangeProps) {
  const value = typeof delta === "string" ? Number(delta) : delta;
  
  if (!Number.isFinite(value) || value === 0) {
    return (
      <span className="text-xs text-slate-500 tabular-nums">
        invariato
      </span>
    );
  }
  
  const isPositive = value > 0;
  
  // Logica del colore:
  // - Crescita di ENTRATE: positivo (verde)
  // - Crescita di SPESE (inverted=true): negativo (rosso)
  const isGood = inverted ? !isPositive : isPositive;
  
  const colorClass = isGood ? "text-emerald-400" : "text-rose-400";
  const arrow = isPositive ? "↑" : "↓";
  const sign = isPositive ? "+" : "−";
  
  return (
    <span className={`text-xs tabular-nums ${colorClass}`}>
      {arrow} {sign}{formatCurrency(Math.abs(value))}
    </span>
  );
}