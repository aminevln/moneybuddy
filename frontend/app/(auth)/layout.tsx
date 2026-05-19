/**
 * Layout per le pagine guest (login, register, forgot-password, reset-password).
 *
 * Le pagine in (auth)/ condividono lo stesso wrapper centrato con logo.
 */

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";


export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg-base p-4 sm:p-6">
      {/* Logo header */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 mb-8 transition-opacity duration-150 hover:opacity-80"
        aria-label="MoneyBuddy"
      >
        <Image
          src="/brand/logo.svg"
          alt="MoneyBuddy"
          width={180}
          height={36}
          priority
        />
      </Link>
      
      {/* Card content */}
      <div className="w-full max-w-md">
        {children}
      </div>
      
      {/* Footer claim */}
      <p className="mt-8 text-xs text-fg-muted text-center max-w-md">
        Conversa col tuo budget. <span className="text-fg-secondary">Powered by AI.</span>
      </p>
    </main>
  );
}