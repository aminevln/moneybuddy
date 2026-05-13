"use client";

import { IconButton } from "@/components/ui/IconButton";
import {
  getAssetEmoji,
  getAssetLabel,
  useDeleteAssetMutation,
  type UserAsset,
} from "@/lib/api/assets";


interface AssetRowProps {
  asset: UserAsset;
  onEdit: (asset: UserAsset) => void;
}

export function AssetRow({ asset, onEdit }: AssetRowProps) {
  const deleteMutation = useDeleteAssetMutation();
  
  async function handleDelete() {
    if (!confirm(`Eliminare "${asset.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(asset.id);
    } catch (err) {
      alert("Errore durante l'eliminazione");
      console.error(err);
    }
  }
  
  const attrCount = Object.keys(asset.attributes).length;
  
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-2xl flex-shrink-0" aria-hidden>
          {getAssetEmoji(asset.asset_type)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-slate-200 truncate">{asset.name}</p>
          <p className="text-xs text-slate-500">
            {getAssetLabel(asset.asset_type)}
            {attrCount > 0 && ` · ${attrCount} attribut${attrCount === 1 ? "o" : "i"}`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton onClick={() => onEdit(asset)} aria-label="Modifica" title="Modifica">
          ✏️
        </IconButton>
        <IconButton
          variant="danger"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          aria-label="Elimina"
          title="Elimina"
        >
          🗑️
        </IconButton>
      </div>
    </div>
  );
}