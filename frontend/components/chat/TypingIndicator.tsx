/**
 * Indicatore "MoneyBuddy sta scrivendo..." con 3 puntini animati.
 *
 * I puntini fanno un'onda (uno dopo l'altro) invece di bouncing simultaneo.
 * Coerente con la bolla assistant per continuità visiva.
 */

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div
        className="
          bg-bg-surface border border-border
          rounded-2xl rounded-bl-md
          px-4 py-3
          flex items-center gap-1.5
        "
        aria-label="MoneyBuddy sta scrivendo"
        role="status"
      >
        <span className="w-2 h-2 bg-fg-muted rounded-full animate-typing-dot [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-fg-muted rounded-full animate-typing-dot [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-fg-muted rounded-full animate-typing-dot [animation-delay:300ms]" />
      </div>
    </div>
  );
}