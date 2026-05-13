/**
 * Tipi per Transaction. Match con app/schemas/transaction.py
 */


export type TxnDirection = "income" | "expense" | "transfer";
export type TxnStatus = "planned" | "pending" | "cleared" | "voided";


export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  direction: TxnDirection;
  status: TxnStatus;
  amount: string;             // Decimal arriva come stringa
  description: string;
  merchant: string | null;
  occurred_at: string;        // ISO datetime
  recorded_at: string;
  voided_at: string | null;
  metadata: Record<string, unknown>;
}


export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}


export interface TransactionCreatePayload {
  account_id: string;
  category_id?: string | null;
  direction: TxnDirection;
  amount: number;
  description: string;
  merchant?: string | null;
  occurred_at: string;        // ISO datetime
  metadata?: Record<string, unknown>;
  status?: TxnStatus;
}


export interface TransactionUpdatePayload {
  description?: string;
  merchant?: string | null;
  category_id?: string | null;
  occurred_at?: string;
  metadata?: Record<string, unknown>;
}


export interface TransactionListFilters {
  page?: number;
  page_size?: number;
  include_voided?: boolean;
  account_id?: string;
  category_id?: string;
  direction?: TxnDirection;
  date_from?: string;
  date_to?: string;
}


// ============================================================
// LABELS & METADATA UI
// ============================================================

export const DIRECTION_LABELS: Record<TxnDirection, string> = {
  income: "Entrata",
  expense: "Uscita",
  transfer: "Trasferimento",
};


export const DIRECTION_EMOJI: Record<TxnDirection, string> = {
  income: "⬆️",
  expense: "⬇️",
  transfer: "↔️",
};


export const DIRECTION_COLOR: Record<TxnDirection, string> = {
  income: "text-emerald-400",
  expense: "text-rose-400",
  transfer: "text-slate-400",
};


export const STATUS_LABELS: Record<TxnStatus, string> = {
  planned: "Pianificata",
  pending: "In attesa",
  cleared: "Confermata",
  voided: "Annullata",
};