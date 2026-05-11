/**
 * Layout per pagine "app" (protette, richiedono login).
 *
 * Avvolge tutto in <RequireAuth> così ogni pagina dentro (app)/
 * è automaticamente protetta. Niente da ricordare per le singole pagine.
 */

import type { ReactNode } from "react";

import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}