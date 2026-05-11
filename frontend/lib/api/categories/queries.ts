/**
 * Hook TanStack Query per Category.
 *
 * Pattern usato in tutto il progetto:
 * - useXxxQuery → letture (cached)
 * - useXxxMutation → scritture (invalida le query collegate)
 *
 * Query keys convenzione:
 * - ["categories"]      → lista
 * - ["categories", id]  → singola
 *
 * Quando invalidiamo ["categories"], TanStack rifetcha sia la lista
 * sia tutte le singole (prefix matching).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "./api";
import type {
  Category,
  CategoryCreatePayload,
  CategoryUpdatePayload,
} from "./types";


// ============================================================
// QUERY KEYS
// ============================================================
// Centralizziamo le query keys così sono coerenti ovunque.

export const categoryKeys = {
  all: ["categories"] as const,
  detail: (id: string) => ["categories", id] as const,
};


// ============================================================
// QUERIES (READ)
// ============================================================

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: listCategories,
  });
}


export function useCategoryQuery(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategory(id),
    enabled: !!id,   // non fare la query se id è vuoto
  });
}


// ============================================================
// MUTATIONS (WRITE)
// ============================================================

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CategoryCreatePayload) => createCategory(payload),
    onSuccess: () => {
      // Invalida la lista così viene rifetchata
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}


export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryUpdatePayload }) =>
      updateCategory(id, payload),
    onSuccess: (updated: Category) => {
      // Aggiorna la cache della singola direttamente con il nuovo valore
      queryClient.setQueryData(categoryKeys.detail(updated.id), updated);
      // E invalida la lista
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}


export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (_, id) => {
      // Rimuovi la singola dalla cache
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) });
      // Invalida la lista
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}