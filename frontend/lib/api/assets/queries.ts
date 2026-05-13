import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAsset,
  deleteAsset,
  getAsset,
  listAssets,
  updateAsset,
} from "./api";
import type {
  UserAsset,
  UserAssetCreatePayload,
  UserAssetUpdatePayload,
} from "./types";


export const assetKeys = {
  all: ["assets"] as const,
  detail: (id: string) => ["assets", id] as const,
};


export function useAssetsQuery() {
  return useQuery({
    queryKey: assetKeys.all,
    queryFn: listAssets,
  });
}


export function useAssetQuery(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => getAsset(id),
    enabled: !!id,
  });
}


export function useCreateAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserAssetCreatePayload) => createAsset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}


export function useUpdateAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserAssetUpdatePayload }) =>
      updateAsset(id, payload),
    onSuccess: (updated: UserAsset) => {
      queryClient.setQueryData(assetKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}


export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: assetKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}