import { apiFetch } from "@/lib/api/client";
import type {
  Debt,
  DebtCreatePayload,
  DebtUpdatePayload,
} from "./types";


export async function listDebts(): Promise<Debt[]> {
  return apiFetch<Debt[]>("/debts");
}


export async function getDebt(id: string): Promise<Debt> {
  return apiFetch<Debt>(`/debts/${id}`);
}


export async function createDebt(payload: DebtCreatePayload): Promise<Debt> {
  return apiFetch<Debt>("/debts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateDebt(
  id: string,
  payload: DebtUpdatePayload
): Promise<Debt> {
  return apiFetch<Debt>(`/debts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function deleteDebt(id: string): Promise<void> {
  await apiFetch<void>(`/debts/${id}`, { method: "DELETE" });
}