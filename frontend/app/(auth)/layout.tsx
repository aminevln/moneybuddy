/**
 * Layout per le pagine guest (login, register).
 *
 * Le pagine in (auth)/ condividono lo stesso wrapper centrato.
 * Le parentesi nel nome della cartella sono un "route group" di Next.js:
 * organizzano i file senza apparire nell'URL.
 */

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}