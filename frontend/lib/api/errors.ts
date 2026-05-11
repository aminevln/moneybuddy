/**
 * Helper per trasformare errori API in messaggi leggibili dall'utente.
 */

import { ApiError } from "./client";


/**
 * Estrae un messaggio user-friendly da qualsiasi errore.
 *
 * Casi gestiti:
 * - ApiError con detail string → usa quella stringa
 * - ApiError 422 (Pydantic validation) → tenta di formattare i field errors
 * - Network errors → messaggio generico "connessione"
 * - Tutto il resto → "Errore inatteso"
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = error.detail as
      | { detail?: string | Array<{ loc: string[]; msg: string }> }
      | undefined;
    
    // FastAPI restituisce { detail: "..." } per HTTPException
    if (typeof detail?.detail === "string") {
      return detail.detail;
    }
    
    // FastAPI restituisce { detail: [{ loc, msg, ... }] } per validation errors (422)
    if (Array.isArray(detail?.detail) && detail.detail.length > 0) {
      const first = detail.detail[0];
      const field = first.loc[first.loc.length - 1];
      return `${field}: ${first.msg}`;
    }
    
    // Fallback in base allo status code
    if (error.status === 401) return "Credenziali non valide";
    if (error.status === 403) return "Accesso non autorizzato";
    if (error.status === 404) return "Risorsa non trovata";
    if (error.status >= 500) return "Errore del server, riprova più tardi";
    
    return error.message;
  }
  
  // Errori di rete (fetch failed, no internet)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Impossibile contattare il server. Controlla la connessione.";
  }
  
  return "Errore inatteso. Riprova.";
}