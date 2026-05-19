/**
 * Pallino colorato per indicare il colore di una categoria.
 *
 * Se color è null/undefined, mostra un cerchio grigio neutro (fg-muted).
 *
 * Sizes:
 *   - xs: 6px (per spazi tight inline)
 *   - sm: 8px (default per liste)
 *   - md: 12px (per badge prominenti)
 *   - lg: 16px (per header dettagli)
 */

interface ColorDotProps {
  color: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
}


export function ColorDot({ color, size = "sm" }: ColorDotProps) {
  const sizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }[size];
  
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${sizeClasses}`}
      style={{
        backgroundColor: color ?? "var(--color-fg-muted)",
      }}
      aria-hidden
    />
  );
}