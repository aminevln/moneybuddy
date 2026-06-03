"use client";

/**
 * Pagina home di MoneyBuddy = Dashboard.
 *
 * Mostra una panoramica completa: bilanci, budget, confronto mensile,
 * breakdown per categoria, ultime transazioni.
 */

import {
  ArrowRight,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PiggyBank,
  Receipt,
  Repeat,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BalanceSummary } from "@/components/accounts/BalanceSummary";
import { AskMoneyBuddyWidget } from "@/components/chat/AskMoneyBuddyWidget";
import { BudgetsWidget } from "@/components/budgets/BudgetsWidget";
import { CategoryBreakdownCard } from "@/components/dashboard/CategoryBreakdownCard";
import { MonthlyComparisonCard } from "@/components/dashboard/MonthlyComparisonCard";
import { RecentTransactionsWidget } from "@/components/transactions/RecentTransactionsWidget";
import { Button } from "@/components/ui/Button";
import { useAnalyticsOverviewQuery } from "@/lib/api/analytics";
import { useAuth } from "@/lib/auth/context/useAuth";


export default function HomePage() {
  const { user, status, logout } = useAuth();
  const { data: analytics } = useAnalyticsOverviewQuery();
  
  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto py-6 space-y-4">
        {/* Header con logo */}
        <header className="flex items-center justify-between">
          <Image
            src="/brand/logo.svg"
            alt="MoneyBuddy"
            width={180}
            height={40}
            priority
            className="h-10 w-auto"
          />
          {status === "authenticated" && (
            <button
              onClick={logout}
              className="
                inline-flex items-center gap-1.5
                px-3 py-1.5 rounded-md text-xs font-medium
                text-fg-muted hover:text-fg-primary hover:bg-bg-elevated
                transition-colors duration-150
              "
              aria-label="Esci"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Esci</span>
            </button>
          )}
        </header>
        
        {/* Stato auth: loading */}
        {status === "loading" && (
          <div className="flex items-center gap-2 p-4 bg-bg-surface border border-border rounded-lg text-fg-secondary text-sm">
            <span className="w-2 h-2 bg-fg-muted rounded-full animate-pulse" />
            <span>Verifico sessione...</span>
          </div>
        )}
        
        {/* Stato auth: unauthenticated */}
        {status === "unauthenticated" && (
          <div className="bg-bg-surface border border-border rounded-xl p-6 space-y-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-fg-primary mb-1">
                Benvenuto in MoneyBuddy
              </h1>
              <p className="text-fg-secondary text-sm">
                Il tuo assistente finanziario personale con AI.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login" className="block">
                <Button variant="secondary">Accedi</Button>
              </Link>
              <Link href="/register" className="block">
                <Button>Registrati</Button>
              </Link>
            </div>
          </div>
        )}
        
        {/* Stato auth: authenticated */}
        {status === "authenticated" && user && (
          <>
            {/* Saluto user + nav */}
            <div className="bg-bg-surface border border-border rounded-xl p-4 animate-stagger animate-stagger-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent-soft text-accent">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-fg-secondary text-xs">Bentornato</p>
                  <p className="font-display font-semibold text-fg-primary">
                    {user.display_name}
                  </p>
                </div>
              </div>
              <NavLinks />
            </div>

            {/* HERO: Saldo disponibile, a tutta larghezza */}
            <div className="animate-stagger animate-stagger-2">
              <BalanceSummary />
            </div>

            {/* Chiedi a MoneyBuddy */}
            <div className="animate-stagger animate-stagger-3">
              <AskMoneyBuddyWidget />
            </div>

            {/* Coppia di supporto: Budget + Confronto mensile */}
            <div className="grid sm:grid-cols-2 gap-4 animate-stagger animate-stagger-4">
              <BudgetsWidget />
              {analytics && (
                <MonthlyComparisonCard data={analytics.monthly_comparison} />
              )}
            </div>

            {/* Breakdown categoria */}
            {analytics && (
              <div className="animate-stagger animate-stagger-5">
                <CategoryBreakdownCard data={analytics.category_breakdown} />
              </div>
            )}

            {/* Ultime transazioni */}
            <div className="animate-stagger animate-stagger-6">
              <RecentTransactionsWidget />
            </div>
          </>
        )}
      </div>
    </main>
  );
}


// ============================================================
// NAVIGATION COMPONENT
// ============================================================

interface NavLinkDef {
  href: string;
  label: string;
  icon: typeof MessageCircle;
}

const NAV_LINKS: NavLinkDef[] = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/transactions", label: "Transazioni", icon: Receipt },
  { href: "/budgets", label: "Budget", icon: PiggyBank },
  { href: "/settings/accounts", label: "Account", icon: Wallet },
  { href: "/settings/categories", label: "Categorie", icon: FolderTree },
  { href: "/settings/recurring", label: "Spese fisse", icon: Repeat },
  { href: "/settings/assets", label: "Asset", icon: TrendingUp },
  { href: "/settings/debts", label: "Debiti", icon: CreditCard },
  { href: "/me", label: "Profilo", icon: User },
];


function NavLinks() {
  return (
    <nav
      className="
        flex gap-1.5 overflow-x-auto -mx-1 px-1
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
      aria-label="Navigazione principale"
    >
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="
              inline-flex items-center gap-1.5 shrink-0
              px-3 py-1.5 rounded-md text-xs font-medium
              bg-bg-elevated hover:bg-accent-soft
              text-fg-secondary hover:text-accent
              border border-border hover:border-accent/40
              transition-colors duration-150
            "
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}