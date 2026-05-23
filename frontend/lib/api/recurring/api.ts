/**
 * Chiamate HTTP per /recurring-transactions.
 */

import { apiFetch } from "@/lib/api/client";
import type {
  RecurringTransaction,
  RecurringTransactionCreatePayload,
  RecurringTransactionUpdatePayload,
} from "./types";


export async function listRecurring(
  options?: { onlyActive?: boolean }
): Promise<RecurringTransaction[]> {
  const params = options?.onlyActive ? "?only_active=true" : "";
  return apiFetch<RecurringTransaction[]>(`/recurring-transactions${params}`);
}


export async function getRecurring(id: string): Promise<RecurringTransaction> {
  return apiFetch<RecurringTransaction>(`/recurring-transactions/${id}`);
}


export async function createRecurring(
  payload: RecurringTransactionCreatePayload
): Promise<RecurringTransaction> {
  return apiFetch<RecurringTransaction>("/recurring-transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateRecurring(
  id: string,
  payload: RecurringTransactionUpdatePayload
): Promise<RecurringTransaction> {
  return apiFetch<RecurringTransaction>(`/recurring-transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function deleteRecurring(id: string): Promise<void> {
  await apiFetch<void>(`/recurring-transactions/${id}`, { method: "DELETE" });
}