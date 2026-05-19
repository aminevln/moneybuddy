import type { ButtonHTMLAttributes, ReactNode } from "react";


interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variante del bottone.
   * - default: testo neutro, hover surface elevated
   * - danger: testo rosso al hover (per delete)
   * - primary: hover con tinta arancione (per azioni positive secondarie)
   */
  variant?: "default" | "danger" | "primary";
  
  /** Dimensione del bottone */
  size?: "sm" | "md";
  
  children: ReactNode;
}


/**
 * Bottone piccolo per icone (Lucide) usato nelle row.
 *
 * Esempi:
 *   <IconButton aria-label="Modifica"><Pencil className="w-4 h-4" /></IconButton>
 *   <IconButton variant="danger" aria-label="Elimina"><Trash2 className="w-4 h-4" /></IconButton>
 */
export function IconButton({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  const baseClasses = [
    "inline-flex items-center justify-center",
    "rounded-md transition-colors duration-150",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
  ].join(" ");
  
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
  }[size];
  
  const variantClasses = {
    default: "text-fg-muted hover:text-fg-primary hover:bg-bg-elevated",
    danger: "text-fg-muted hover:text-danger hover:bg-danger-soft",
    primary: "text-fg-muted hover:text-accent hover:bg-accent-soft",
  }[variant];
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}