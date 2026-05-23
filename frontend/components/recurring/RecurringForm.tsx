"use client";

/**
 * Form per creare/modificare una spesa fissa (RecurringTransaction).
 *
 * Campi:
 * - Descrizione (es. "Affitto", "Benzina")
 * - Direzione (Spesa / Entrata)
 * - Importo (positivo, il segno lo dà direction)
 * - Account (da quale conto)
 * - Categoria (opzionale)
 * - Frequenza (daily/weekly/biweekly/monthly/yearly)
 * - Prossima occorrenza (data prevista)
 * - Fine (data opzionale, "termina dopo questa data")
 * - Attiva (toggle on/off)
 */

import { Calendar, Repeat, TrendingUp } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { useAccountsQuery } from "@/lib/api/accounts";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  type RecurringTransaction,
  type RecurrenceFreq,
  type TxnDirection,
  DIRECTION_LABELS,
  FREQUENCY_LABELS,
  FREQUENCY_ORDER,
  useCreateRecurringMutation,
  useUpdateRecurringMutation,
} from "@/lib/api/recurring";
import { getErrorMessage } from "@/lib/api/errors";


interface RecurringFormProps {
  initial?: RecurringTransaction;
  onSuccess: () => void;
  onCancel: () => void;
}


// Helper per la data di default = oggi in formato YYYY-MM-DD
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}


export function RecurringForm({
  initial,
  onSuccess,
  onCancel,
}: RecurringFormProps) {
  const isEdit = !!initial;
  
  const { data: accounts = [] } = useAccountsQuery();
  const { data: categories = [] } = useCategoriesQuery();
  
  // ============================================================
  // STATE
  // ============================================================
  const [description, setDescription] = useState(initial?.description ?? "");
  const [direction, setDirection] = useState<TxnDirection>(
    initial?.direction ?? "expense"
  );
  const [amount, setAmount] = useState<string>(initial?.amount ?? "");
  const [accountId, setAccountId] = useState(initial?.account_id ?? "");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFreq>(
    initial?.frequency ?? "monthly"
  );
  const [nextOccurrence, setNextOccurrence] = useState<string>(
    initial?.next_occurrence ?? todayISO()
  );
  const [endDate, setEndDate] = useState<string>(initial?.end_date ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  
  const createMutation = useCreateRecurringMutation();
  const updateMutation = useUpdateRecurringMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  // ============================================================
  // SUBMIT
  // ============================================================
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    if (!accountId) {
      setError("Seleziona un account.");
      return;
    }
    
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("L'importo deve essere maggiore di 0.");
      return;
    }
    
    try {
      const payload = {
        account_id: accountId,
        category_id: categoryId || null,
        direction,
        frequency,
        amount: parsedAmount,
        description: description.trim(),
        next_occurrence: nextOccurrence,
        end_date: endDate || null,
        is_active: isActive,
      };
      
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />
      
      {/* Descrizione */}
      <div>
        <Label htmlFor="rec-description" required>
          Descrizione
        </Label>
        <Input
          id="rec-description"
          type="text"
          placeholder="Es. Affitto, Netflix, Benzina"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={1}
          maxLength={200}
          autoFocus
          disabled={isPending}
        />
      </div>
      
      {/* Direzione + Importo (riga) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="rec-direction" required>
            Tipo
          </Label>
          <Select
            id="rec-direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as TxnDirection)}
            disabled={isPending}
          >
            <option value="expense">{DIRECTION_LABELS.expense}</option>
            <option value="income">{DIRECTION_LABELS.income}</option>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="rec-amount" required>
            Importo
          </Label>
          <Input
            id="rec-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            suffix="€"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>
      
      {/* Account */}
      <div>
        <Label htmlFor="rec-account" required>
          Account
        </Label>
        <Select
          id="rec-account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          disabled={isPending}
        >
          <option value="">— Seleziona un account —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Categoria (opzionale) */}
      <div>
        <Label htmlFor="rec-category">Categoria</Label>
        <Select
          id="rec-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isPending}
        >
          <option value="">— Nessuna categoria —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Frequenza */}
      <div>
        <Label htmlFor="rec-frequency" required>
          Frequenza
        </Label>
        <Select
          id="rec-frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurrenceFreq)}
          disabled={isPending}
        >
          {FREQUENCY_ORDER.map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABELS[f]}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Date (prossima + fine) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="rec-next" required>
            Prossima
          </Label>
          <Input
            id="rec-next"
            type="date"
            iconLeft={<Calendar className="w-4 h-4" />}
            value={nextOccurrence}
            onChange={(e) => setNextOccurrence(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        
        <div>
          <Label htmlFor="rec-end">Fine (opz.)</Label>
          <Input
            id="rec-end"
            type="date"
            iconLeft={<Calendar className="w-4 h-4" />}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
      
      {/* Toggle attiva/pausa */}
      <label
        htmlFor="rec-active"
        className="
          flex items-start gap-3 p-3 rounded-lg cursor-pointer
          bg-bg-elevated border border-border
          hover:border-border-strong
          transition-colors duration-150
        "
      >
        <input
          id="rec-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={isPending}
          className="mt-1 w-4 h-4 rounded accent-accent"
        />
        <div>
          <span className="text-sm text-fg-primary font-medium">Attiva</span>
          <p className="text-xs text-fg-muted mt-0.5">
            Disattiva per metterla "in pausa" senza eliminarla. Le ricorrenti
            inattive non vengono considerate nei forecast.
          </p>
        </div>
      </label>
      
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
          {isEdit ? "Salva modifiche" : "Crea"}
        </Button>
      </div>
    </form>
  );
}