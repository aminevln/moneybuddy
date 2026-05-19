import type { ReactNode, HTMLAttributes } from "react";


interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Variante della card.
   * - default: card standard, sfondo surface (per form, dettagli)
   * - subtle: sfondo leggermente più scuro (per widget secondari)
   * - elevated: sfondo più alto (per modal interni, dropdown)
   */
  variant?: "default" | "subtle" | "elevated";
  
  /**
   * Padding interno.
   * - sm: 16px (per liste compatte)
   * - md: 20px (default, widget standard)
   * - lg: 32px (per landing, hero, login)
   */
  padding?: "sm" | "md" | "lg";
  
  /** Se true, applica hover state (per card cliccabili) */
  hoverable?: boolean;
  
  children: ReactNode;
}


/**
 * Card di MoneyBuddy con bordo sottile e sfondo velluto.
 *
 * Esempi:
 *   <Card>Contenuto base</Card>
 *   <Card variant="subtle" padding="sm">Widget compatto</Card>
 *   <Card padding="lg">Login form</Card>
 *   <Card hoverable onClick={...}>Card cliccabile</Card>
 */
export function Card({
  variant = "default",
  padding = "md",
  hoverable = false,
  children,
  className = "",
  ...props
}: CardProps) {
  const baseClasses = [
    "rounded-xl border transition-all duration-200",
  ].join(" ");
  
  const variantClasses = {
    default: "bg-bg-surface border-border",
    subtle: "bg-bg-base border-border-muted",
    elevated: "bg-bg-elevated border-border",
  }[variant];

  const interactionClasses = hoverable
    ? "hover:bg-bg-elevated hover:border-border-strong cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
    : "";
  
  const paddingClasses = {
    sm: "p-4",
    md: "p-5",
    lg: "p-8",
  }[padding];
  
  
  return (
    <div
      className={`${baseClasses} ${variantClasses} ${paddingClasses} ${interactionClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}