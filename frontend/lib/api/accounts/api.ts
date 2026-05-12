/**
 * Chiamate HTTP per /accounts.
 */

import { apiFetch } from "@/lib/api/client";
import type {
  Account,
  AccountCreatePayload,
  AccountsSummary,
  AccountUpdatePayload,
} from "./types";


export async function listAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>("/accounts");
}


export async function getAccountsSummary(): Promise<AccountsSummary> {
  return apiFetch<AccountsSummary>("/accounts/summary");
}


export async function getAccount(id: string): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`);
}


export async function createAccount(payload: AccountCreatePayload): Promise<Account> {
  return apiFetch<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateAccount(
  id: string,
  payload: AccountUpdatePayload
): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function deleteAccount(id: string): Promise<void> {
  await apiFetch<void>(`/accounts/${id}`, { method: "DELETE" });
}