"use client";

import { useAccountsQuery, type Account } from "@/lib/api/accounts";
import { AccountRow } from "./AccountRow";


interface AccountListProps {
  onEdit: (account: Account) => void;
}

export function AccountList({ onEdit }: AccountListProps) {
  const { data: accounts, isLoading, error } = useAccountsQuery();
  
  if (isLoading) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        Caricamento account...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
        Errore: {error.message}
      </div>
    );
  }
  
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-8">
        Nessun account. Creane uno per iniziare!
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {accounts.map((acc) => (
        <AccountRow key={acc.id} account={acc} onEdit={onEdit} />
      ))}
    </div>
  );
}