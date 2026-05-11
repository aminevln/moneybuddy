"use client";

/**
 * Pagina di gestione categorie.
 *
 * Lista categorie + bottone "Nuova" che apre il modal di creazione.
 * Click su una categoria (user-owned) apre il modal di modifica.
 */

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryList } from "@/components/categories/CategoryList";
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-4">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span className="mx-2">/</span>
          <span>Categorie</span>
        </nav>
        
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">Categorie</h1>
            <button
              onClick={openCreate}
              className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
            >
              + Nuova
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Le categorie di sistema sono disponibili a tutti e non si possono modificare.
            Puoi crearne di tue.
          </p>
          
          <CategoryList onEdit={openEdit} />
        </Card>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica categoria" : "Nuova categoria"}
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