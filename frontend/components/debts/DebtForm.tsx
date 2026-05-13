"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getErrorMessage } from "@/lib/api/errors";
import {
  decimalToPercent,
  percentToDecimal,
  useCreateDebtMutation,
  useUpdateDebtMutation,
  type Debt,
} from "@/lib/api/debts";


interface DebtFormProps {
  initial?: Debt;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DebtForm({ initial, onSuccess, onCancel }: DebtFormProps) {
  const isEdit = !!initial;
  
  const [creditor, setCreditor] = useState(initial?.creditor ?? "");
  const [originalAmount, setOriginalAmount] = useState<string>(
    initial?.original_amount ?? ""
  );
  const [remainingAmount, setRemainingAmount] = useState<string>(
    initial?.remaining_amount ?? ""
  );
  const [monthlyPayment, setMonthlyPayment] = useState<string>(
    initial?.monthly_payment ?? ""
  );
  // Visualizziamo il rate come percentuale per l'utente (es. 2.5 invece di 0.025)
  const [interestRate, setInterestRate] = useState<string>(
    initial?.interest_rate !== null && initial?.interest_rate !== undefined
      ? decimalToPercent(initial.interest_rate)
      : ""
  );
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  
  const createMutation = useCreateDebtMutation();
  const updateMutation = useUpdateDebtMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    // Convertiamo il rate da percentuale (utente) a decimale (backend)
    const rateDecimal = interestRate.trim()
      ? percentToDecimal(interestRate)
      : undefined;
    
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: {
            creditor: creditor.trim(),
            remaining_amount: Number(remainingAmount),
            monthly_payment: monthlyPayment.trim() ? Number(monthlyPayment) : undefined,
            interest_rate: rateDecimal,
            due_date: dueDate || undefined,
            notes: notes.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          creditor: creditor.trim(),
          original_amount: Number(originalAmount),
          remaining_amount: Number(remainingAmount),
          monthly_payment: monthlyPayment.trim() ? Number(monthlyPayment) : undefined,
          interest_rate: rateDecimal,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
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
      
      <div>
        <Label htmlFor="debt-creditor">Creditore</Label>
        <Input
          id="debt-creditor"
          type="text"
          placeholder="Es. Intesa Sanpaolo, Findomestic, Papà"
          value={creditor}
          onChange={(e) => setCreditor(e.target.value)}
          required
          minLength={1}
          maxLength={200}
          autoFocus
          disabled={isPending}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="debt-original">Importo iniziale (€)</Label>
          <Input
            id="debt-original"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="100000"
            value={originalAmount}
            onChange={(e) => setOriginalAmount(e.target.value)}
            required
            disabled={isPending || isEdit}
          />
          {isEdit && (
            <p className="text-xs text-slate-500 mt-1">
              Non modificabile
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="debt-remaining">Residuo (€)</Label>
          <Input
            id="debt-remaining"
            type="number"
            min="0"
            step="0.01"
            placeholder="80000"
            value={remainingAmount}
            onChange={(e) => setRemainingAmount(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="debt-payment">Rata mensile (€)</Label>
          <Input
            id="debt-payment"
            type="number"
            min="0"
            step="0.01"
            placeholder="Opzionale"
            value={monthlyPayment}
            onChange={(e) => setMonthlyPayment(e.target.value)}
            disabled={isPending}
          />
        </div>
        
        <div>
          <Label htmlFor="debt-rate">Tasso (%)</Label>
          <Input
            id="debt-rate"
            type="number"
            min="0"
            max="999"
            step="0.01"
            placeholder="Opzionale"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="debt-due">Scadenza</Label>
        <Input
          id="debt-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isPending}
        />
      </div>
      
      <div>
        <Label htmlFor="debt-notes">Note</Label>
        <textarea
          id="debt-notes"
          placeholder="Es. Mutuo prima casa tasso fisso"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          rows={3}
          disabled={isPending}
          className="
            w-full px-4 py-2.5 rounded-lg
            bg-slate-900/50 text-slate-100 text-sm
            border border-slate-700
            focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
            disabled:opacity-50
            transition resize-y
          "
        />
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Crea debito"}
        </Button>
      </div>
    </form>
  );
}