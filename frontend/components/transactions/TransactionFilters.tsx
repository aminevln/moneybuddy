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
 * Aggiungibili facilmente in futuro.
 */

import { useAccountsQuery, ACCOUNT_TYPE_EMOJI } from "@/lib/api/accounts";
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
  
  // Modifica un singolo campo, resettando la pagina a 1
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
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Direction */}
      <FilterSelect
        value={filters.direction ?? ""}
        onChange={(v) => update("direction", v as TxnDirection | undefined)}
        label="Tutti"
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
    </div>
  );
}


// ============================================================
// SUB-COMPONENT
// ============================================================

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;       // testo per l'opzione "all"
  options: Array<{ value: string; label: string }>;
}

function FilterSelect({ value, onChange, label, options }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        px-3 py-1.5 text-sm rounded-lg
        bg-slate-900/50 text-slate-200
        border border-slate-700
        focus:outline-none focus:border-emerald-500
        transition
        cursor-pointer
      "
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