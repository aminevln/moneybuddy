/**
 * Gestione dei token e dell'utente in localStorage.
 *
 * IMPORTANTE: localStorage è disponibile solo lato browser.
 * Lato server (durante SSR di Next.js) `window` non esiste.
 * Tutte le funzioni gestiscono il caso "sono nel server" restituendo null.
 */

import type { TokenPair, User } from "./types";

const ACCESS_TOKEN_KEY = "mb.access_token";
const REFRESH_TOKEN_KEY = "mb.refresh_token";
const USER_KEY = "mb.user";


// ============================================================
// HELPER: siamo lato browser?
// ============================================================
function isBrowser(): boolean {
  return typeof window !== "undefined";
}


// ============================================================
// TOKENS
// ============================================================

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: TokenPair): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}


// ============================================================
// USER
// ============================================================

export function getStoredUser(): User | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    // JSON corrotto, pulisci
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(USER_KEY);
}


// ============================================================
// CLEAR ALL (logout)
// ============================================================

export function clearAuth(): void {
  clearTokens();
  clearStoredUser();
}