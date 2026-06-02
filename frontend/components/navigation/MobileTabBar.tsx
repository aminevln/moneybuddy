"use client";

/**
 * Tab bar di navigazione mobile (stile app nativa iOS / WhatsApp).
 *
 * - Visibile SOLO su mobile (sm:hidden) — su desktop resta la nav a chip.
 * - Fissa in basso, look glass, rispetta la safe-area iOS.
 * - 4 voci fisse: Chat, Transazioni, Account, Altro.
 * - "Altro" apre un bottom sheet con le restanti sezioni.
 *
 * NOTA: questo componente al momento NON è ancora montato da nessuna parte.
 * Viene agganciato in uno step successivo.
 */

import {
  CreditCard,
  FolderTree,
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

// Le 4 voci fisse della tab bar (l'ultima "Altro" è gestita a parte).
const MAIN_TABS: TabDef[] = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/transactions", label: "Transazioni", icon: Receipt },
  { href: "/settings/accounts", label: "Account", icon: Wallet },
];

// Le sezioni dentro il menu "Altro".
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

  // Una tab è attiva se il path corrente inizia col suo href.
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // "Altro" è attivo se siamo su una delle sue sezioni.
  const moreActive = MORE_LINKS.some((l) => isActive(l.href));

  return (
    <>
      {/* ===== Bottom sheet "Altro" ===== */}
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
            className="
              relative glass-card glass-card-blur
              rounded-t-2xl rounded-b-none
              px-4 pt-4 pb-8
              animate-slide-up
            "
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-fg-primary">
                Altro
              </h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="
                  inline-flex items-center justify-center w-8 h-8 rounded-md
                  text-fg-muted hover:text-fg-primary hover:bg-bg-elevated
                  transition-colors duration-150
                "
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
                    className={`
                      flex flex-col items-center justify-center gap-2
                      px-2 py-4 rounded-xl
                      border transition-all duration-200
                      ${
                        active
                          ? "bg-accent-soft border-accent/40 text-accent"
                          : "bg-glass-surface border-glass-border text-fg-secondary hover:text-fg-primary"
                      }
                    `}
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

      {/* ===== Tab bar ===== */}
      <nav
        className="
          sm:hidden fixed bottom-0 left-0 right-0 z-40
          flex justify-center
          px-4 pointer-events-none
        "
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        aria-label="Navigazione principale"
      >
        <div className="glass-tabbar rounded-full px-3 py-2 pointer-events-auto w-full max-w-sm">
          <div className="flex items-stretch justify-around">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex flex-col items-center justify-center gap-1.5
                  flex-1 py-1
                  transition-colors duration-200
                  ${active ? "text-accent" : "text-fg-secondary hover:text-fg-primary"}
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center
                    w-12 h-7 rounded-full transition-all duration-200
                    ${active ? "tab-active-pill" : ""}
                  `}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium leading-none">{tab.label}</span>
              </Link>
            );
          })}

          {/* Voce "Altro" */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`
              flex flex-col items-center justify-center gap-1.5
              flex-1 py-1
              transition-colors duration-200
              ${moreActive ? "text-accent" : "text-fg-secondary hover:text-fg-primary"}
            `}
          >
            <span
              className={`
                inline-flex items-center justify-center
                w-12 h-7 rounded-full transition-all duration-200
                ${moreActive ? "tab-active-pill" : ""}
              `}
            >
              <MoreHorizontal className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-medium leading-none">Altro</span>
          </button>
          </div>
        </div>
      </nav>
    </>
  );
}