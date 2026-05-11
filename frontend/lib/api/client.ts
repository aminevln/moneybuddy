/**
 * Client HTTP per parlare al backend.
 *
 * Caratteristiche:
 * - Base URL da NEXT_PUBLIC_API_URL
 * - Headers di default (JSON)
 * - Gestione errori uniforme (ApiError)
 * - Inietta automaticamente il Bearer token se disponibile
 * - AUTO-REFRESH: se una richiesta ritorna 401 con token presente,
 *   prova a rinnovare il token e ripete la richiesta
 */

import { getAccessToken } from "@/lib/auth/storage";
import { notifyForcedLogout, performRefresh } from "@/lib/auth/refresh-manager";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  /**
   * Se true, NON inietta automaticamente il Bearer token
   * e NON tenta auto-refresh sul 401.
   * Usato dagli endpoint pubblici (/auth/login, /auth/register, /auth/refresh).
   */
  skipAuth?: boolean;
  
  /**
   * Flag interno: impedisce loop infiniti di refresh.
   * Quando una richiesta riprova dopo refresh, viene marcata con questa
   * flag per non riprovare ancora se torna 401 di nuovo.
   */
  _isRetry?: boolean;
}


export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { skipAuth = false, _isRetry = false, headers: customHeaders, ...rest } = options;
  
  const url = `${API_URL}${path}`;
  
  // Headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };
  
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(url, { ...rest, headers });
  
  // ===========================================================
  // AUTO-REFRESH sul 401
  // ===========================================================
  // Se l'access token è scaduto, tentiamo un refresh e ripetiamo
  // la richiesta originale. Condizioni:
  // - response 401
  // - non era una richiesta "skipAuth" (es. login)
  // - non è già un retry (evita loop infiniti)
  // - avevamo un token (altrimenti non c'è nulla da refreshare)
  if (
    response.status === 401 &&
    !skipAuth &&
    !_isRetry &&
    getAccessToken() !== null
  ) {
    try {
      await performRefresh();
      // Riprova con nuovo token
      return apiFetch<T>(path, { ...options, _isRetry: true });
    } catch {
      // Refresh fallito: notifica e fai cascare il 401 originale
      notifyForcedLogout();
    }
  }
  
  if (!response.ok) {
    let detail: unknown = undefined;
    try {
      detail = await response.json();
    } catch {
      // body non-JSON, ignora
    }
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
      detail
    );
  }
  
  return response.json() as Promise<T>;
}