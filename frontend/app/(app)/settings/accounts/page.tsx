"use client";

import Link from "next/link";
import { useState } from "react";

import { AccountForm } from "@/components/accounts/AccountForm";
import { AccountList } from "@/components/accounts/AccountList";
import { BalanceSummary } from "@/components/accounts/BalanceSummary";
import { Card } from "@/components/ui/Card";
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto py-8">
        <nav className="text-sm text-slate-500 mb-4">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span className="mx-2">/</span>
          <span>Account</span>
        </nav>
        
        {/* Summary in cima */}
        <div className="mb-4">
          <BalanceSummary />
        </div>
        
        {/* Lista */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">I tuoi account</h1>
            <button
              onClick={openCreate}
              className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
            >
              + Nuovo
            </button>
          </div>
          
          <AccountList onEdit={openEdit} />
        </Card>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica account" : "Nuovo account"}
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