/**
 * Barra di progresso per un budget.
 *
 * Comportamento:
 * - 0-69%: verde
 * - 70-99%: arancione
 * - 100%+: rosso
 *
 * Quando >100%, la barra resta a 100% visivo ma il numero mostra la realtà
 * (es. "115%"). Così evitiamo barre che escono dal container.
 */

import { getBudgetSeverity } from "@/lib/api/budgets";


interface BudgetProgressBarProps {
  percentage: string | number;
  /** Mostra il numero % accanto alla barra */
  showLabel?: boolean;
}

export function BudgetProgressBar({
  percentage,
  showLabel = true,
}: BudgetProgressBarProps) {
  const pct = typeof percentage === "string" ? Number(percentage) : percentage;
  const severity = getBudgetSeverity(pct);
  
  const widthPercent = Math.min(100, Math.max(0, pct));
  
  // Mappa severity → colore Tailwind
  const colorMap = {
    ok: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  };
  
  const labelColorMap = {
    ok: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-rose-400",
  };
  
  return (
    <div className="space-y-1">
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${colorMap[severity]}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className={`text-xs text-right tabular-nums ${labelColorMap[severity]}`}>
          {pct.toFixed(0)}% usato
        </div>
      )}
    </div>
  );
}