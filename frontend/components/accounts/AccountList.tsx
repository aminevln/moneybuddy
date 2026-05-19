"use client";

import { AlertCircle, Wallet } from "lucide-react";

import { type Account, useAccountsQuery } from "@/lib/api/accounts";
import { AccountRow } from "./AccountRow";


interface AccountListProps {
  onEdit: (account: Account) => void;
}


export function AccountList({ onEdit }: AccountListProps) {
  const { data: accounts, isLoading, error } = useAccountsQuery();
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-bg-elevated rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div
        className="
          flex items-start gap-2.5
          bg-danger-soft border border-danger/30
          text-danger text-sm
          rounded-lg px-3 py-2.5
        "
        role="alert"
      >
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Errore: {error.message}</span>
      </div>
    );
  }
  
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-10 bg-bg-elevated/40 border border-border rounded-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
          <Wallet className="w-5 h-5 text-fg-muted" />
        </div>
        <p className="text-fg-primary font-medium mb-1">
          Nessun account
        </p>
        <p className="text-fg-secondary text-sm">
          Crea il primo per iniziare a registrare transazioni.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1.5">
      {accounts.map((acc) => (
        <AccountRow key={acc.id} account={acc} onEdit={onEdit} />
      ))}
    </div>
  );
}