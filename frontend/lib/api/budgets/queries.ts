import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBudget,
  deleteBudget,
  getBudget,
  listBudgets,
  listBudgetStatus,
  updateBudget,
} from "./api";
import type {
  Budget,
  BudgetCreatePayload,
  BudgetUpdatePayload,
} from "./types";


export const budgetKeys = {
  all: ["budgets"] as const,
  list: ["budgets", "list"] as const,
  status: (onlyActive: boolean) => ["budgets", "status", onlyActive] as const,
  detail: (id: string) => ["budgets", id] as const,
};


// ============================================================
// QUERIES
// ============================================================

export function useBudgetsQuery() {
  return useQuery({
    queryKey: budgetKeys.list,
    queryFn: listBudgets,
  });
}


export function useBudgetStatusQuery(onlyActive: boolean = true) {
  return useQuery({
    queryKey: budgetKeys.status(onlyActive),
    queryFn: () => listBudgetStatus(onlyActive),
  });
}


export function useBudgetQuery(id: string) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => getBudget(id),
    enabled: !!id,
  });
}


// ============================================================
// MUTATIONS
// ============================================================

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  // Invalida tutto sotto "budgets" (lista, status onlyActive=true, =false, detail singolo)
  queryClient.invalidateQueries({ queryKey: budgetKeys.all });
}


export function useCreateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetCreatePayload) => createBudget(payload),
    onSuccess: () => invalidateAll(queryClient),
  });
}


export function useUpdateBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BudgetUpdatePayload }) =>
      updateBudget(id, payload),
    onSuccess: (updated: Budget) => {
      queryClient.setQueryData(budgetKeys.detail(updated.id), updated);
      invalidateAll(queryClient);
    },
  });
}


export function useDeleteBudgetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: budgetKeys.detail(id) });
      invalidateAll(queryClient);
    },
  });
}