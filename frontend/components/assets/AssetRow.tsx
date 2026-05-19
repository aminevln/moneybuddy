"use client";

/**
 * Singola riga della lista asset.
 */

import {
  Building,
  Car,
  Cat,
  Dog,
  Home,
  Laptop,
  Package,
  Pencil,
  Smartphone,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { IconButton } from "@/components/ui/IconButton";
import {
  type UserAsset,
  getAssetLabel,
  useDeleteAssetMutation,
} from "@/lib/api/assets";


// Mappa asset type → icona Lucide (sostituisce le emoji)
const ASSET_TYPE_ICON: Record<string, LucideIcon> = {
  car: Car,
  house: Home,
  apartment: Building,
  cat: Cat,
  dog: Dog,
  phone: Smartphone,
  laptop: Laptop,
  computer: Laptop,
};


// Mappa asset type → colore viz (varia visivamente)
const ASSET_TYPE_COLOR: Record<string, string> = {
  car: "var(--color-viz-5)",        // cyan
  house: "var(--color-viz-2)",      // verde
  apartment: "var(--color-viz-2)",  // verde
  cat: "var(--color-viz-6)",        // rosa
  dog: "var(--color-viz-4)",        // ambra
  phone: "var(--color-viz-3)",      // viola
  laptop: "var(--color-viz-5)",     // cyan
  computer: "var(--color-viz-5)",   // cyan
};


interface AssetRowProps {
  asset: UserAsset;
  onEdit: (asset: UserAsset) => void;
}


export function AssetRow({ asset, onEdit }: AssetRowProps) {
  const deleteMutation = useDeleteAssetMutation();
  
  const Icon = ASSET_TYPE_ICON[asset.asset_type] ?? Package;
  const iconColor =
    ASSET_TYPE_COLOR[asset.asset_type] ?? "var(--color-fg-muted)";
  const attrCount = Object.keys(asset.attributes).length;
  
  async function handleDelete() {
    if (!confirm(`Eliminare "${asset.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(asset.id);
    } catch (err) {
      alert("Errore durante l'eliminazione");
      console.error(err);
    }
  }
  
  return (
    <div
      className="
        flex items-center gap-3 p-3 rounded-lg
        bg-bg-surface border border-border
        transition-all duration-150
        hover:bg-bg-elevated hover:border-border-strong
      "
    >
      {/* Icona tipo asset */}
      <div
        className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg"
        style={{
          backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      
      {/* Nome + meta */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg-primary truncate font-medium">
          {asset.name}
        </p>
        <p className="text-xs text-fg-muted mt-0.5">
          {getAssetLabel(asset.asset_type)}
          {attrCount > 0 && (
            <>
              <span aria-hidden> · </span>
              <span className="tabular-nums">{attrCount}</span>{" "}
              {attrCount === 1 ? "attributo" : "attributi"}
            </>
          )}
        </p>
      </div>
      
      {/* Azioni */}
      <div className="flex items-center gap-0.5 shrink-0">
        <IconButton
          size="sm"
          onClick={() => onEdit(asset)}
          aria-label="Modifica"
          title="Modifica"
        >
          <Pencil className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          size="sm"
          variant="danger"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          aria-label="Elimina"
          title="Elimina"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </IconButton>
      </div>
    </div>
  );
}