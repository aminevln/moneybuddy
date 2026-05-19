"use client";

/**
 * Componente filtri per la lista transazioni.
 *
 * Filtri attualmente supportati:
 * - direction (entrata/uscita/tutti)
 * - account_id
 * - category_id
 *
 * Mancanti per ora: date range, include_voided.
 */

import { Filter } from "lucide-react";

import { ACCOUNT_TYPE_EMOJI, useAccountsQuery } from "@/lib/api/accounts";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  DIRECTION_LABELS,
  type TransactionListFilters,
  type TxnDirection,
} from "@/lib/api/transactions";


interface TransactionFiltersProps {
  filters: TransactionListFilters;
  onChange: (filters: TransactionListFilters) => void;
}


export function TransactionFilters({
  filters,
  onChange,
}: TransactionFiltersProps) {
  const { data: accounts } = useAccountsQuery();
  const { data: categories } = useCategoriesQuery();
  
  function update<K extends keyof TransactionListFilters>(
    key: K,
    value: TransactionListFilters[K] | undefined
  ) {
    const next: TransactionListFilters = { ...filters, page: 1 };
    if (value === undefined || value === "") {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  }
  
  const hasActiveFilters =
    !!filters.direction || !!filters.account_id || !!filters.category_id;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5 text-fg-muted shrink-0">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs uppercase tracking-wider font-medium">
          Filtri
        </span>
      </div>
      
      {/* Direction */}
      <FilterSelect
        value={filters.direction ?? ""}
        onChange={(v) => update("direction", v as TxnDirection | undefined)}
        label="Tutti i tipi"
        options={[
          { value: "income", label: DIRECTION_LABELS.income },
          { value: "expense", label: DIRECTION_LABELS.expense },
        ]}
      />
      
      {/* Account */}
      <FilterSelect
        value={filters.account_id ?? ""}
        onChange={(v) => update("account_id", v || undefined)}
        label="Tutti gli account"
        options={
          accounts?.map((a) => ({
            value: a.id,
            label: `${ACCOUNT_TYPE_EMOJI[a.type]} ${a.name}`,
          })) ?? []
        }
      />
      
      {/* Category */}
      <FilterSelect
        value={filters.category_id ?? ""}
        onChange={(v) => update("category_id", v || undefined)}
        label="Tutte le categorie"
        options={
          categories?.map((c) => ({ value: c.id, label: c.name })) ?? []
        }
      />
      
      {/* Reset */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() =>
            onChange({ page: filters.page ? 1 : 1, page_size: filters.page_size })
          }
          className="
            ml-auto text-xs text-fg-muted hover:text-accent
            transition-colors duration-150 underline-offset-2 hover:underline
          "
        >
          Reset
        </button>
      )}
    </div>
  );
}


// ============================================================
// SUB-COMPONENT
// ============================================================

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
}


function FilterSelect({ value, onChange, label, options }: FilterSelectProps) {
  const isActive = value !== "";
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        px-3 py-1.5 text-xs rounded-md font-medium
        bg-bg-surface border transition-colors duration-150
        focus:outline-none focus:ring-1 focus:ring-accent
        cursor-pointer appearance-none
        bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22 fill=%22none%22 stroke=%22%23b8b8c2%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')]
        bg-no-repeat bg-[length:10px_10px] bg-[position:right_8px_center]
        pr-7
        ${isActive
          ? "border-accent/40 text-accent hover:border-accent/60"
          : "border-border text-fg-secondary hover:border-border-strong hover:text-fg-primary"}
      `}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}