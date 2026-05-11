import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

/**
 * Input testuale base con stile Tailwind.
 *
 * forwardRef permette ai componenti padre di accedere al DOM input
 * (utile per focus programmatico, validazione esterna, ecc.)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-4 py-2.5 rounded-lg
          bg-slate-900/50 text-slate-100
          border ${hasError ? "border-red-500" : "border-slate-700"}
          placeholder:text-slate-500
          focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";