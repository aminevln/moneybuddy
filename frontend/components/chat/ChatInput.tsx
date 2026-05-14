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
    
    // Reset altezza
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = "auto";
  }
  
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
  
  return (
    <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur p-3">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio..."
          disabled={disabled}
          rows={1}
          className="
            flex-1 px-4 py-2.5 rounded-2xl
            bg-slate-800 text-slate-100 text-sm
            border border-slate-700
            focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            placeholder:text-slate-500
            transition
          "
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="
            px-4 py-2.5 rounded-2xl flex-shrink-0
            bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium
            disabled:opacity-30 disabled:cursor-not-allowed
            transition
          "
          aria-label="Invia"
        >
          Invia
        </button>
      </div>
    </div>
  );
}