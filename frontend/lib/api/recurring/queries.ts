/**
 * Hooks TanStack Query per RecurringTransaction.
 *
 * Dopo ogni mutation invalidiamo la lista. Le query attive
 * (componenti montati) si rifetchano automaticamente.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRecurring,
  deleteRecurring,
  getRecurring,
  listRecurring,
  updateRecurring,
} from "./api";
import type {
  RecurringTransaction,
  RecurringTransactionCreatePayload,
  RecurringTransactionUpdatePayload,
} from "./types";


export const recurringKeys = {
  all: ["recurring"] as const,
  list: (onlyActive: boolean) => ["recurring", "list", { onlyActive }] as const,
  detail: (id: string) => ["recurring", id] as const,
};


// ============================================================
// QUERIES
// ============================================================

export function useRecurringQuery(options?: { onlyActive?: boolean }) {
  const onlyActive = options?.onlyActive ?? false;
  return useQuery({
    queryKey: recurringKeys.list(onlyActive),
    queryFn: () => listRecurring({ onlyActive }),
  });
}


export function useRecurringDetailQuery(id: string) {
  return useQuery({
    queryKey: recurringKeys.detail(id),
    queryFn: () => getRecurring(id),
    enabled: !!id,
  });
}


// ============================================================
// MUTATIONS
// ============================================================

/**
 * Helper interno: invalida tutte le liste recurring dopo una write.
 * Usa il prefix `recurringKeys.all` così invalida sia
 * list({onlyActive: true}) che list({onlyActive: false}).
 */
function invalidateRecurring(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: recurringKeys.all });
}


export function useCreateRecurringMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecurringTransactionCreatePayload) =>
      createRecurring(payload),
    onSuccess: () => invalidateRecurring(queryClient),
  });
}


export function useUpdateRecurringMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: RecurringTransactionUpdatePayload;
    }) => updateRecurring(id, payload),
    onSuccess: (updated: RecurringTransaction) => {
      queryClient.setQueryData(recurringKeys.detail(updated.id), updated);
      invalidateRecurring(queryClient);
    },
  });
}


export function useDeleteRecurringMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecurring(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: recurringKeys.detail(id) });
      invalidateRecurring(queryClient);
    },
  });
}