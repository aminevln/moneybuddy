/**
 * Gestisce il refresh del token in modo "single-flight".
 *
 * Problema: se 5 richieste API partono in parallelo e tutte ricevono
 * 401 (token scaduto), non vogliamo 5 chiamate concorrenti a /auth/refresh.
 *
 * Soluzione: tenere un singolo Promise "in volo". La prima 401 lo crea,
 * le altre lo aspettano. Quando finisce (success o failure), il Promise
 * viene resettato e i prossimi 401 ricominciano il ciclo.
 *
 * Questo modulo non sa nulla del context React: funziona puramente con
 * localStorage e API. È volutamente "stateless" rispetto a React.
 */

import { refreshTokens } from "@/lib/auth/api";
import {
  clearAuth,
  getRefreshToken,
  setTokens,
} from "@/lib/auth/storage";


// Il Promise "in volo" (null se nessun refresh in corso)
let refreshPromise: Promise<string> | null = null;


/**
 * Tenta di rinnovare l'access token.
 *
 * Restituisce il nuovo access token in caso di successo,
 * oppure lancia un errore se il refresh è impossibile.
 *
 * Se chiamata 5 volte in parallelo, fa 1 sola chiamata HTTP a /auth/refresh.
 */
export async function performRefresh(): Promise<string> {
  // Se c'è già un refresh in volo, aspettiamolo invece di farne uno nuovo
  if (refreshPromise) {
    return refreshPromise;
  }
  
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Nessun refresh token disponibile");
  }
  
  // Crea il Promise singleton
  refreshPromise = (async () => {
    try {
      const newTokens = await refreshTokens(refreshToken);
      setTokens(newTokens);
      return newTokens.access_token;
    } catch (error) {
      // Refresh fallito: probabilmente è scaduto o invalido.
      // Puliamo lo stato auth, il chiamante deve fare redirect a /login.
      clearAuth();
      throw error;
    } finally {
      // Reset così i prossimi 401 possono ritentare un nuovo refresh
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}


/**
 * Hook esposto: notifica esterna quando il refresh fallisce.
 *
 * Le componenti React (es. AuthProvider) si possono "abbonare" per
 * sapere quando bisogna fare logout. Usiamo un callback set semplice
 * invece di event emitter complessi.
 */
type LogoutListener = () => void;
const logoutListeners = new Set<LogoutListener>();

export function onForcedLogout(listener: LogoutListener): () => void {
  logoutListeners.add(listener);
  return () => {
    logoutListeners.delete(listener);
  };
}

export function notifyForcedLogout(): void {
  for (const listener of logoutListeners) {
    listener();
  }
}