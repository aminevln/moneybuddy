"use client";

/**
 * Form per creare/modificare un account.
 *
 * In modalità EDIT:
 * - Il type è readonly (non si può cambiare)
 * - L'initial_balance non è mostrato
 *
 * In modalità CREATE:
 * - Tutti i campi
 * - `is_spendable` è precompilato in base al tipo
 */

import { Info, Lock, Wallet } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import {
  type Account,
  type AccountType,
  ACCOUNT_TYPE_DEFAULT_SPENDABLE,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES_ORDER,
  useCreateAccountMutation,
  useUpdateAccountMutation,
} from "@/lib/api/accounts";
import { getErrorMessage } from "@/lib/api/errors";


interface AccountFormProps {
  initial?: Account;
  onSuccess: () => void;
  onCancel: () => void;
}


export function AccountForm({
  initial,
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const isEdit = !!initial;
  
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "checking");
  const [initialBalance, setInitialBalance] = useState<string>("0");
  const [isSpendable, setIsSpendable] = useState(initial?.is_spendable ?? true);
  const [error, setError] = useState<string | null>(null);
  
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
      
      {/* Nome */}
      <div>
        <Label htmlFor="acc-name" required>
          Nome
        </Label>
        <Input
          id="acc-name"
          type="text"
          placeholder="Es. Conto Intesa"
          iconLeft={<Wallet className="w-4 h-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
          autoFocus
          disabled={isPending}
        />
      </div>
      
      {/* Tipo */}
      <div>
        <Label htmlFor="acc-type" required>
          Tipo
        </Label>
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
          <p className="flex items-start gap-1.5 text-xs text-fg-muted mt-1.5">
            <Lock className="w-3 h-3 shrink-0 mt-0.5" />
            <span>Il tipo non si può modificare dopo la creazione.</span>
          </p>
        )}
      </div>
      
      {/* Saldo iniziale (solo CREATE) */}
      {!isEdit && (
        <div>
          <Label htmlFor="acc-balance">Saldo iniziale</Label>
          <Input
            id="acc-balance"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            suffix="€"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            disabled={isPending}
          />
          <p className="flex items-start gap-1.5 text-xs text-fg-muted mt-1.5">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              Quanto c'è ora? Le transazioni future aggiorneranno il saldo
              automaticamente.
            </span>
          </p>
        </div>
      )}
      
      {/* Toggle "liquidità spendibile" */}
      <label
        htmlFor="acc-spendable"
        className="
          flex items-start gap-3 p-3 rounded-lg cursor-pointer
          bg-bg-elevated border border-border
          hover:border-border-strong
          transition-colors duration-150
        "
      >
        <input
          id="acc-spendable"
          type="checkbox"
          checked={isSpendable}
          onChange={(e) => setIsSpendable(e.target.checked)}
          disabled={isPending}
          className="mt-1 w-4 h-4 rounded accent-accent"
        />
        <div>
          <span className="text-sm text-fg-primary font-medium">
            Liquidità spendibile
          </span>
          <p className="text-xs text-fg-muted mt-0.5">
            Conta nel "totale disponibile". Disattiva per investimenti o
            buoni pasto che non sono spendibili liberamente.
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
          {isEdit ? "Salva modifiche" : "Crea account"}
        </Button>
      </div>
    </form>
  );
}