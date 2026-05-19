"use client";

import { Boxes, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AssetForm } from "@/components/assets/AssetForm";
import { AssetList } from "@/components/assets/AssetList";
import { Button } from "@/components/ui/Button";
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
          <span className="text-fg-secondary">Asset</span>
        </nav>
        
        {/* Main card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Boxes className="w-5 h-5 text-fg-muted shrink-0" />
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                I tuoi asset
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
            Le &quot;cose&quot; che possiedi: auto, casa, animali, dispositivi.
            L&apos;AI le userà per capire meglio le tue spese.
          </p>
          
          <AssetList onEdit={openEdit} />
        </div>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica asset" : "Nuovo asset"}
        description={
          editing
            ? undefined
            : "Aggiungi un'auto, una casa, un animale: l'AI userà queste informazioni per dare consigli più precisi."
        }
        size="md"
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