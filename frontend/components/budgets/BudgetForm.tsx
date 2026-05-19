"use client";

/**
 * Form per creare/modificare un budget.
 */

import { Info, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import {
  type BudgetPeriod,
  type BudgetStatus,
  PERIOD_LABELS,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
} from "@/lib/api/budgets";
import { useCategoriesQuery } from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/api/errors";


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
      
      {/* Categoria */}
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
        <p className="flex items-start gap-1.5 text-xs text-fg-muted mt-1.5">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Lascia vuoto per limitare il totale di tutte le tue uscite del periodo.</span>
        </p>
      </div>
      
      {/* Periodo */}
      <div>
        <Label htmlFor="budget-period" required>
          Periodo
        </Label>
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
          <p className="flex items-start gap-1.5 text-xs text-fg-muted mt-1.5">
            <Lock className="w-3 h-3 shrink-0 mt-0.5" />
            <span>Non puoi cambiare il periodo dopo la creazione.</span>
          </p>
        )}
      </div>
      
      {/* Importo limite */}
      <div>
        <Label htmlFor="budget-amount" required>
          Limite
        </Label>
        <Input
          id="budget-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="200.00"
          suffix="€"
          value={amountLimit}
          onChange={(e) => setAmountLimit(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      
      {/* is_active toggle (solo in EDIT) */}
      {isEdit && (
        <label
          htmlFor="budget-active"
          className="
            flex items-start gap-3 p-3 rounded-lg cursor-pointer
            bg-bg-elevated border border-border
            hover:border-border-strong
            transition-colors duration-150
          "
        >
          <input
            id="budget-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isPending}
            className="mt-1 w-4 h-4 rounded accent-accent"
          />
          <div>
            <span className="text-sm text-fg-primary font-medium">
              Budget attivo
            </span>
            <p className="text-xs text-fg-muted mt-0.5">
              Disattiva per nasconderlo dalla lista senza eliminarlo.
            </p>
          </div>
        </label>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isPending}
        >
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Crea budget"}
        </Button>
      </div>
    </form>
  );
}