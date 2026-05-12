/**
 * Formattazione monetaria in italiano.
 *
 * Il backend ci manda i numeri come stringhe (es. "1500.00") per
 * preservare la precisione decimale. Qui li trasformiamo in
 * "€1.500,00" leggibili.
 */


/**
 * "1500.00" → "€1.500,00"
 */
export function formatCurrency(
  amount: string | number,
  currency: string = "EUR"
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  
  if (!Number.isFinite(value)) return "—";
  
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}


/**
 * "1500.00" → "1.500,00" (senza simbolo valuta)
 */
export function formatAmount(amount: string | number): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";
  
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}