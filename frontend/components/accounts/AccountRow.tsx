"use client";

/**
 * Singola riga della lista account.
 */

import { IconButton } from "@/components/ui/IconButton";
import { formatCurrency } from "@/lib/format/currency";
import {
  ACCOUNT_TYPE_EMOJI,
  ACCOUNT_TYPE_LABELS,
  useDeleteAccountMutation,
  type Account,
} from "@/lib/api/accounts";


interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
}

export function AccountRow({ account, onEdit }: AccountRowProps) {
  const deleteMutation = useDeleteAccountMutation();
  
  async function handleDelete() {
    if (!confirm(`Eliminare l'account "${account.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(account.id);
    } catch (err) {
      alert("Errore durante l'eliminazione");
      console.error(err);
    }
  }
  
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-2xl flex-shrink-0" aria-hidden>
          {ACCOUNT_TYPE_EMOJI[account.type]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-slate-200 truncate">{account.name}</p>
          <p className="text-xs text-slate-500">
            {ACCOUNT_TYPE_LABELS[account.type]}
            {!account.is_spendable && " · non spendibile"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-slate-100 font-medium tabular-nums">
          {formatCurrency(account.current_balance)}
        </span>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => onEdit(account)}
            aria-label="Modifica"
            title="Modifica"
          >
            ✏️
          </IconButton>
          <IconButton
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            aria-label="Elimina"
            title="Elimina"
          >
            🗑️
          </IconButton>
        </div>
      </div>
    </div>
  );
}