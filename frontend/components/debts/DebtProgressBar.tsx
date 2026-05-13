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

export function DebtProgressBar({ original, remaining }: DebtProgressBarProps) {
  const orig = Number(original);
  const rem = Number(remaining);
  
  if (!Number.isFinite(orig) || orig <= 0) return null;
  
  const paid = Math.max(0, orig - rem);
  const pct = Math.min(100, Math.round((paid / orig) * 100));
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatCurrency(paid)} rimborsato</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Residuo: {formatCurrency(remaining)}</span>
        <span>Iniziale: {formatCurrency(original)}</span>
      </div>
    </div>
  );
}