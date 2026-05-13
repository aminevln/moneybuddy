import { apiFetch } from "@/lib/api/client";
import type {
  UserAsset,
  UserAssetCreatePayload,
  UserAssetUpdatePayload,
} from "./types";


export async function listAssets(): Promise<UserAsset[]> {
  return apiFetch<UserAsset[]>("/assets");
}


export async function getAsset(id: string): Promise<UserAsset> {
  return apiFetch<UserAsset>(`/assets/${id}`);
}


export async function createAsset(payload: UserAssetCreatePayload): Promise<UserAsset> {
  return apiFetch<UserAsset>("/assets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function updateAsset(
  id: string,
  payload: UserAssetUpdatePayload
): Promise<UserAsset> {
  return apiFetch<UserAsset>(`/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function deleteAsset(id: string): Promise<void> {
  await apiFetch<void>(`/assets/${id}`, { method: "DELETE" });
}