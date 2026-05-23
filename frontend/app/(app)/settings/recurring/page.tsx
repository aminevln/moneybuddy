"use client";

import { ChevronRight, Plus, Repeat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RecurringForm } from "@/components/recurring/RecurringForm";
import { RecurringList } from "@/components/recurring/RecurringList";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { RecurringTransaction } from "@/lib/api/recurring";


export default function RecurringPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  
  function openEdit(item: RecurringTransaction) {
    setEditing(item);
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
          <span className="text-fg-secondary">Spese fisse</span>
        </nav>
        
        {/* Lista */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <Repeat className="w-5 h-5 text-fg-muted shrink-0" />
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                Spese fisse
              </h1>
            </div>
            <Button
              onClick={openCreate}
              size="sm"
              fullWidth={false}
              iconLeft={<Plus className="w-3.5 h-3.5" />}
            >
              Nuova
            </Button>
          </div>
          
          <RecurringList onEdit={openEdit} />
        </div>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica spesa fissa" : "Nuova spesa fissa"}
        description={
          editing
            ? undefined
            : "Stipendi, affitti, abbonamenti o spese ricorrenti che si ripetono nel tempo."
        }
        size="md"
      >
        <RecurringForm
          initial={editing ?? undefined}
          onSuccess={close}
          onCancel={close}
        />
      </Modal>
    </main>
  );
}