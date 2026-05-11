/**
 * Pallino colorato per indicare il colore di una categoria.
 * Se color è null/undefined, mostra un cerchio grigio neutro.
 */
export function ColorDot({ color, size = "md" }: { color: string | null | undefined; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  return (
    <span
      className={`inline-block rounded-full ${sizeClass} flex-shrink-0`}
      style={{ backgroundColor: color ?? "#475569" }}
    />
  );
}