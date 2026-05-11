/**
 * Client HTTP per parlare al backend.
 *
 * Caratteristiche:
 * - Base URL da NEXT_PUBLIC_API_URL
 * - Headers di default (JSON)
 * - Gestione errori uniforme (ApiError)
 * - Inietta automaticamente il Bearer token se disponibile
 *
 * In 2.D.3 aggiungeremo auto-refresh al 401.
 */

import { getAccessToken } from "@/lib/auth/storage";

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
   * Se true, NON inietta automaticamente il Bearer token.
   * Usato dagli endpoint pubblici (/auth/login, /auth/register).
   */
  skipAuth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;
  
  const url = `${API_URL}${path}`;
  
  // Costruiamo gli headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };
  
  // Inietta token se disponibile e non disabilitato
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(url, { ...rest, headers });
  
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