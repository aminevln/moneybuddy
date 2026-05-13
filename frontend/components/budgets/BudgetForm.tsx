"use client";

/**
 * Form per creare/modificare un budget.
 *
 * Modalità create:
 * - period è scelta libera
 * - category_id opzionale ("budget generico" se vuoto)
 *
 * Modalità edit:
 * - period è readonly (cambierebbe la semantica del calcolo)
 * - Possibile attivare/disattivare il budget invece di cancellarlo
 */

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/api/errors";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  PERIOD_LABELS,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  type BudgetPeriod,
  type BudgetStatus,
} from "@/lib/api/budgets";


interface BudgetFormProps {
  initial?: BudgetStatus;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BudgetForm({ initial, onSuccess, onCancel }: BudgetFormProps) {
  const isEdit = !!initial;
  
  const { data: categories } = useCategoriesQuery();
  
  const [categoryId, setCategoryId] = useState<string>(
    initial?.budget.category_id ?? ""
  );
  const [period, setPeriod] = useState<BudgetPeriod>(
    initial?.budget.period ?? "monthly"
  );
  const [amountLimit, setAmountLimit] = useState<string>(
    initial?.budget.amount_limit ?? ""
  );
  const [isActive, setIsActive] = useState(initial?.budget.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  
  const createMutation = useCreateBudgetMutation();
  const updateMutation = useUpdateBudgetMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.budget.id,
          payload: {
            category_id: categoryId || null,
            amount_limit: Number(amountLimit),
            is_active: isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          category_id: categoryId || null,
          period,
          amount_limit: Number(amountLimit),
        });
      }
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />
      
      {/* Categoria (opzionale) */}
      <div>
        <Label htmlFor="budget-category">Categoria</Label>
        <Select
          id="budget-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isPending}
        >
          <option value="">— Budget generico (tutte le spese) —</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
        <p className="text-xs text-slate-500 mt-1">
          Lascia vuoto per limitare il totale di tutte le tue uscite del periodo.
        </p>
      </div>
      
      {/* Periodo */}
      <div>
        <Label htmlFor="budget-period">Periodo</Label>
        <Select
          id="budget-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
          disabled={isPending || isEdit}
        >
          {(Object.keys(PERIOD_LABELS) as BudgetPeriod[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </Select>
        {isEdit && (
          <p className="text-xs text-slate-500 mt-1">
            Non puoi cambiare il periodo dopo la creazione.
          </p>
        )}
      </div>
      
      {/* Importo limite */}
      <div>
        <Label htmlFor="budget-amount">Limite (€)</Label>
        <Input
          id="budget-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="200"
          value={amountLimit}
          onChange={(e) => setAmountLimit(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      
      {/* is_active toggle (solo in EDIT) */}
      {isEdit && (
        <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
          <input
            id="budget-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isPending}
            className="mt-1 w-4 h-4 rounded accent-emerald-500"
          />
          <label htmlFor="budget-active" className="text-sm cursor-pointer">
            <span className="text-slate-200">Budget attivo</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Disattiva per nasconderlo dalla lista senza eliminarlo.
            </span>
          </label>
        </div>
      )}
      
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Crea budget"}
        </Button>
      </div>
    </form>
  );
}