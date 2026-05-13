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

import Link from "next/link";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionPagination } from "@/components/transactions/TransactionPagination";
import { BalanceSummary } from "@/components/accounts/BalanceSummary";
import {
  useTransactionsQuery,
  type Transaction,
  type TransactionListFilters,
} from "@/lib/api/transactions";


export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionListFilters>({
    page: 1,
    page_size: 50,
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  
  // Carichiamo la stessa query qui per avere accesso a total/pagination
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto py-8">
        <nav className="text-sm text-slate-500 mb-4">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <span className="mx-2">/</span>
          <span>Transazioni</span>
        </nav>
        
        {/* Widget Disponibile in cima per contesto */}
        <div className="mb-4">
          <BalanceSummary />
        </div>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Transazioni</h1>
            <button
              onClick={openCreate}
              className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
            >
              + Nuova
            </button>
          </div>
          
          <TransactionFilters filters={filters} onChange={setFilters} />
          
          <TransactionList filters={filters} onEdit={openEdit} />
          
          {data && (
            <TransactionPagination
              page={data.page}
              pageSize={data.page_size}
              total={data.total}
              hasMore={data.has_more}
              onPageChange={setPage}
            />
          )}
        </Card>
      </div>
      
      <Modal
        open={modalOpen}
        onClose={close}
        title={editing ? "Modifica transazione" : "Nuova transazione"}
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