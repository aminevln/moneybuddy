/**
 * Indicatore "MoneyBuddy sta scrivendo..." con 3 puntini animati.
 */

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
      </div>
    </div>
  );
}