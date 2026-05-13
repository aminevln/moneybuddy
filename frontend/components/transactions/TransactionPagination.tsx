"use client";

/**
 * Controlli prev/next per la lista transazioni.
 */

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
  
  return (
    <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800">
      <span className="text-xs text-slate-500">
        {from}–{to} di {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-sm rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          ← Indietro
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore}
          className="px-3 py-1 text-sm rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Avanti →
        </button>
      </div>
    </div>
  );
}