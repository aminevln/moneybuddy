import { apiFetch } from "@/lib/api/client";
import type {
  Budget,
  BudgetCreatePayload,
  BudgetStatus,
  BudgetUpdatePayload,
} from "./types";


export async function listBudgets(): Promise<Budget[]> {
  return apiFetch<Budget[]>("/budgets");
}


export async function listBudgetStatus(
  onlyActive: boolean = true
): Promise<BudgetStatus[]> {
  const qs = onlyActive ? "" : "?only_active=false";
  return apiFetch<BudgetStatus[]>(`/budgets/status${qs}`);
}


export async function getBudget(id: string): Promise<Budget> {
  return apiFetch<Budget>(`/budgets/${id}`);
}


export async function createBudget(
  payload: BudgetCreatePayload
): Promise<Budget> {
  return apiFetch<Budget>("/budgets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateBudget(
  id: string,
  payload: BudgetUpdatePayload
): Promise<Budget> {
  return apiFetch<Budget>(`/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function deleteBudget(id: string): Promise<void> {
  await apiFetch<void>(`/budgets/${id}`, { method: "DELETE" });
}