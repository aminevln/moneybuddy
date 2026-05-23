/**
 * Tipi per RecurringTransaction. Devono matchare app/schemas/recurring_transaction.py
 * e app/models/enums.py (RecurrenceFreq, TxnDirection).
 */

// ============================================================
// ENUMS (matchano i valori Postgres)
// ============================================================

export type RecurrenceFreq =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export type TxnDirection = "income" | "expense" | "transfer";


// ============================================================
// MODELLI
// ============================================================

export interface RecurringTransaction {
  id: string;
  account_id: string;
  category_id: string | null;
  direction: TxnDirection;
  frequency: RecurrenceFreq;
  amount: string;          // Decimal arriva come stringa
  description: string;
  day_of_month: number | null;
  next_occurrence: string; // ISO date (YYYY-MM-DD)
  end_date: string | null;
  is_active: boolean;
}

export interface RecurringTransactionCreatePayload {
  account_id: string;
  category_id?: string | null;
  direction: TxnDirection;
  frequency: RecurrenceFreq;
  amount: number;
  description: string;
  day_of_month?: number | null;
  next_occurrence: string;     // ISO date
  end_date?: string | null;
  is_active?: boolean;
}

export interface RecurringTransactionUpdatePayload {
  account_id?: string;
  category_id?: string | null;
  direction?: TxnDirection;
  frequency?: RecurrenceFreq;
  amount?: number;
  description?: string;
  day_of_month?: number | null;
  next_occurrence?: string;
  end_date?: string | null;
  is_active?: boolean;
}


// ============================================================
// LABELS & METADATA PER UI
// ============================================================

/**
 * Labels italiane per ogni frequenza. Usate nei select e nei badge.
 */
export const FREQUENCY_LABELS: Record<RecurrenceFreq, string> = {
  daily: "Ogni giorno",
  weekly: "Ogni settimana",
  biweekly: "Ogni 2 settimane",
  monthly: "Ogni mese",
  yearly: "Ogni anno",
};

/**
 * Versione breve per liste compatte.
 */
export const FREQUENCY_LABELS_SHORT: Record<RecurrenceFreq, string> = {
  daily: "giornaliera",
  weekly: "settimanale",
  biweekly: "ogni 2 sett.",
  monthly: "mensile",
  yearly: "annuale",
};

/**
 * Labels italiane per la direzione della transazione.
 * Le ricorrenti tipiche sono expense (spese) e income (entrate);
 * `transfer` è raro ma supportato per coerenza col DB.
 */
export const DIRECTION_LABELS: Record<TxnDirection, string> = {
  expense: "Spesa",
  income: "Entrata",
  transfer: "Trasferimento",
};

/**
 * Ordine "logico" delle frequenze per la dropdown (più frequente prima).
 */
export const FREQUENCY_ORDER: RecurrenceFreq[] = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
];

/**
 * Helper: quante volte cade una ricorrenza al mese (media).
 * Utile per calcoli "spesa mensile equivalente".
 */
export const FREQUENCY_TIMES_PER_MONTH: Record<RecurrenceFreq, number> = {
  daily: 30,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1,
  yearly: 1 / 12,
};