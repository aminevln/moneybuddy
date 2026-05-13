import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDebt,
  deleteDebt,
  getDebt,
  listDebts,
  updateDebt,
} from "./api";
import type { Debt, DebtCreatePayload, DebtUpdatePayload } from "./types";


export const debtKeys = {
  all: ["debts"] as const,
  detail: (id: string) => ["debts", id] as const,
};


export function useDebtsQuery() {
  return useQuery({
    queryKey: debtKeys.all,
    queryFn: listDebts,
  });
}


export function useDebtQuery(id: string) {
  return useQuery({
    queryKey: debtKeys.detail(id),
    queryFn: () => getDebt(id),
    enabled: !!id,
  });
}


export function useCreateDebtMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DebtCreatePayload) => createDebt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtKeys.all });
    },
  });
}


export function useUpdateDebtMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DebtUpdatePayload }) =>
      updateDebt(id, payload),
    onSuccess: (updated: Debt) => {
      queryClient.setQueryData(debtKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: debtKeys.all });
    },
  });
}


export function useDeleteDebtMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDebt(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: debtKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: debtKeys.all });
    },
  });
}