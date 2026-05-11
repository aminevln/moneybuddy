"use client";

/**
 * Lista delle categorie. Gestisce loading/empty/error states.
 */

import { useCategoriesQuery, type Category } from "@/lib/api/categories";
import { CategoryRow } from "./CategoryRow";


interface CategoryListProps {
  onEdit: (category: Category) => void;
}

export function CategoryList({ onEdit }: CategoryListProps) {
  const { data: categories, isLoading, error } = useCategoriesQuery();
  
  if (isLoading) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        Caricamento categorie...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
        Errore nel caricamento: {error.message}
      </div>
    );
  }
  
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        Nessuna categoria. Creane una!
      </div>
    );
  }
  
  // Sistema in alto, utente in fondo (separate logicamente)
  const systemCats = categories.filter((c) => c.is_system);
  const userCats = categories.filter((c) => !c.is_system);
  
  return (
    <div className="space-y-4">
      {userCats.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-1">
            Le tue categorie
          </h3>
          <div className="space-y-1">
            {userCats.map((cat) => (
              <CategoryRow key={cat.id} category={cat} onEdit={onEdit} />
            ))}
          </div>
        </section>
      )}
      
      <section>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2 px-1">
          Categorie di sistema
        </h3>
        <div className="space-y-1">
          {systemCats.map((cat) => (
            <CategoryRow key={cat.id} category={cat} onEdit={onEdit} />
          ))}
        </div>
      </section>
    </div>
  );
}