"use client";

/**
 * Bolla speciale per le proposte di transazione.
 *
 * Stati:
 * - pending: bottoni Conferma/Annulla attivi
 * - confirmed: badge "Confermato" verde, bottoni nascosti
 * - rejected: badge "Annullato" grigio, bottoni nascosti
 */

import { useAccountsQuery, ACCOUNT_TYPE_EMOJI } from "@/lib/api/accounts";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  useConfirmProposalMutation,
  useRejectProposalMutation,
  type ChatMessage,
  type TransactionProposal,
} from "@/lib/api/chat";
import { formatCurrency } from "@/lib/format/currency";


interface ProposalCardProps {
  message: ChatMessage;
}

export function ProposalCard({ message }: ProposalCardProps) {
  const proposal = message.tool_calls as unknown as TransactionProposal;
  const { args, status } = proposal;
  
  const confirmMutation = useConfirmProposalMutation();
  const rejectMutation = useRejectProposalMutation();
  
  const { data: accounts } = useAccountsQuery();
  const { data: categories } = useCategoriesQuery();
  
  const account = accounts?.find((a) => a.id === args.account_id);
  const category = categories?.find((c) => c.id === args.category_id);
  
  const isPending = status === "pending";
  const isConfirmed = status === "confirmed";
  const isRejected = status === "rejected";
  const isLoading = confirmMutation.isPending || rejectMutation.isPending;
  
  const sign = args.direction === "income" ? "+" : "−";
  const directionLabel = args.direction === "income" ? "Entrata" : "Uscita";
  const amountColor =
    args.direction === "income" ? "text-emerald-400" : "text-rose-400";
  
  function handleConfirm() {
    confirmMutation.mutate(message.id);
  }
  
  function handleReject() {
    rejectMutation.mutate(message.id);
  }
  
  return (
    <div className="flex justify-start">
      <div
        className={`
          max-w-[90%] rounded-2xl rounded-bl-sm overflow-hidden
          border-2
          ${isPending ? "border-emerald-500/50 bg-slate-800" : ""}
          ${isConfirmed ? "border-emerald-500/30 bg-slate-800/50" : ""}
          ${isRejected ? "border-slate-700 bg-slate-800/30 opacity-60" : ""}
        `}
      >
        {/* Header */}
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <span aria-hidden>💡</span>
            <span className="uppercase tracking-wider font-semibold">
              Proposta
            </span>
          </div>
          {isConfirmed && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <span aria-hidden>✓</span>
              <span>Confermata</span>
            </div>
          )}
          {isRejected && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span aria-hidden>✕</span>
              <span>Annullata</span>
            </div>
          )}
        </div>
        
        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              {directionLabel}
            </div>
            <div className={`text-3xl font-bold tabular-nums ${amountColor}`}>
              {sign}{formatCurrency(args.amount)}
            </div>
          </div>
          
          <div className="space-y-1.5 text-sm">
            <Field label="Descrizione" value={args.description} />
            
            {args.merchant && (
              <Field label="Esercente" value={args.merchant} />
            )}
            
            <Field
              label="Account"
              value={
                account
                  ? `${ACCOUNT_TYPE_EMOJI[account.type]} ${account.name}`
                  : "—"
              }
            />
            
            {category && (
              <Field label="Categoria" value={category.name} />
            )}
            
            <Field
              label="Quando"
              value={formatProposalDate(args.occurred_at)}
            />
          </div>
        </div>
        
        {/* Action buttons (solo se pending) */}
        {isPending && (
          <div className="border-t border-slate-700 p-3 flex gap-2">
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="
                flex-1 px-3 py-2 rounded-lg text-sm font-medium
                bg-slate-700 hover:bg-slate-600 text-slate-200
                disabled:opacity-50 disabled:cursor-not-allowed
                transition
              "
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="
                flex-1 px-3 py-2 rounded-lg text-sm font-medium
                bg-emerald-500 hover:bg-emerald-600 text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition
              "
            >
              Conferma
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// SUB-COMPONENTS
// ============================================================

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-slate-200 text-right truncate">{value}</span>
    </div>
  );
}


function formatProposalDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}