"use client";

/**
 * Form per creare/modificare una transazione.
 *
 * Modalità create:
 * - Tutti i campi modificabili
 * - Direction = expense di default
 * - Occurred_at = adesso
 *
 * Modalità edit:
 * - Direction, account, amount sono READONLY (regola append-only ledger)
 * - Solo description, merchant, category, datetime sono modificabili
 */

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/api/errors";
import { useAccountsQuery, ACCOUNT_TYPE_EMOJI } from "@/lib/api/accounts";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  type Transaction,
  type TxnDirection,
} from "@/lib/api/transactions";
import {
  fromDatetimeLocalInput,
  toDatetimeLocalInput,
} from "@/lib/format/date";


interface TransactionFormProps {
  initial?: Transaction;
  /** Account preselezionato (es. quando crei da una specifica vista account) */
  defaultAccountId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({
  initial,
  defaultAccountId,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const isEdit = !!initial;
  
  const { data: accounts } = useAccountsQuery();
  const { data: categories } = useCategoriesQuery();
  
  // Stati iniziali
  const [direction, setDirection] = useState<TxnDirection>(
    initial?.direction ?? "expense"
  );
  const [accountId, setAccountId] = useState(
    initial?.account_id ?? defaultAccountId ?? ""
  );
  const [categoryId, setCategoryId] = useState<string>(
    initial?.category_id ?? ""
  );
  const [amount, setAmount] = useState<string>(
    initial?.amount ?? ""
  );
  const [description, setDescription] = useState(
    initial?.description ?? ""
  );
  const [merchant, setMerchant] = useState(
    initial?.merchant ?? ""
  );
  const [occurredAt, setOccurredAt] = useState(
    initial
      ? toDatetimeLocalInput(new Date(initial.occurred_at))
      : toDatetimeLocalInput()
  );
  
  const [error, setError] = useState<string | null>(null);
  
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  // Quando l'utente cambia accounts, se non c'è un accountId selezionato e
  // ci sono accounts, preselezioniamo il primo (UX più snella)
  if (!accountId && accounts && accounts.length > 0) {
    setAccountId(accounts[0].id);
  }
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: {
            description: description.trim(),
            merchant: merchant.trim() || null,
            category_id: categoryId || null,
            occurred_at: fromDatetimeLocalInput(occurredAt),
          },
        });
      } else {
        await createMutation.mutateAsync({
          account_id: accountId,
          category_id: categoryId || null,
          direction,
          amount: Number(amount),
          description: description.trim(),
          merchant: merchant.trim() || null,
          occurred_at: fromDatetimeLocalInput(occurredAt),
        });
      }
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  
  // Mostra errore se l'utente non ha account configurati
  if (!isEdit && accounts && accounts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-300 mb-3">
          Per registrare transazioni devi prima creare almeno un account.
        </p>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Chiudi
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />
      
      {/* Direction picker (solo in CREATE) */}
      {!isEdit && (
        <div>
          <Label>Tipo</Label>
          <div className="grid grid-cols-2 gap-2">
            <DirectionButton
              active={direction === "expense"}
              onClick={() => setDirection("expense")}
              disabled={isPending}
              label="Uscita"
              emoji="⬇️"
              activeClass="bg-rose-500/20 border-rose-500 text-rose-300"
            />
            <DirectionButton
              active={direction === "income"}
              onClick={() => setDirection("income")}
              disabled={isPending}
              label="Entrata"
              emoji="⬆️"
              activeClass="bg-emerald-500/20 border-emerald-500 text-emerald-300"
            />
          </div>
        </div>
      )}
      
      {/* Amount (readonly in EDIT) */}
      <div>
        <Label htmlFor="txn-amount">Importo (€)</Label>
        <Input
          id="txn-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={isPending || isEdit}
        />
        {isEdit && (
          <p className="text-xs text-slate-500 mt-1">
            L'importo non si può modificare. Per correggerlo, annulla e ricrea la transazione.
          </p>
        )}
      </div>
      
      {/* Account (readonly in EDIT) */}
      <div>
        <Label htmlFor="txn-account">Account</Label>
        <Select
          id="txn-account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          disabled={isPending || isEdit}
        >
          {accounts?.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {ACCOUNT_TYPE_EMOJI[acc.type]} {acc.name}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Description */}
      <div>
        <Label htmlFor="txn-description">Descrizione</Label>
        <Input
          id="txn-description"
          type="text"
          placeholder="Es. Pranzo, Stipendio, Bolletta"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={1}
          maxLength={255}
          disabled={isPending}
        />
      </div>
      
      {/* Merchant (opzionale) */}
      <div>
        <Label htmlFor="txn-merchant">Da/a chi (opzionale)</Label>
        <Input
          id="txn-merchant"
          type="text"
          placeholder="Es. Bar Stella, Datore di lavoro"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          maxLength={255}
          disabled={isPending}
        />
      </div>
      
      {/* Category (opzionale) */}
      <div>
        <Label htmlFor="txn-category">Categoria (opzionale)</Label>
        <Select
          id="txn-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isPending}
        >
          <option value="">— Nessuna —</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Data/ora */}
      <div>
        <Label htmlFor="txn-when">Quando</Label>
        <Input
          id="txn-when"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Registra transazione"}
        </Button>
      </div>
    </form>
  );
}


// ============================================================
// SUB-COMPONENTS
// ============================================================

interface DirectionButtonProps {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  label: string;
  emoji: string;
  activeClass: string;
}

function DirectionButton({
  active,
  onClick,
  disabled,
  label,
  emoji,
  activeClass,
}: DirectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        p-3 rounded-lg border-2 transition flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${active ? activeClass : "border-slate-700 text-slate-400 hover:border-slate-600"}
      `}
    >
      <span aria-hidden>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}