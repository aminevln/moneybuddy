"use client";

/**
 * Card con il breakdown delle spese per categoria nel mese corrente.
 *
 * Mostra ogni categoria come una "barra" orizzontale con:
 * - Nome categoria + numero transazioni
 * - Importo speso
 * - Barra proporzionale (la max è la categoria con più spesa)
 *
 * Niente librerie chart: tutto Tailwind + CSS.
 */

import { formatCurrency } from "@/lib/format/currency";
import { ColorDot } from "@/components/ui/ColorDot";
import type { CategoryBreakdown } from "@/lib/api/analytics";


interface CategoryBreakdownCardProps {
  data: CategoryBreakdown[];
}

export function CategoryBreakdownCard({ data }: CategoryBreakdownCardProps) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Spese per categoria
        </div>
        <p className="text-slate-500 text-sm py-2">
          Nessuna spesa questo mese. Quando inizierai a registrare le uscite
          le vedrai qui.
        </p>
      </div>
    );
  }
  
  // Massimo speso (per normalizzare le barre)
  const maxSpent = Math.max(...data.map((c) => Number(c.total_spent)));
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs text-slate-500 uppercase tracking-wider">
          Spese per categoria
        </div>
        <div className="text-xs text-slate-500">
          {data.length} {data.length === 1 ? "categoria" : "categorie"}
        </div>
      </div>
      
      <div className="space-y-2">
        {data.map((cat) => {
          const spent = Number(cat.total_spent);
          const widthPct = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;
          
          return (
            <div key={cat.category_id ?? "none"}>
              {/* Header row */}
              <div className="flex items-baseline justify-between gap-2 mb-1 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <ColorDot color={cat.category_color} size="sm" />
                  <span className="text-slate-200 truncate">
                    {cat.category_name}
                  </span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    · {cat.transaction_count}
                  </span>
                </div>
                <span className="text-slate-100 tabular-nums whitespace-nowrap">
                  {formatCurrency(cat.total_spent)}
                </span>
              </div>
              {/* Barra */}
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-600 transition-all"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: cat.category_color ?? undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}