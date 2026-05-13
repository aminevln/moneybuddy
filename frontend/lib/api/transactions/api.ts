/**
 * Chiamate HTTP per /transactions.
 */

import { apiFetch } from "@/lib/api/client";
import type {
  Transaction,
  TransactionCreatePayload,
  TransactionListFilters,
  TransactionListResponse,
  TransactionUpdatePayload,
} from "./types";


/**
 * Costruisce query string dai filtri, omettendo i valori undefined/null.
 */
function buildQueryString(filters: TransactionListFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}


export async function listTransactions(
  filters: TransactionListFilters = {}
): Promise<TransactionListResponse> {
  return apiFetch<TransactionListResponse>(`/transactions${buildQueryString(filters)}`);
}


export async function getTransaction(id: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`);
}


export async function createTransaction(
  payload: TransactionCreatePayload
): Promise<Transaction> {
  return apiFetch<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateTransaction(
  id: string,
  payload: TransactionUpdatePayload
): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function voidTransaction(id: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`, {
    method: "DELETE",
  });
}