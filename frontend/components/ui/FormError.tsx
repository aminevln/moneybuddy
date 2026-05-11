/**
 * Box di errore in cima ai form.
 * Mostra un messaggio rosso. Se message è null/undefined, non renderizza nulla.
 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
      {message}
    </div>
  );
}