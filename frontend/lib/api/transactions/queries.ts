/**
 * Hooks TanStack Query per Transaction.
 *
 * Pattern: dopo ogni mutation invalidiamo tutte le liste,
 * il summary degli accounts (perché il balance è cambiato) e
 * la transazione singola.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { accountKeys } from "@/lib/api/accounts";
import {
  createTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
  voidTransaction,
} from "./api";
import type {
  Transaction,
  TransactionCreatePayload,
  TransactionListFilters,
  TransactionUpdatePayload,
} from "./types";


export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionListFilters) => ["transactions", "list", filters] as const,
  detail: (id: string) => ["transactions", id] as const,
};


// ============================================================
// QUERIES
// ============================================================

export function useTransactionsQuery(filters: TransactionListFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => listTransactions(filters),
  });
}


export function useTransactionQuery(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => getTransaction(id),
    enabled: !!id,
  });
}


// ============================================================
// MUTATIONS
// ============================================================

/**
 * Helper: dopo ogni mutation, invalida:
 * - tutte le liste di transazioni (i filtri possono variare)
 * - il summary degli accounts (il balance è cambiato)
 * - la lista accounts (idem)
 */
function invalidateRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  queryClient.invalidateQueries({ queryKey: accountKeys.all });
  queryClient.invalidateQueries({ queryKey: accountKeys.summary });
}


export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionCreatePayload) => createTransaction(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
}


export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TransactionUpdatePayload }) =>
      updateTransaction(id, payload),
    onSuccess: (updated: Transaction) => {
      queryClient.setQueryData(transactionKeys.detail(updated.id), updated);
      invalidateRelated(queryClient);
    },
  });
}


export function useVoidTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidTransaction(id),
    onSuccess: (voided: Transaction) => {
      queryClient.setQueryData(transactionKeys.detail(voided.id), voided);
      invalidateRelated(queryClient);
    },
  });
}