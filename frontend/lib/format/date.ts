/**
 * Formattazione date in italiano.
 */


/**
 * "2026-05-12T12:30:00Z" → "12 maggio 2026"
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!isValidDate(d)) return "—";
  
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


/**
 * "2026-05-12T12:30:00Z" → "12 mag"
 */
export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (!isValidDate(d)) return "—";
  
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}


/**
 * "2026-05-12T12:30:00Z" → "12:30"
 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (!isValidDate(d)) return "—";
  
  return d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}


/**
 * "2026-05-12T12:30:00Z" → "Oggi" | "Ieri" | "12 mag 2026"
 *
 * Usato per raggruppare le transazioni cronologicamente.
 */
export function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  if (!isValidDate(d)) return "—";
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(d, today)) return "Oggi";
  if (isSameDay(d, yesterday)) return "Ieri";
  
  // Stesso anno → "12 mag", altrimenti "12 mag 2024"
  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}


/**
 * Converte una Date in formato compatibile con <input type="datetime-local">
 * Es: Date → "2026-05-12T12:30"
 *
 * Il tag <input type="datetime-local"> richiede questo formato specifico
 * (no secondi, no timezone). Il browser lo interpreta come ora LOCALE.
 */
export function toDatetimeLocalInput(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}


/**
 * Converte stringa "2026-05-12T12:30" (datetime-local) in ISO UTC.
 * Es: "2026-05-12T12:30" → "2026-05-12T10:30:00.000Z" (se locale è CET/CEST)
 *
 * Necessario perché il backend si aspetta ISO con timezone.
 */
export function fromDatetimeLocalInput(value: string): string {
  if (!value) return new Date().toISOString();
  // value è interpretato come ora locale, Date lo converte automaticamente
  return new Date(value).toISOString();
}


// ============================================================
// HELPERS
// ============================================================

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}