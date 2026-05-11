"use client";

/**
 * Singola riga della lista categorie.
 *
 * Mostra:
 * - Pallino colorato + nome
 * - Badge "Sistema" se is_system
 * - Bottoni Edit/Delete (solo se user-owned)
 */

import { ColorDot } from "@/components/ui/ColorDot";
import { IconButton } from "@/components/ui/IconButton";
import { useDeleteCategoryMutation, type Category } from "@/lib/api/categories";


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
      // L'errore viene già mostrato dal toast/banner globale che faremo dopo.
      // Per ora, alert minimale.
      alert("Errore durante l'eliminazione");
      console.error(err);
    }
  }
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition">
      <div className="flex items-center gap-3">
        <ColorDot color={category.color} />
        <span className="text-slate-200">{category.name}</span>
        {category.is_system && (
          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded">
            sistema
          </span>
        )}
      </div>
      
      {!category.is_system && (
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => onEdit(category)}
            aria-label="Modifica"
            title="Modifica"
          >
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
      )}
    </div>
  );
}