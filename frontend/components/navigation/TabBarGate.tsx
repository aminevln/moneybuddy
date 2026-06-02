"use client";

/**
 * Decide se mostrare la MobileTabBar in base al path corrente.
 *
 * Nasconde la tab bar dove non ha senso:
 * - /chat       → la chat è a tutto schermo, ha già il suo input in basso
 * - /login, /register, /forgot-password, /reset-password → flussi auth
 *
 * Ovunque altro (home, transazioni, budget, settings...) la mostra.
 */

import { usePathname } from "next/navigation";

import { MobileTabBar } from "./MobileTabBar";


// Path su cui la tab bar NON deve apparire.
const HIDDEN_PREFIXES = [
  "/chat",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];


export function TabBarGate() {
  const pathname = usePathname();

  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (hidden) return null;

  return <MobileTabBar />;
}