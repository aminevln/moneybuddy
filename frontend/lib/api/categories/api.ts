/**
 * Chiamate HTTP per /categories.
 *
 * Solo le funzioni "raw": le query/mutation hooks le mettiamo
 * in queries.ts.
 */

import { apiFetch } from "@/lib/api/client";
import type {
  Category,
  CategoryCreatePayload,
  CategoryUpdatePayload,
} from "./types";


export async function listCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}


export async function getCategory(id: string): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`);
}


export async function createCategory(
  payload: CategoryCreatePayload
): Promise<Category> {
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateCategory(
  id: string,
  payload: CategoryUpdatePayload
): Promise<Category> {
  return apiFetch<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(`/categories/${id}`, {
    method: "DELETE",
  });
}