"use client";

/**
 * Card di confronto del mese corrente vs precedente.
 *
 * Mostra:
 * - Entrate del mese con delta
 * - Uscite del mese con delta
 * - Netto (entrate - uscite) in evidenza
 */

import { Calendar, TrendingDown, TrendingUp } from "lucide-react";

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
  const isNetPositive = net >= 0;
  
  // Mese corrente in formato "Maggio 2026"
  const monthLabel = new Date(data.current_month_start).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
  
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-fg-muted" />
          <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium capitalize">
            {monthLabel}
          </div>
        </div>
        <div className="text-xs text-fg-muted">
          vs mese precedente
        </div>
      </div>
      
      {/* Entrate + Uscite */}
      <div className="grid grid-cols-2 gap-5 mb-4">
        <MetricBlock
          icon={<TrendingUp className="w-3.5 h-3.5 text-success" />}
          label="Entrate"
          value={data.current_month_income}
          delta={data.income_delta}
          accentColor="text-success"
        />
        <MetricBlock
          icon={<TrendingDown className="w-3.5 h-3.5 text-danger" />}
          label="Uscite"
          value={data.current_month_expense}
          delta={data.expense_delta}
          accentColor="text-danger"
          invertedDelta
        />
      </div>
      
      {/* Netto del mese */}
      <div className="pt-4 border-t border-border-muted">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-fg-secondary">Netto del mese</span>
          <span
            className={`
              font-display text-2xl font-bold tabular-nums tracking-tight
              ${isNetPositive ? "text-success" : "text-danger"}
            `}
          >
            {isNetPositive ? "+" : "−"}{formatCurrency(Math.abs(net))}
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
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  accentColor: string;
  invertedDelta?: boolean;
}


function MetricBlock({
  icon,
  label,
  value,
  delta,
  accentColor,
  invertedDelta = false,
}: MetricBlockProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-xs text-fg-secondary font-medium">{label}</span>
      </div>
      <div className={`font-display text-xl font-bold tabular-nums tracking-tight ${accentColor}`}>
        {formatCurrency(value)}
      </div>
      <div className="mt-1">
        <MetricChange delta={delta} inverted={invertedDelta} />
      </div>
    </div>
  );
}