"use client";

/**
 * Lista delle categorie. Gestisce loading/empty/error states.
 *
 * Sistema in basso, utente in alto (priorità visiva alle proprie).
 */

import { AlertCircle, FolderTree } from "lucide-react";

import { type Category, useCategoriesQuery } from "@/lib/api/categories";
import { CategoryRow } from "./CategoryRow";


interface CategoryListProps {
  onEdit: (category: Category) => void;
}


export function CategoryList({ onEdit }: CategoryListProps) {
  const { data: categories, isLoading, error } = useCategoriesQuery();
  
  // ============================================================
  // LOADING
  // ============================================================
  if (isLoading) {
    return (
      <div className="space-y-4">
        <section>
          <div className="h-3 w-24 bg-bg-elevated rounded-md animate-pulse mb-2 ml-1" />
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-bg-elevated rounded-lg animate-pulse"
              />
            ))}
          </div>
        </section>
      </div>
    );
  }
  
  // ============================================================
  // ERROR
  // ============================================================
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
        <span>Errore nel caricamento: {error.message}</span>
      </div>
    );
  }
  
  // ============================================================
  // EMPTY
  // ============================================================
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-10 bg-bg-elevated/40 border border-border rounded-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
          <FolderTree className="w-5 h-5 text-fg-muted" />
        </div>
        <p className="text-fg-primary font-medium mb-1">
          Nessuna categoria
        </p>
        <p className="text-fg-secondary text-sm">
          Creane una per organizzare le tue spese.
        </p>
      </div>
    );
  }
  
  // ============================================================
  // GROUPED LIST
  // ============================================================
  const systemCats = categories.filter((c) => c.is_system);
  const userCats = categories.filter((c) => !c.is_system);
  
  return (
    <div className="space-y-5">
      {userCats.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-fg-muted font-medium mb-2 px-1">
            Le tue categorie
          </h3>
          <div className="space-y-1.5">
            {userCats.map((cat) => (
              <CategoryRow key={cat.id} category={cat} onEdit={onEdit} />
            ))}
          </div>
        </section>
      )}
      
      {systemCats.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-fg-muted font-medium mb-2 px-1">
            Categorie di sistema
          </h3>
          <div className="space-y-1.5">
            {systemCats.map((cat) => (
              <CategoryRow key={cat.id} category={cat} onEdit={onEdit} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}