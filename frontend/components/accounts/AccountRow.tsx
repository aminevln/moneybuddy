"use client";

/**
 * Singola riga della lista account.
 */

import {
  Banknote,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import {
  type Account,
  type AccountType,
  ACCOUNT_TYPE_LABELS,
  useDeleteAccountMutation,
  useUpdateAccountMutation,
} from "@/lib/api/accounts";
import { formatCurrency } from "@/lib/format/currency";


// Mappa account type → icona Lucide (sostituisce le emoji)
const ACCOUNT_TYPE_ICON: Record<AccountType, LucideIcon> = {
  checking: Landmark,
  cash: Banknote,
  credit_card: CreditCard,
  savings: TrendingUp,
  meal_voucher: Utensils,
  investment: Eye,
  // fallback per altri tipi futuri
  // savings: PiggyBank, ecc. — aggiungi se ti serve
};


// Mappa account type → colore icona viz (varia visivamente)
const ACCOUNT_TYPE_COLOR: Record<AccountType, string> = {
  checking: "var(--color-viz-5)",        // cyan
  cash: "var(--color-viz-2)",            // verde
  credit_card: "var(--color-viz-6)",     // rosa
  savings: "var(--color-viz-3)",      // viola
  meal_voucher: "var(--color-viz-4)",
  investment: "var(--color-viz-1)",      // blu
};


interface AccountRowProps {
  account: Account;
  onEdit: (account: Account) => void;
}


export function AccountRow({ account, onEdit }: AccountRowProps) {
  const deleteMutation = useDeleteAccountMutation();
  const updateMutation = useUpdateAccountMutation();
  
  const Icon = ACCOUNT_TYPE_ICON[account.type] ?? Wallet;
  const iconColor = ACCOUNT_TYPE_COLOR[account.type] ?? "var(--color-fg-muted)";
  
  async function handleDelete() {
    if (!confirm(`Eliminare l'account "${account.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(account.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante l'eliminazione";
      alert(message);
      console.error(err);
    }
  }
  
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg
        bg-bg-surface border border-border
        transition-all duration-150
      `}
    >
      {/* Icona tipo account */}
      <div
        className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg"
        style={{
          backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      
      {/* Nome + tipo */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-fg-primary truncate font-medium">
            {account.name}
          </p>
        </div>
        <p className="text-xs text-fg-muted mt-0.5">
          {ACCOUNT_TYPE_LABELS[account.type]}
          {!account.is_spendable && " · non spendibile"}
        </p>
      </div>
      
      {/* Balance + azioni */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-display text-sm font-semibold text-fg-primary tabular-nums whitespace-nowrap">
          {formatCurrency(account.current_balance)}
        </span>
        
        <div className="flex items-center gap-0.5">
          <IconButton
            size="sm"
            onClick={() => onEdit(account)}
            aria-label="Modifica"
            title="Modifica"
          >
            <Pencil className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton
            size="sm"
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            aria-label="Elimina"
            title="Elimina"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}