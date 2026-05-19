import { AlertCircle } from "lucide-react";


interface FormErrorProps {
  /** Messaggio di errore. Se null/undefined, non renderizza nulla. */
  message?: string | null;
}


/**
 * Box di errore in cima ai form.
 *
 * Mostra messaggio rosso con icona Lucide. Se message è vuoto, ritorna null.
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  
  return (
    <div
      className="
        flex items-start gap-2.5
        bg-danger-soft border border-danger/30
        text-danger text-sm
        rounded-lg px-3 py-2.5
        animate-fade-in
      "
      role="alert"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}