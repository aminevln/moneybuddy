"use client";

/**
 * Card con breakdown delle spese per categoria nel mese corrente.
 *
 * Ogni categoria ha:
 * - Pallino colorato (color dal DB, o token viz fallback)
 * - Nome + numero transazioni
 * - Importo
 * - Barra proporzionale (normalizzata sul max)
 *
 * Niente librerie chart: tutto CSS.
 */

import { PieChart } from "lucide-react";

import type { CategoryBreakdown } from "@/lib/api/analytics";
import { ColorDot } from "@/components/ui/ColorDot";
import { formatCurrency } from "@/lib/format/currency";


interface CategoryBreakdownCardProps {
  data: CategoryBreakdown[];
}


/**
 * Fallback colors quando una categoria non ha un colore custom.
 * Cicla sui token viz (8 colori del design system).
 */
const VIZ_FALLBACK = [
  "var(--color-viz-1)",
  "var(--color-viz-2)",
  "var(--color-viz-3)",
  "var(--color-viz-4)",
  "var(--color-viz-5)",
  "var(--color-viz-6)",
  "var(--color-viz-7)",
  "var(--color-viz-8)",
];


export function CategoryBreakdownCard({ data }: CategoryBreakdownCardProps) {
  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (data.length === 0) {
    return (
      <div className="bg-bg-surface border border-border rounded-xl p-5">
        <Header count={0} />
        <p className="text-fg-secondary text-sm py-2">
          Nessuna spesa questo mese. Quando inizierai a registrare le uscite
          le vedrai qui.
        </p>
      </div>
    );
  }
  
  // Massimo per normalizzare le barre
  const maxSpent = Math.max(...data.map((c) => Number(c.total_spent)));
  
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5">
      <Header count={data.length} />
      
      <div className="space-y-2.5">
        {data.map((cat, index) => {
          const spent = Number(cat.total_spent);
          const widthPct = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;
          const color = cat.category_color ?? VIZ_FALLBACK[index % VIZ_FALLBACK.length];
          
          return (
            <div key={cat.category_id ?? "none"}>
              {/* Header row */}
              <div className="flex items-baseline justify-between gap-2 mb-1.5 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <ColorDot color={color} size="sm" />
                  <span className="text-fg-primary truncate font-medium">
                    {cat.category_name}
                  </span>
                  <span className="text-xs text-fg-muted whitespace-nowrap">
                    · {cat.transaction_count}
                  </span>
                </div>
                <span className="text-fg-primary tabular-nums whitespace-nowrap font-medium">
                  {formatCurrency(cat.total_spent)}
                </span>
              </div>
              
              {/* Barra */}
              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
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


// ============================================================
// SUB-COMPONENT
// ============================================================

function Header({ count }: { count: number }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <div className="flex items-center gap-2">
        <PieChart className="w-4 h-4 text-fg-muted" />
        <div className="text-xs text-fg-secondary uppercase tracking-wider font-medium">
          Spese per categoria
        </div>
      </div>
      {count > 0 && (
        <div className="text-xs text-fg-muted">
          {count} {count === 1 ? "categoria" : "categorie"}
        </div>
      )}
    </div>
  );
}