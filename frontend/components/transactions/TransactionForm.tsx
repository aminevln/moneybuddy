"use client";

/**
 * Form per creare/modificare una transazione.
 *
 * Modalità create:
 * - Tutti i campi modificabili
 * - Direction = expense di default
 *
 * Modalità edit:
 * - Direction, account, amount sono READONLY
 * - Solo description, merchant, category, datetime sono modificabili
 */

import { ArrowDownRight, ArrowUpRight, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { ACCOUNT_TYPE_EMOJI, useAccountsQuery } from "@/lib/api/accounts";
import { useCategoriesQuery } from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/api/errors";
import {
  type Transaction,
  type TxnDirection,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} from "@/lib/api/transactions";
import {
  fromDatetimeLocalInput,
  toDatetimeLocalInput,
} from "@/lib/format/date";


interface TransactionFormProps {
  initial?: Transaction;
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
  
  const [direction, setDirection] = useState<TxnDirection>(
    initial?.direction ?? "expense"
  );
  const [accountId, setAccountId] = useState(
    initial?.account_id ?? defaultAccountId ?? ""
  );
  const [categoryId, setCategoryId] = useState<string>(
    initial?.category_id ?? ""
  );
  const [amount, setAmount] = useState<string>(initial?.amount ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [occurredAt, setOccurredAt] = useState(
    initial
      ? toDatetimeLocalInput(new Date(initial.occurred_at))
      : toDatetimeLocalInput()
  );
  
  const [error, setError] = useState<string | null>(null);
  
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  // Preselect first account
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
  
  // No accounts → CTA
  if (!isEdit && accounts && accounts.length === 0) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-fg-secondary text-sm">
          Per registrare transazioni devi prima creare almeno un account.
        </p>
        <Button type="button" variant="secondary" onClick={onCancel} fullWidth={false}>
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
              icon={<ArrowDownRight className="w-4 h-4" />}
              activeColor="danger"
            />
            <DirectionButton
              active={direction === "income"}
              onClick={() => setDirection("income")}
              disabled={isPending}
              label="Entrata"
              icon={<ArrowUpRight className="w-4 h-4" />}
              activeColor="success"
            />
          </div>
        </div>
      )}
      
      {/* Amount */}
      <div>
        <Label htmlFor="txn-amount" required={!isEdit}>
          Importo
        </Label>
        <Input
          id="txn-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          suffix="€"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          disabled={isPending || isEdit}
        />
        {isEdit && (
          <p className="flex items-start gap-1.5 text-xs text-fg-muted mt-1.5">
            <Lock className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              L'importo non si può modificare. Per correggerlo, annulla e ricrea la transazione.
            </span>
          </p>
        )}
      </div>
      
      {/* Account */}
      <div>
        <Label htmlFor="txn-account" required={!isEdit}>
          Account
        </Label>
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
        <Label htmlFor="txn-description" required>
          Descrizione
        </Label>
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
      
      {/* Merchant */}
      <div>
        <Label htmlFor="txn-merchant">Da / a chi</Label>
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
      
      {/* Category */}
      <div>
        <Label htmlFor="txn-category">Categoria</Label>
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
      
      {/* When */}
      <div>
        <Label htmlFor="txn-when" required>
          Quando
        </Label>
        <Input
          id="txn-when"
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          required
          disabled={isPending}
        />
      </div>
      
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
  icon: React.ReactNode;
  activeColor: "success" | "danger";
}


function DirectionButton({
  active,
  onClick,
  disabled,
  label,
  icon,
  activeColor,
}: DirectionButtonProps) {
  const activeClasses = {
    success: "bg-success-soft border-success text-success",
    danger: "bg-danger-soft border-danger text-danger",
  }[activeColor];
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-3 py-2.5 rounded-lg border-2 text-sm font-medium
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base
        ${
          active
            ? activeClasses
            : "bg-bg-surface border-border text-fg-secondary hover:border-border-strong hover:text-fg-primary"
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}