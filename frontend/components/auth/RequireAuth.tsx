"use client";

/**
 * RequireAuth: avvolge contenuto accessibile solo a utenti loggati.
 *
 * Comportamento:
 * - status="loading" → mostra spinner
 * - status="authenticated" → renderizza i children
 * - status="unauthenticated" → redirect a /login (con `?next=...` per tornare dopo)
 */

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth/context/useAuth";


export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (status === "unauthenticated") {
      // Salviamo la pagina di destinazione così dopo il login l'utente
      // ci torna automaticamente
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [status, router, pathname]);
  
  // Mentre carichiamo, mostra spinner
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400 text-sm">Verifico la sessione...</div>
      </div>
    );
  }
  
  // Non loggato: il useEffect sta facendo il redirect, nel frattempo non mostrare nulla
  if (status === "unauthenticated") {
    return null;
  }
  
  // Loggato: renderizza il contenuto della pagina
  return <>{children}</>;
}