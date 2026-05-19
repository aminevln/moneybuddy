import { forwardRef, type SelectHTMLAttributes } from "react";


interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}


/**
 * Select stile coerente con Input.
 * 
 * Children sono <option>. La freccia di dropdown è disegnata in SVG
 * con il colore brand per coerenza visiva.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", hasError, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-4 py-2.5 pr-10 rounded-lg text-sm
          bg-bg-surface text-fg-primary
          border transition-colors duration-150
          ${hasError
            ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
            : "border-border focus:border-accent focus:ring-1 focus:ring-accent"}
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none
          appearance-none
          bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 fill=%22none%22 stroke=%22%23b8b8c2%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')]
          bg-no-repeat bg-[length:14px_14px] bg-[position:right_14px_center]
          cursor-pointer
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