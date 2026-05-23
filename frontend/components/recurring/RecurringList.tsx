"use client";

import { AlertCircle, Repeat } from "lucide-react";

import { type RecurringTransaction, useRecurringQuery } from "@/lib/api/recurring";
import { RecurringRow } from "./RecurringRow";


interface RecurringListProps {
  onEdit: (item: RecurringTransaction) => void;
}


export function RecurringList({ onEdit }: RecurringListProps) {
  const { data: items, isLoading, error } = useRecurringQuery();
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-bg-elevated rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div
        className="
          flex items-start gap-2.5
          bg-danger-soft border border-danger/30
          text-danger text-sm
          rounded-lg px-3 py-2.5
        "
        role="alert"
      >
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Errore: {error.message}</span>
      </div>
    );
  }
  
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 bg-bg-elevated/40 border border-border rounded-xl">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-elevated mb-3">
          <Repeat className="w-5 h-5 text-fg-muted" />
        </div>
        <p className="text-fg-primary font-medium mb-1">
          Nessuna spesa fissa
        </p>
        <p className="text-fg-secondary text-sm">
          Aggiungi stipendi, affitti o abbonamenti che si ripetono.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <RecurringRow key={item.id} item={item} onEdit={onEdit} />
      ))}
    </div>
  );
}