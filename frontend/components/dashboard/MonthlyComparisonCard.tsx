"use client";

/**
 * Card di confronto del mese corrente vs precedente.
 *
 * Mostra:
 * - Entrate del mese
 * - Uscite del mese
 * - Netto (entrate - uscite)
 * - Per ognuna: delta vs mese precedente
 */

import type { MonthlyComparison } from "@/lib/api/analytics";
import { formatCurrency } from "@/lib/format/currency";
import { MetricChange } from "./MetricChange";


interface MonthlyComparisonCardProps {
  data: MonthlyComparison;
}

export function MonthlyComparisonCard({ data }: MonthlyComparisonCardProps) {
  const income = Number(data.current_month_income);
  const expense = Number(data.current_month_expense);
  const net = income - expense;
  
  // Mese corrente in formato "Maggio 2026"
  const monthLabel = new Date(data.current_month_start).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          {monthLabel}
        </div>
        <div className="text-xs text-slate-500">
          vs mese precedente
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <MetricBlock
          label="Entrate"
          value={data.current_month_income}
          delta={data.income_delta}
          accentColor="text-emerald-400"
        />
        <MetricBlock
          label="Uscite"
          value={data.current_month_expense}
          delta={data.expense_delta}
          accentColor="text-rose-400"
          invertedDelta
        />
      </div>
      
      {/* Netto */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-slate-400">Netto del mese</span>
          <span
            className={`text-xl font-bold tabular-nums ${
              net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(net))}
          </span>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// SUB-COMPONENT
// ============================================================

interface MetricBlockProps {
  label: string;
  value: string;
  delta: string;
  accentColor: string;
  invertedDelta?: boolean;
}

function MetricBlock({
  label,
  value,
  delta,
  accentColor,
  invertedDelta = false,
}: MetricBlockProps) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${accentColor}`}>
        {formatCurrency(value)}
      </div>
      <div className="mt-1">
        <MetricChange delta={delta} inverted={invertedDelta} />
      </div>
    </div>
  );
}