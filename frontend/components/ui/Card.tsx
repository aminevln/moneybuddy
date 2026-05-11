import type { ReactNode } from "react";

/**
 * Card centrale stile MoneyBuddy: sfondo scuro semi-trasparente
 * con bordo sottile e ombra morbida.
 */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
      {children}
    </div>
  );
}