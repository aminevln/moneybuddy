"use client";

/**
 * Pagina lista transazioni.
 *
 * Funzioni:
 * - Lista paginata (50 per pagina)
 * - Filtri (account, categoria, direction)
 * - "+ Nuova" per creare
 * - Click su una transazione per modificarla
 * - Bottone di void
 */

import { ChevronRight, Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BalanceSummary } from "@/components/accounts/BalanceSummary";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionPagination } from "@/components/transactions/TransactionPagination";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  type Transaction,
  type TransactionListFilters,
  useTransactionsQuery,
} from "@/lib/api/transactions";


export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionListFilters>({
    page: 1,
    page_size: 50,
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  
  const { data } = useTransactionsQuery(filters);
  
  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  
  function openEdit(txn: Transaction) {
    setEditing(txn);
    setModalOpen(true);
  }
  
  function close() {
    setModalOpen(false);
    setEditing(null);
  }
  
  function setPage(page: number) {
    setFilters({ ...filters, page });
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
          <span className="text-fg-secondary">Transazioni</span>
        </nav>
        
        {/* Balance summary */}
        <BalanceSummary />
        
        {/* Main card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Receipt className="w-5 h-5 text-fg-muted shrink-0" />
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                Transazioni
              </h1>
              {data && (
                <span className="text-xs text-fg-muted ml-1 tabular-nums shrink-0">
                  · {data.total}
                </span>
              )}
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
          
          {/* Filters */}
          <TransactionFilters filters={filters} onChange={setFilters} />
          
          {/* List */}
          <TransactionList filters={filters} onEdit={openEdit} />
          
          {/* Pagination */}
          {data && (
            <TransactionPagination
              page={data.page}
              pageSize={data.page_size}
              total={data.total}
              hasMore={data.has_more}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica transazione" : "Nuova transazione"}
        description={
          editing
            ? "Puoi modificare descrizione, categoria, esercente e data"
            : undefined
        }
        size="md"
      >
        <TransactionForm
          initial={editing ?? undefined}
          onSuccess={close}
          onCancel={close}
        />
      </Modal>
    </main>
  );
}