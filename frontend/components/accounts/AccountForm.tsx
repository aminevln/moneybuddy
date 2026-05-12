"use client";

/**
 * Form per creare/modificare un account.
 *
 * In modalità EDIT:
 * - Il type è readonly (non si può cambiare)
 * - L'initial_balance non è mostrato (per cambiarlo si fa una transazione)
 *
 * In modalità CREATE:
 * - Tutti i campi
 * - `is_spendable` è precompilato in base al tipo (vedi DEFAULT_SPENDABLE)
 */

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/api/errors";
import {
  ACCOUNT_TYPE_DEFAULT_SPENDABLE,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES_ORDER,
  type Account,
  type AccountType,
  useCreateAccountMutation,
  useUpdateAccountMutation,
} from "@/lib/api/accounts";


interface AccountFormProps {
  initial?: Account;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ initial, onSuccess, onCancel }: AccountFormProps) {
  const isEdit = !!initial;
  
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "checking");
  const [initialBalance, setInitialBalance] = useState<string>("0");
  const [isSpendable, setIsSpendable] = useState(initial?.is_spendable ?? true);
  const [error, setError] = useState<string | null>(null);
  
  // Quando cambia il type in modalità CREATE, autoaggiorna is_spendable
  // in base al default ragionevole del tipo.
  useEffect(() => {
    if (!isEdit) {
      setIsSpendable(ACCOUNT_TYPE_DEFAULT_SPENDABLE[type]);
    }
  }, [type, isEdit]);
  
  const createMutation = useCreateAccountMutation();
  const updateMutation = useUpdateAccountMutation();
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: {
            name: name.trim(),
            is_spendable: isSpendable,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          type,
          initial_balance: Number(initialBalance) || 0,
          is_spendable: isSpendable,
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
        <Label htmlFor="acc-name">Nome</Label>
        <Input
          id="acc-name"
          type="text"
          placeholder="Es. Conto Intesa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
          autoFocus
          disabled={isPending}
        />
      </div>
      
      <div>
        <Label htmlFor="acc-type">Tipo</Label>
        <Select
          id="acc-type"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          disabled={isPending || isEdit}
        >
          {ACCOUNT_TYPES_ORDER.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
        {isEdit && (
          <p className="text-xs text-slate-500 mt-1">
            Il tipo non si può modificare dopo la creazione.
          </p>
        )}
      </div>
      
      {!isEdit && (
        <div>
          <Label htmlFor="acc-balance">Saldo iniziale</Label>
          <Input
            id="acc-balance"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            disabled={isPending}
          />
          <p className="text-xs text-slate-500 mt-1">
            Quanto c'è ora? Le transazioni future aggiorneranno il saldo automaticamente.
          </p>
        </div>
      )}
      
      <div className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg">
        <input
          id="acc-spendable"
          type="checkbox"
          checked={isSpendable}
          onChange={(e) => setIsSpendable(e.target.checked)}
          disabled={isPending}
          className="mt-1 w-4 h-4 rounded accent-emerald-500"
        />
        <label htmlFor="acc-spendable" className="text-sm cursor-pointer">
          <span className="text-slate-200">Liquidità spendibile</span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Conta nel "totale disponibile". Disattiva per investimenti o
            buoni pasto che non sono spendibili liberamente.
          </span>
        </label>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Crea account"}
        </Button>
      </div>
    </form>
  );
}