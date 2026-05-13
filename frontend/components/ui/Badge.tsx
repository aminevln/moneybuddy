import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
}

/**
 * Badge piccolo, per status come "voided" o tag.
 */
export function Badge({ children, variant = "default" }: BadgeProps) {
  const variantClasses = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-500/20 text-emerald-400",
    danger: "bg-rose-500/20 text-rose-400",
    warning: "bg-amber-500/20 text-amber-400",
  };
  
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}