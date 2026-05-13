"use client";

import Link from "next/link";
import { useState } from "react";

import { AssetForm } from "@/components/assets/AssetForm";
import { AssetList } from "@/components/assets/AssetList";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { UserAsset } from "@/lib/api/assets";


export default function AssetsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserAsset | null>(null);
  
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  
  function openEdit(asset: UserAsset) {
    setEditing(asset);
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
          <span>Asset</span>
        </nav>
        
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white">I tuoi asset</h1>
            <button
              onClick={openCreate}
              className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
            >
              + Nuovo
            </button>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Le "cose" che possiedi: auto, casa, animali, dispositivi.
            L'AI le userà per capire meglio le tue spese.
          </p>
          
          <AssetList onEdit={openEdit} />
        </Card>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica asset" : "Nuovo asset"}
      >
        <AssetForm
          initial={editing ?? undefined}
          onSuccess={close}
          onCancel={close}
        />
      </Modal>
    </main>
  );
}