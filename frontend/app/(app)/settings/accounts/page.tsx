"use client";

import { ChevronRight, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList } from "@/components/accounts/AccountList";
import { BalanceSummary } from "@/components/accounts/BalanceSummary";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Account } from "@/lib/api/accounts";


export default function AccountsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  
  function openEdit(account: Account) {
    setEditing(account);
    setModalOpen(true);
  }
  
  function close() {
    setModalOpen(false);
    setEditing(null);
  }
  
  return (
    <main className="min-h-screen bg-bg-base p-4 sm:p-6">
      <div className="max-w-2xl mx-auto py-6 space-y-4">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs text-fg-muted"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-fg-primary transition-colors duration-150"
          >
            Home
          </Link>
          <ChevronRight className="w-3 h-3" aria-hidden />
          <span className="text-fg-secondary">Account</span>
        </nav>
        
        {/* Balance summary */}
        <BalanceSummary />
        
        {/* Lista */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <Wallet className="w-5 h-5 text-fg-muted shrink-0" />
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                I tuoi account
              </h1>
            </div>
            <Button
              onClick={openCreate}
              size="sm"
              fullWidth={false}
              iconLeft={<Plus className="w-3.5 h-3.5" />}
            >
              Nuovo
            </Button>
          </div>
          
          <AccountList onEdit={openEdit} />
        </div>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica account" : "Nuovo account"}
        description={
          editing
            ? undefined
            : "Aggiungi un conto bancario, contanti, carta di credito o altro strumento."
        }
        size="md"
      >
        <AccountForm
          initial={editing ?? undefined}
          onSuccess={close}
          onCancel={close}
        />
      </Modal>
    </main>
  );
}