import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

/**
 * Select stile coerente con Input.
 *
 * Children sono <option>.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", hasError, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-4 py-2.5 rounded-lg
          bg-slate-900/50 text-slate-100
          border ${hasError ? "border-red-500" : "border-slate-700"}
          focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition
          appearance-none
          bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')]
          bg-no-repeat bg-[length:16px_16px] bg-[position:right_12px_center]
          pr-10
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";