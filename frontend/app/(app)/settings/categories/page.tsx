"use client";

/**
 * Pagina di gestione categorie.
 */

import { ChevronRight, FolderTree, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryList } from "@/components/categories/CategoryList";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Category } from "@/lib/api/categories";


export default function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  
  function openEdit(category: Category) {
    setEditing(category);
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
          <span className="text-fg-secondary">Categorie</span>
        </nav>
        
        {/* Main card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <FolderTree className="w-5 h-5 text-fg-muted shrink-0" />
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                Categorie
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
          <p className="text-fg-secondary text-sm mb-6">
            Le categorie di sistema sono disponibili a tutti e non si possono
            modificare. Puoi crearne di tue.
          </p>
          
          <CategoryList onEdit={openEdit} />
        </div>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica categoria" : "Nuova categoria"}
        description={
          editing
            ? undefined
            : "Aggiungi una categoria personalizzata per organizzare le tue spese."
        }
        size="md"
      >
        <CategoryForm
          initial={editing ?? undefined}
          onSuccess={close}
          onCancel={close}
        />
      </Modal>
    </main>
  );
}