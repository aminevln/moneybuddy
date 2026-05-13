/**
 * Tipi per Debt. Match con app/schemas/debt.py.
 *
 * Note importanti:
 * - interest_rate è espresso come DECIMALE (es. 0.025 per 2.5%).
 *   Quando lo mostriamo all'utente lo moltiplichiamo × 100.
 *   Quando l'utente lo inserisce, dividiamo per 100.
 */


export interface Debt {
  id: string;
  creditor: string;
  original_amount: string;       // Decimal arriva come stringa
  remaining_amount: string;
  interest_rate: string | null;  // 0.025 → "0.0250"
  monthly_payment: string | null;
  due_date: string | null;       // ISO date "YYYY-MM-DD"
  notes: string | null;
}


export interface DebtCreatePayload {
  creditor: string;
  original_amount: number;
  remaining_amount: number;
  interest_rate?: number;        // 0-9.9999
  monthly_payment?: number;
  due_date?: string;             // ISO date
  notes?: string;
}


export interface DebtUpdatePayload {
  creditor?: string;
  remaining_amount?: number;
  interest_rate?: number;
  monthly_payment?: number;
  due_date?: string;
  notes?: string;
}


// ============================================================
// HELPERS
// ============================================================

/**
 * "0.0250" → "2.50" (per visualizzazione)
 */
export function decimalToPercent(decimal: string | number | null): string {
  if (decimal === null) return "—";
  const n = typeof decimal === "string" ? Number(decimal) : decimal;
  if (!Number.isFinite(n)) return "—";
  return (n * 100).toFixed(2);
}


/**
 * "2.5" (utente) → 0.025 (backend)
 */
export function percentToDecimal(percent: number | string): number {
  const n = typeof percent === "string" ? Number(percent) : percent;
  return n / 100;
}