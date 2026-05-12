/**
 * Tipi per Account. Devono matchare app/schemas/account.py
 * e app/models/enums.py (AccountType).
 */


// Esattamente come i valori dell'enum Postgres (lowercase)
export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "meal_voucher"
  | "credit_card"
  | "investment";


export interface Account {
  id: string;
  name: string;
  type: AccountType;
  current_balance: string;   // Decimal arriva come stringa
  is_spendable: boolean;
  created_at: string;
}


export interface AccountsSummary {
  total_spendable: string;
  total_meal_vouchers: string;
  total_investments: string;
  total_all: string;
  accounts_count: number;
}


export interface AccountCreatePayload {
  name: string;
  type: AccountType;
  initial_balance?: number;
  is_spendable?: boolean;
}


export interface AccountUpdatePayload {
  name?: string;
  is_spendable?: boolean;
}


// ============================================================
// LABELS & METADATA PER UI
// ============================================================

/**
 * Labels italiane per ogni tipo. Mostrato in select, badge, ecc.
 */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Conto corrente",
  savings: "Conto deposito",
  cash: "Contanti",
  meal_voucher: "Buoni pasto",
  credit_card: "Carta di credito",
  investment: "Investimento",
};


/**
 * Default ragionevole per is_spendable in base al tipo.
 * - Conto/Cash → spendibile
 * - Buoni pasto/Investimento → NO (non sono "liquidità per la spesa")
 * - Credit card / Savings → spendibile sì, ma con cautela
 */
export const ACCOUNT_TYPE_DEFAULT_SPENDABLE: Record<AccountType, boolean> = {
  checking: true,
  savings: true,
  cash: true,
  meal_voucher: false,
  credit_card: true,
  investment: false,
};


/**
 * Ordine "logico" per visualizzazione (più liquido prima).
 */
export const ACCOUNT_TYPES_ORDER: AccountType[] = [
  "checking",
  "savings",
  "cash",
  "credit_card",
  "meal_voucher",
  "investment",
];


/**
 * Emoji indicativa per ogni tipo (placeholder finché non avremo icone vere).
 */
export const ACCOUNT_TYPE_EMOJI: Record<AccountType, string> = {
  checking: "🏦",
  savings: "💰",
  cash: "💵",
  meal_voucher: "🍽️",
  credit_card: "💳",
  investment: "📈",
};