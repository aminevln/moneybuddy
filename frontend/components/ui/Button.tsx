import type { ButtonHTMLAttributes, ReactNode } from "react";


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variante visiva del bottone.
   * - primary: CTA principale (arancione brand)
   * - secondary: azione neutra (grigio surface)
   * - ghost: testo solo, niente sfondo (link-like)
   * - danger: azione distruttiva (rosso)
   */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  
  /** Dimensione del bottone */
  size?: "sm" | "md" | "lg";
  
  /** Mostra spinner e disabilita */
  loading?: boolean;
  
  /** Larghezza piena del contenitore (default true per compatibilità) */
  fullWidth?: boolean;
  
  /** Icona Lucide a sinistra del testo */
  iconLeft?: ReactNode;
  
  /** Icona Lucide a destra del testo */
  iconRight?: ReactNode;
  
  children: ReactNode;
}


/**
 * Bottone primario di MoneyBuddy.
 *
 * Esempi:
 *   <Button>Salva</Button>
 *   <Button variant="secondary" size="sm">Annulla</Button>
 *   <Button iconLeft={<Plus />}>Nuovo budget</Button>
 *   <Button variant="danger" loading={isPending}>Elimina</Button>
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  iconLeft,
  iconRight,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = [
    "inline-flex items-center justify-center gap-2",
    "font-medium transition-colors duration-150",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    fullWidth ? "w-full" : "",
  ].join(" ");
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-md",
    md: "px-4 py-2.5 text-sm rounded-lg",
    lg: "px-5 py-3 text-base rounded-lg",
  }[size];
  
  const variantClasses = {
    primary:
      "bg-accent hover:bg-accent-hover active:bg-accent-pressed text-accent-fg",
    secondary:
      "bg-bg-elevated hover:bg-bg-surface text-fg-primary border border-border",
    ghost:
      "bg-transparent hover:bg-bg-elevated text-fg-secondary hover:text-fg-primary",
    danger:
      "bg-danger hover:bg-danger/90 active:bg-danger/80 text-danger-fg",
  }[variant];
  
  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
}


/**
 * Spinner inline per stato loading.
 * Animation via Tailwind: spin lento ma visibile.
 */
function Spinner() {
  return (
    <span className="inline-flex items-center gap-2">
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
      <span>Caricamento...</span>
    </span>
  );
}