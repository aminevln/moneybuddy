"use client";

import { AlertCircle, Boxes } from "lucide-react";

import { type UserAsset, useAssetsQuery } from "@/lib/api/assets";
import { AssetRow } from "./AssetRow";


interface AssetListProps {
  onEdit: (asset: UserAsset) => void;
}


export function AssetList({ onEdit }: AssetListProps) {
  const { data: assets, isLoading, error } = useAssetsQuery();
  
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-bg-elevated rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div
        className="
          flex items-start gap-2.5
          bg-danger-soft border border-danger/30
          text-danger text-sm
          rounded-lg px-3 py-2.5
        "
        role="alert"
      >
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Errore: {error.message}</span>
      </div>
    );
  }
  
  if (!assets || assets.length === 0) {
    return (
      <div className="text-center py-10 bg-bg-elevated/40 border border-border rounded-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
          <Boxes className="w-5 h-5 text-fg-muted" />
        </div>
        <p className="text-fg-primary font-medium mb-1">
          Nessun asset
        </p>
        <p className="text-fg-secondary text-sm max-w-sm mx-auto">
          Aggiungi le cose che possiedi (auto, casa, animali). L'AI le userà
          per ragionare sulle tue spese.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1.5">
      {assets.map((asset) => (
        <AssetRow key={asset.id} asset={asset} onEdit={onEdit} />
      ))}
    </div>
  );
}