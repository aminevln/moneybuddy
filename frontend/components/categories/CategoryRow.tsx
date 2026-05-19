"use client";

/**
 * Singola riga della lista categorie.
 *
 * Mostra:
 * - Pallino colorato + nome
 * - Badge "Sistema" se is_system (read-only)
 * - Bottoni Edit/Delete (solo se user-owned)
 */

import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ColorDot } from "@/components/ui/ColorDot";
import { IconButton } from "@/components/ui/IconButton";
import {
  type Category,
  useDeleteCategoryMutation,
} from "@/lib/api/categories";


interface CategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
}


export function CategoryRow({ category, onEdit }: CategoryRowProps) {
  const deleteMutation = useDeleteCategoryMutation();
  
  async function handleDelete() {
    if (!confirm(`Eliminare "${category.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(category.id);
    } catch (err) {
      alert("Errore durante l'eliminazione");
      console.error(err);
    }
  }
  
  return (
    <div
      className="
        flex items-center justify-between gap-3 p-3 rounded-lg
        bg-bg-surface border border-border
        transition-all duration-150
        hover:bg-bg-elevated hover:border-border-strong
      "
    >
      {/* Sinistra: dot + nome + badge */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <ColorDot color={category.color} size="md" />
        <span className="text-sm text-fg-primary font-medium truncate">
          {category.name}
        </span>
        {category.is_system && (
          <Badge size="sm" variant="default">
            sistema
          </Badge>
        )}
      </div>
      
      {/* Destra: azioni (solo per user categories) */}
      {!category.is_system && (
        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            size="sm"
            onClick={() => onEdit(category)}
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
      )}
    </div>
  );
}