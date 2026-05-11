import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "danger";
}

/**
 * Bottone piccolo, "icona + testo" per azioni nelle liste.
 * Es. Modifica/Elimina su una row.
 */
export function IconButton({ children, variant = "default", className = "", ...props }: IconButtonProps) {
  const variantClasses = {
    default: "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
    danger: "text-slate-400 hover:text-red-400 hover:bg-red-500/10",
  };
  
  return (
    <button
      className={`p-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}