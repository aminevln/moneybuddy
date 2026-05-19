"use client";

/**
 * Modal con backdrop, chiusura su ESC + click esterno, animazioni.
 *
 * Uso:
 *   <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Crea categoria">
 *     <Form />
 *   </Modal>
 */

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";


interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  
  /** Dimensione massima del modal */
  size?: "sm" | "md" | "lg";
  
  /** Sottotitolo opzionale sotto al titolo */
  description?: string;
  
  children: ReactNode;
}


export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: ModalProps) {
  // Chiudi con ESC
  useEffect(() => {
    if (!open) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);
  
  // Blocca scroll del body quando aperto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);
  
  if (!open) return null;
  
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[size];
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
          bg-bg-surface border border-border rounded-xl
          w-full ${sizeClasses}
          shadow-2xl animate-slide-up
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div className="min-w-0 flex-1">
            <h2
              id="modal-title"
              className="font-display text-lg font-semibold text-fg-primary"
            >
              {title}
            </h2>
            {description && (
              <p className="text-fg-secondary text-sm mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="
              shrink-0 inline-flex items-center justify-center
              w-8 h-8 rounded-md
              text-fg-muted hover:text-fg-primary hover:bg-bg-elevated
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
            "
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}