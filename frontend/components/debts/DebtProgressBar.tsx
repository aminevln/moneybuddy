/**
 * Barra di progresso "quanto del debito hai rimborsato".
 *
 * Es. mutuo 100k iniziali, residui 30k → 70% rimborsato.
 */

import { formatCurrency } from "@/lib/format/currency";


interface DebtProgressBarProps {
  original: string;
  remaining: string;
}


export function DebtProgressBar({
  original,
  remaining,
}: DebtProgressBarProps) {
  const orig = Number(original);
  const rem = Number(remaining);
  
  if (!Number.isFinite(orig) || orig <= 0) return null;
  
  const paid = Math.max(0, orig - rem);
  const pct = Math.min(100, Math.round((paid / orig) * 100));
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-fg-secondary tabular-nums">
          <span className="text-success font-semibold">
            {formatCurrency(paid)}
          </span>
          <span className="text-fg-muted ml-1">rimborsato</span>
        </span>
        <span className="text-fg-primary font-semibold tabular-nums">
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 bg-bg-elevated rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-success rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-fg-muted tabular-nums uppercase tracking-wider font-medium">
        <span>Residuo · {formatCurrency(remaining)}</span>
        <span>Iniziale · {formatCurrency(original)}</span>
      </div>
    </div>
  );
}