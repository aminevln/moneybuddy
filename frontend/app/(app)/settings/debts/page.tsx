"use client";

import { ChevronRight, CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DebtForm } from "@/components/debts/DebtForm";
import { DebtList } from "@/components/debts/DebtList";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Debt } from "@/lib/api/debts";


export default function DebtsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  
  function openEdit(debt: Debt) {
    setEditing(debt);
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
          <span className="text-fg-secondary">Debiti</span>
        </nav>
        
        {/* Main card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard className="w-5 h-5 text-fg-muted shrink-0" />
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                I tuoi debiti
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
          <p className="text-fg-secondary text-sm mb-6">
            Mutui, finanziamenti, prestiti personali. Tieni traccia di quanto
            hai già rimborsato.
          </p>
          
          <DebtList onEdit={openEdit} />
        </div>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica debito" : "Nuovo debito"}
        description={
          editing
            ? undefined
            : "Registra un mutuo, un finanziamento o un prestito da rimborsare."
        }
        size="md"
      >
        <DebtForm
          initial={editing ?? undefined}
          onSuccess={close}
          onCancel={close}
        />
      </Modal>
    </main>
  );
}