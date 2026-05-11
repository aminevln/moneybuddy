"use client";

/**
 * AuthProvider: Context React per lo stato di autenticazione globale.
 *
 * Espone:
 * - user: utente corrente (null se non loggato)
 * - status: "loading" | "authenticated" | "unauthenticated"
 * - login(email, password) → fa login e salva token+user
 * - register(payload) → registra e fa auto-login
 * - logout() → pulisce tutto
 * - refreshUser() → ricarica /auth/me (utile dopo modifiche)
 *
 * All'avvio dell'app legge l'utente da localStorage (se esiste)
 * e poi verifica con il backend chiamando /auth/me.
 */

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { onForcedLogout } from "@/lib/auth/refresh-manager";
import { getMe, loginUser, registerUser, type RegisterPayload } from "@/lib/auth/api";
import {
  clearAuth,
  getAccessToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";


type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  
  // ============================================================
  // BOOTSTRAP: al primo render, prova a recuperare la sessione
  // ============================================================
  useEffect(() => {
    let cancelled = false;
    
    async function bootstrap() {
      const token = getAccessToken();
      const cached = getStoredUser();
      
      if (!token) {
        // Nessun token salvato: non autenticato
        if (!cancelled) setStatus("unauthenticated");
        return;
      }
      
      // C'è un token: mostriamo subito l'utente cachato
      // (snappy UX, evita flicker)
      if (cached && !cancelled) {
        setUser(cached);
        setStatus("authenticated");
      }
      
      // ... e poi verifichiamo col backend
      try {
        const fresh = await getMe();
        if (!cancelled) {
          setUser(fresh);
          setStoredUser(fresh);
          setStatus("authenticated");
        }
      } catch {
        // Token scaduto/invalido: logout silenzioso
        if (!cancelled) {
          clearAuth();
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }
    
    bootstrap();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // Ascolta forced logout (es. refresh token fallito)
  // ============================================================
  useEffect(() => {
    const unsubscribe = onForcedLogout(() => {
      setUser(null);
      setStatus("unauthenticated");
      // Il redirect a /login lo facciamo nel componente RequireAuth
    });
    return unsubscribe;
  }, []);
  
  // ============================================================
  // ACTIONS
  // ============================================================
  
  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    setTokens(response.tokens);
    setStoredUser(response.user);
    setUser(response.user);
    setStatus("authenticated");
  }, []);
  
  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerUser(payload);
    setTokens(response.tokens);
    setStoredUser(response.user);
    setUser(response.user);
    setStatus("authenticated");
  }, []);
  
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setStatus("unauthenticated");
  }, []);
  
  const refreshUser = useCallback(async () => {
    try {
      const fresh = await getMe();
      setUser(fresh);
      setStoredUser(fresh);
    } catch {
      clearAuth();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}