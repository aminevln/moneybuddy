import type { LabelHTMLAttributes, ReactNode } from "react";


interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Mostra asterisco rosso per campi obbligatori */
  required?: boolean;
  
  children: ReactNode;
}


/**
 * Label per campi form.
 *
 * Esempi:
 *   <Label htmlFor="email">Email</Label>
 *   <Label htmlFor="password" required>Password</Label>
 */
export function Label({
  children,
  required,
  className = "",
  ...props
}: LabelProps) {
  return (
    <label
      className={`
        block text-xs font-medium text-fg-secondary mb-1.5
        uppercase tracking-wider
        ${className}
      `}
      {...props}
    >
      {children}
      {required && (
        <span className="text-danger ml-0.5" aria-label="campo obbligatorio">
          *
        </span>
      )}
    </label>
  );
}