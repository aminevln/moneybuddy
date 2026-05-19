"use client";

/**
 * Controlli prev/next per la lista transazioni.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";


interface TransactionPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}


export function TransactionPagination({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
}: TransactionPaginationProps) {
  if (total === 0) return null;
  
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border-muted">
      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-fg-secondary tabular-nums">
          <span className="font-medium text-fg-primary">{from}–{to}</span>
          <span className="text-fg-muted"> di </span>
          <span className="font-medium text-fg-primary">{total}</span>
        </span>
        {totalPages > 1 && (
          <span className="text-[10px] text-fg-muted tabular-nums uppercase tracking-wider font-medium">
            Pagina {page} di {totalPages}
          </span>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="
            inline-flex items-center gap-1
            px-3 py-1.5 rounded-md text-xs font-medium
            bg-bg-elevated hover:bg-bg-surface
            text-fg-secondary hover:text-fg-primary
            border border-border hover:border-border-strong
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-bg-elevated disabled:hover:text-fg-secondary disabled:hover:border-border
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface
          "
          aria-label="Pagina precedente"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Indietro</span>
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore}
          className="
            inline-flex items-center gap-1
            px-3 py-1.5 rounded-md text-xs font-medium
            bg-bg-elevated hover:bg-bg-surface
            text-fg-secondary hover:text-fg-primary
            border border-border hover:border-border-strong
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-bg-elevated disabled:hover:text-fg-secondary disabled:hover:border-border
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface
          "
          aria-label="Pagina successiva"
        >
          <span>Avanti</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}