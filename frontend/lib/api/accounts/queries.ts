/**
 * Hooks TanStack Query per Account.
 *
 * Importante: dopo ogni mutation invalidiamo SIA accountKeys.all
 * SIA accountKeys.summary, perché il summary dipende dagli account.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAccount,
  deleteAccount,
  getAccount,
  getAccountsSummary,
  listAccounts,
  updateAccount,
} from "./api";
import type {
  Account,
  AccountCreatePayload,
  AccountUpdatePayload,
} from "./types";


export const accountKeys = {
  all: ["accounts"] as const,
  summary: ["accounts", "summary"] as const,
  detail: (id: string) => ["accounts", id] as const,
};


// ============================================================
// QUERIES
// ============================================================

export function useAccountsQuery() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: listAccounts,
  });
}


export function useAccountsSummaryQuery() {
  return useQuery({
    queryKey: accountKeys.summary,
    queryFn: getAccountsSummary,
  });
}


export function useAccountQuery(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => getAccount(id),
    enabled: !!id,
  });
}


// ============================================================
// MUTATIONS
// ============================================================

/**
 * Helper interno: invalida lista + summary dopo ogni write.
 * Le query attive (componenti montati) si rifetchano automaticamente.
 */
function invalidateAccountsAndSummary(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: accountKeys.all });
  queryClient.invalidateQueries({ queryKey: accountKeys.summary });
}


export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AccountCreatePayload) => createAccount(payload),
    onSuccess: () => invalidateAccountsAndSummary(queryClient),
  });
}


export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AccountUpdatePayload }) =>
      updateAccount(id, payload),
    onSuccess: (updated: Account) => {
      queryClient.setQueryData(accountKeys.detail(updated.id), updated);
      invalidateAccountsAndSummary(queryClient);
    },
  });
}


export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: accountKeys.detail(id) });
      invalidateAccountsAndSummary(queryClient);
    },
  });
}