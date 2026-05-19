import type { ReactNode } from "react";


interface BadgeProps {
  /**
   * Variante semantica.
   * - default: neutro grigio (per "inattivo", tag generico)
   * - success: verde (per status positivi)
   * - danger: rosso (per errori, sforati)
   * - warning: ambra (per attenzione, in attesa)
   * - info: blu (per info, neutro)
   * - accent: arancione brand (per highlight)
   */
  variant?: "default" | "success" | "danger" | "warning" | "info" | "accent";
  
  /** Dimensione del badge */
  size?: "sm" | "md";
  
  /** Icona Lucide opzionale a sinistra del testo */
  icon?: ReactNode;
  
  children: ReactNode;
}


/**
 * Badge per status, label, conteggi.
 *
 * Esempi:
 *   <Badge>inattivo</Badge>
 *   <Badge variant="success" icon={<Check className="w-3 h-3" />}>Confermato</Badge>
 *   <Badge variant="warning">In attesa</Badge>
 *   <Badge variant="danger">Sforato</Badge>
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2 py-0.5 text-xs gap-1",
  }[size];
  
  const variantClasses = {
    default: "bg-bg-elevated text-fg-secondary border border-border",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
    accent: "bg-accent-soft text-accent",
  }[variant];
  
  return (
    <span
      className={`
        inline-flex items-center
        rounded-md font-medium
        ${sizeClasses} ${variantClasses}
      `}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}