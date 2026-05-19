"use client";

import { ChevronRight, PiggyBank, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BudgetForm } from "@/components/budgets/BudgetForm";
import { BudgetList } from "@/components/budgets/BudgetList";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { BudgetStatus } from "@/lib/api/budgets";


export default function BudgetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetStatus | null>(null);
  
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  
  function openEdit(status: BudgetStatus) {
    setEditing(status);
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
          <span className="text-fg-secondary">Budget</span>
        </nav>
        
        {/* Main card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <PiggyBank className="w-5 h-5 text-fg-muted shrink-0" />
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                Budget
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
            Imposta limiti di spesa per periodo. Le percentuali si aggiornano da sole.
          </p>
          
          <BudgetList onEdit={openEdit} />
        </div>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica budget" : "Nuovo budget"}
        description={
          editing
            ? undefined
            : "Definisci un limite massimo per una categoria e un periodo."
        }
        size="md"
      >
        <BudgetForm
          initial={editing ?? undefined}
          onSuccess={close}
          onCancel={close}
        />
      </Modal>
    </main>
  );
}