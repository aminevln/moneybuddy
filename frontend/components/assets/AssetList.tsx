"use client";

import { useAssetsQuery, type UserAsset } from "@/lib/api/assets";
import { AssetRow } from "./AssetRow";


interface AssetListProps {
  onEdit: (asset: UserAsset) => void;
}

export function AssetList({ onEdit }: AssetListProps) {
  const { data: assets, isLoading, error } = useAssetsQuery();
  
  if (isLoading) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        Caricamento asset...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
        Errore: {error.message}
      </div>
    );
  }
  
  if (!assets || assets.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        Nessun asset. Aggiungi le cose che possiedi (auto, casa, animali...)
        così l'AI potrà ragionarci sopra.
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {assets.map((asset) => (
        <AssetRow key={asset.id} asset={asset} onEdit={onEdit} />
      ))}
    </div>
  );
}