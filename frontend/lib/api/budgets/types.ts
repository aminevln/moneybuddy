/**
 * Tipi per Budget. Match con app/schemas/budget.py.
 */


export type BudgetPeriod = "weekly" | "monthly" | "yearly";


export interface Budget {
  id: string;
  category_id: string | null;
  period: BudgetPeriod;
  amount_limit: string;        // Decimal arriva come stringa
  starts_on: string;           // ISO date
  ends_on: string | null;
  is_active: boolean;
}


export interface BudgetStatus {
  budget: Budget;
  spent: string;
  remaining: string;
  percentage: string;          // 0 - 100+ (può sforare)
  period_start: string;
  period_end: string;
  category_name: string | null;
}


export interface BudgetCreatePayload {
  category_id?: string | null;
  period: BudgetPeriod;
  amount_limit: number;
  starts_on?: string;
  ends_on?: string;
  is_active?: boolean;
}


export interface BudgetUpdatePayload {
  category_id?: string | null;
  amount_limit?: number;
  ends_on?: string | null;
  is_active?: boolean;
}


// ============================================================
// LABELS & HELPERS
// ============================================================

export const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  weekly: "Settimanale",
  monthly: "Mensile",
  yearly: "Annuale",
};


export const PERIOD_LABELS_SHORT: Record<BudgetPeriod, string> = {
  weekly: "/settimana",
  monthly: "/mese",
  yearly: "/anno",
};


/**
 * Restituisce uno stato semantico in base alla percentuale spesa:
 * - "ok": <70%
 * - "warning": 70-99%
 * - "danger": 100%+
 */
export function getBudgetSeverity(
  percentage: string | number
): "ok" | "warning" | "danger" {
  const pct = typeof percentage === "string" ? Number(percentage) : percentage;
  if (pct >= 100) return "danger";
  if (pct >= 70) return "warning";
  return "ok";
}