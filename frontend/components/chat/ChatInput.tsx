"use client";

/**
 * Input per scrivere messaggi.
 *
 * Features:
 * - Textarea auto-resize (cresce con il contenuto, max 6 righe)
 * - Enter = invia, Shift+Enter = newline
 * - Bottone "Invia" disabled se input vuoto o pending
 * - Auto-focus al mount
 */

import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";


interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}


export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize: ogni volta che il value cambia, ricalcola altezza
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    // Limita a 6 righe (~144px)
    const maxHeight = 6 * 24;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [value]);
  
  // Auto-focus al mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);
  
  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    
    onSend(trimmed);
    setValue("");
    
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = "auto";
  }
  
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
  
  const canSend = value.trim().length > 0 && !disabled;
  
  return (
    <div className="border-t border-border bg-bg-base/80 backdrop-blur-md p-3 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <div
          className={`
            flex items-end gap-2 p-1.5 pr-2
            bg-bg-surface border rounded-2xl
            transition-colors duration-150
            ${disabled
              ? "border-border opacity-60"
              : "border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent"}
          `}
        >
          {/* Icona AI a sinistra */}
          <div className="shrink-0 p-2 text-fg-muted pointer-events-none">
            <Sparkles className="w-4 h-4" aria-hidden />
          </div>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            disabled={disabled}
            rows={1}
            className="
              flex-1 bg-transparent text-fg-primary text-sm
              py-2 pr-1
              focus:outline-none
              disabled:cursor-not-allowed
              resize-none
              placeholder:text-fg-muted
              leading-6
            "
          />
          
          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={`
              shrink-0 inline-flex items-center justify-center
              w-9 h-9 rounded-xl
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base
              ${canSend
                ? "bg-accent hover:bg-accent-hover active:bg-accent-pressed text-accent-fg scale-100"
                : "bg-bg-elevated text-fg-disabled cursor-not-allowed scale-95"}
            `}
            aria-label="Invia"
          >
            {disabled ? (
              <SpinnerIcon />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Hint sotto l'input */}
        <p className="text-[10px] text-fg-muted mt-2 text-center font-medium">
          <kbd className="px-1.5 py-0.5 rounded bg-bg-surface border border-border text-fg-secondary mr-1">Enter</kbd>
          per inviare
          <span className="mx-2">·</span>
          <kbd className="px-1.5 py-0.5 rounded bg-bg-surface border border-border text-fg-secondary mr-1">Shift+Enter</kbd>
          per nuova riga
        </p>
      </div>
    </div>
  );
}


/**
 * Spinner inline per stato pending.
 */
function SpinnerIcon() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}