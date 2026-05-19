/**
 * Barra di progresso per un budget.
 *
 * Comportamento:
 * - 0-69%: verde (success)
 * - 70-99%: arancione (warning)
 * - 100%+: rosso (danger)
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
  
  // Mappa severity → token semantici
  const colorMap = {
    ok: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  
  const labelColorMap = {
    ok: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };
  
  return (
    <div className="space-y-1">
      <div
        className="h-1.5 bg-bg-elevated rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${colorMap[severity]}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className={`text-xs text-right tabular-nums font-medium ${labelColorMap[severity]}`}>
          {pct.toFixed(0)}% usato
        </div>
      )}
    </div>
  );
}