"use client";

/**
 * Bolla speciale per le proposte di transazione.
 *
 * Stati:
 * - pending: bottoni Conferma/Rifiuta attivi
 * - confirmed: badge "Confermata" success, bottoni nascosti
 * - rejected: badge "Rifiutata" muted, opacity ridotta
 */

import { Check, Lightbulb, X, XCircle } from "lucide-react";

import { ACCOUNT_TYPE_EMOJI, useAccountsQuery } from "@/lib/api/accounts";
import { useCategoriesQuery } from "@/lib/api/categories";
import {
  type ChatMessage,
  type TransactionProposal,
  useConfirmProposalMutation,
  useRejectProposalMutation,
} from "@/lib/api/chat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  
  const isIncome = args.direction === "income";
  const sign = isIncome ? "+" : "−";
  const directionLabel = isIncome ? "Entrata" : "Uscita";
  const amountColor = isIncome ? "text-success" : "text-danger";
  
  function handleConfirm() {
    confirmMutation.mutate(message.id);
  }
  
  function handleReject() {
    rejectMutation.mutate(message.id);
  }
  
  return (
    <div className="flex justify-start animate-fade-in">
      <div
        className={`
          max-w-[90%] sm:max-w-[420px] overflow-hidden
          bg-bg-surface border rounded-2xl rounded-bl-md
          transition-opacity duration-200
          ${isPending ? "border-accent/40" : ""}
          ${isConfirmed ? "border-success/30" : ""}
          ${isRejected ? "border-border opacity-60" : ""}
        `}
      >
        {/* Header */}
        <div
          className={`
            px-4 py-2.5 border-b
            flex items-center justify-between gap-2
            ${isPending ? "bg-accent-soft border-accent/20" : ""}
            ${isConfirmed ? "bg-success-soft border-success/20" : ""}
            ${isRejected ? "bg-bg-elevated border-border" : ""}
          `}
        >
          <div className="flex items-center gap-2">
            <div
              className={`
                inline-flex items-center justify-center w-6 h-6 rounded-md
                ${isPending ? "bg-accent text-accent-fg" : ""}
                ${isConfirmed ? "bg-success text-success-fg" : ""}
                ${isRejected ? "bg-bg-surface text-fg-muted" : ""}
              `}
            >
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <span
              className={`
                text-xs font-semibold uppercase tracking-wider
                ${isPending ? "text-accent" : ""}
                ${isConfirmed ? "text-success" : ""}
                ${isRejected ? "text-fg-muted" : ""}
              `}
            >
              Proposta
            </span>
          </div>
          
          {/* Status badge */}
          {isConfirmed && (
            <Badge variant="success" size="sm" icon={<Check className="w-3 h-3" />}>
              Confermata
            </Badge>
          )}
          {isRejected && (
            <Badge variant="default" size="sm" icon={<XCircle className="w-3 h-3" />}>
              Rifiutata
            </Badge>
          )}
        </div>
        
        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Importo (eyecatcher) */}
          <div>
            <div className="text-[10px] text-fg-muted uppercase tracking-wider font-medium mb-1">
              {directionLabel}
            </div>
            <div
              className={`
                font-display text-3xl font-bold tabular-nums tracking-tight
                ${amountColor}
              `}
            >
              {sign}{formatCurrency(args.amount)}
            </div>
          </div>
          
          {/* Details */}
          <div className="space-y-2 pt-1">
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
          <div className="border-t border-border p-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReject}
              disabled={isLoading}
              loading={rejectMutation.isPending}
              iconLeft={<X className="w-3.5 h-3.5" />}
            >
              Rifiuta
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={isLoading}
              loading={confirmMutation.isPending}
              iconLeft={<Check className="w-3.5 h-3.5" />}
            >
              Conferma
            </Button>
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
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-xs text-fg-muted shrink-0 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className="text-fg-primary text-right truncate font-medium">
        {value}
      </span>
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