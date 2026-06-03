"use client";

/**
 * Tab bar di navigazione mobile — pill flottante stile WhatsApp.
 *
 * - Visibile SOLO su mobile (sm:hidden). Su desktop resta la nav a chip.
 * - Pill fluttuante: staccata da bordi laterali e inferiore, angoli a capsula.
 * - Vetro scuro semi-trasparente con backdrop-blur morbido (no bordi netti).
 * - 5 voci: Home, Chat, Transazioni, Account, Altro.
 * - Active state: pill orizzontale chiara dietro icona+label della tab attiva.
 * - "Altro" apre un bottom sheet con le restanti sezioni.
 */

import {
  CreditCard,
  FolderTree,
  Home,
  MessageCircle,
  MoreHorizontal,
  PiggyBank,
  Receipt,
  Repeat,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";


interface TabDef {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

// Le 5 voci fisse della tab bar. "Altro" è gestita come bottone separato.
const MAIN_TABS: TabDef[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/transactions", label: "Transazioni", icon: Receipt },
  { href: "/settings/accounts", label: "Account", icon: Wallet },
];

// Sezioni dentro il menu "Altro".
const MORE_LINKS: TabDef[] = [
  { href: "/budgets", label: "Budget", icon: PiggyBank },
  { href: "/settings/categories", label: "Categorie", icon: FolderTree },
  { href: "/settings/recurring", label: "Spese fisse", icon: Repeat },
  { href: "/settings/assets", label: "Asset", icon: TrendingUp },
  { href: "/settings/debts", label: "Debiti", icon: CreditCard },
  { href: "/me", label: "Profilo", icon: User },
];


export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Una tab è attiva se il path corrente combacia.
  // La Home ("/") richiede match esatto, altrimenti sarebbe sempre attiva.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  // "Altro" è attivo se siamo su una delle sue sezioni.
  const moreActive = MORE_LINKS.some((l) => isActive(l.href));

  return (
    <>
      {/* ============================================================
          BOTTOM SHEET "ALTRO"
          ============================================================ */}
      {moreOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-bg-overlay backdrop-blur-md"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative glass-card glass-card-blur rounded-t-2xl rounded-b-none px-4 pt-4 animate-slide-up"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-fg-primary">
                Altro
              </h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-fg-muted hover:text-fg-primary hover:bg-bg-elevated transition-colors duration-150"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MORE_LINKS.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-xl border transition-all duration-200 ${
                      active
                        ? "bg-accent-soft border-accent/40 text-accent"
                        : "bg-glass-surface border-glass-border text-fg-secondary hover:text-fg-primary"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB BAR — pill flottante
          ============================================================
          <nav> = contenitore full-width fisso, trasparente.
          pointer-events-none così i tap "passano" ai lati della pill;
          la pill interna riattiva i pointer-events.
      */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        aria-label="Navigazione principale"
      >
        {/* La pill vera e propria */}
        <div className="glass-tabbar rounded-full px-2 py-2 pointer-events-auto w-full max-w-md">
          <div className="flex items-stretch justify-around gap-0.5">
            {MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center justify-center flex-1 gap-1 py-1 min-w-0"
                >
                  {/* Pill chiara dietro icona+label quando attiva (stile WhatsApp) */}
                  <span
                    className={`flex flex-col items-center justify-center gap-0.5 w-full px-1 py-1 rounded-2xl transition-all duration-200 ${
                      active ? "tab-active-pill" : ""
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        active ? "text-fg-primary" : "text-fg-muted"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                        active ? "text-fg-primary" : "text-fg-muted"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </span>
                </Link>
              );
            })}

            {/* Voce "Altro" */}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center flex-1 gap-1 py-1 min-w-0"
            >
              <span
                className={`flex flex-col items-center justify-center gap-0.5 w-full px-1 py-1 rounded-2xl transition-all duration-200 ${
                  moreActive ? "tab-active-pill" : ""
                }`}
              >
                <MoreHorizontal
                  className={`w-5 h-5 transition-colors duration-200 ${
                    moreActive ? "text-fg-primary" : "text-fg-muted"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                    moreActive ? "text-fg-primary" : "text-fg-muted"
                  }`}
                >
                  Altro
                </span>
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}