import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";


interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Mostra il campo come errore (bordo rosso) */
  hasError?: boolean;
  
  /** Icona Lucide a sinistra dentro l'input (es. lente, mail) */
  iconLeft?: ReactNode;
  
  /** Suffisso testuale a destra (es. "€", "%") */
  suffix?: ReactNode;
}


/**
 * Input testuale di MoneyBuddy.
 *
 * Esempi:
 *   <Input type="email" placeholder="email" />
 *   <Input iconLeft={<Search />} placeholder="Cerca..." />
 *   <Input type="number" suffix="€" placeholder="0,00" />
 *   <Input hasError placeholder="..." />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", hasError, iconLeft, suffix, ...props }, ref) => {
    const hasDecorations = iconLeft || suffix;
    
    const inputClasses = [
      "w-full px-4 py-2.5 rounded-lg text-sm",
      "glass-input text-fg-primary",
      "transition-all duration-200",
      hasError
        ? "border border-danger focus:border-danger focus:ring-1 focus:ring-danger"
        : "border border-glass-border focus:border-accent focus:ring-1 focus:ring-accent",
      "placeholder:text-fg-muted",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "focus:outline-none",
      iconLeft ? "pl-10" : "",
      suffix ? "pr-10" : "",
    ].filter(Boolean).join(" ");
    
    // Caso semplice: nessuna decorazione → input puro
    if (!hasDecorations) {
      return (
        <input
          ref={ref}
          className={`${inputClasses} ${className}`}
          {...props}
        />
      );
    }
    
    // Caso con decorazioni: wrappiamo in relative
    return (
      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          className={`${inputClasses} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";