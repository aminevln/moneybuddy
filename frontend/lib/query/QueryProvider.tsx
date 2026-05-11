"use client";

/**
 * QueryProvider: provider TanStack Query per tutta l'app.
 *
 * Configurazione:
 * - staleTime: 30s di default (dati considerati "freschi" per 30s,
 *   niente refetch in quel periodo)
 * - retry: 1 (riprova una volta in caso di errore, poi fallisce)
 * - refetchOnWindowFocus: true (refetch quando torni sulla tab)
 *
 * Include anche Devtools (visibili in dev mode, niente impatto in prod).
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";


export function QueryProvider({ children }: { children: ReactNode }) {
  // useState garantisce che il QueryClient sia creato UNA volta sola
  // per istanza del Provider. Senza, ogni render creerebbe un nuovo
  // client (bug classico in tutorial vecchi).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,           // 30 secondi
            retry: 1,                        // 1 retry in caso di errore
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: 0,                        // niente retry sulle scritture
          },
        },
      })
  );
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}