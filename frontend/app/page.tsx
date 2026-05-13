"use client";

/**
 * Pagina home di MoneyBuddy = Dashboard.
 *
 * Mostra una panoramica completa: bilanci, budget, confronto mensile,
 * breakdown per categoria, ultime transazioni.
 */

import Link from "next/link";

import { HealthStatus } from "@/components/HealthStatus";
import { BalanceSummary } from "@/components/accounts/BalanceSummary";
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-1">MoneyBuddy</h1>
          <p className="text-slate-400 text-sm">
            Il tuo assistente finanziario con AI
          </p>
        </div>
        
        {/* Stato auth */}
        {status === "loading" && (
          <div className="p-3 bg-slate-900/50 rounded-lg text-slate-400 text-sm">
            Verifico sessione...
          </div>
        )}
        
        {status === "unauthenticated" && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-xl">
            <p className="text-slate-300 text-sm mb-4">
              Per iniziare ad usare MoneyBuddy, accedi o registrati.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login" className="block">
                <Button variant="secondary">Accedi</Button>
              </Link>
              <Link href="/register" className="block">
                <Button>Registrati</Button>
              </Link>
            </div>
            <div className="mt-6">
              <HealthStatus />
            </div>
          </div>
        )}
        
        {status === "authenticated" && user && (
          <>
            {/* Saluto + navigazione */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-emerald-400 text-sm mb-3">
                Ciao <span className="font-semibold">{user.display_name}</span>!
              </p>
              <NavLinks logout={logout} />
            </div>
            
            {/* Riga 1: Balance + Budgets */}
            <div className="grid sm:grid-cols-2 gap-4">
              <BalanceSummary />
              <BudgetsWidget />
            </div>
            
            {/* Riga 2: Confronto mensile (full width) */}
            {analytics && (
              <MonthlyComparisonCard data={analytics.monthly_comparison} />
            )}
            
            {/* Riga 3: Breakdown categoria (full width) */}
            {analytics && (
              <CategoryBreakdownCard data={analytics.category_breakdown} />
            )}
            
            {/* Riga 4: Ultime transazioni */}
            <RecentTransactionsWidget />
            
            {/* Footer servizi */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <HealthStatus />
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

function NavLinks({ logout }: { logout: () => void }) {
  const links: Array<{ href: string; label: string }> = [
    { href: "/me", label: "Profilo" },
    { href: "/transactions", label: "Transazioni" },
    { href: "/budgets", label: "Budget" },
    { href: "/settings/accounts", label: "Account" },
    { href: "/settings/categories", label: "Categorie" },
    { href: "/settings/assets", label: "Asset" },
    { href: "/settings/debts", label: "Debiti" },
  ];
  
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {links.map((link, i) => (
        <span key={link.href} className="flex items-center gap-x-3">
          <Link
            href={link.href}
            className="text-emerald-400 hover:text-emerald-300 underline"
          >
            {link.label}
          </Link>
          {i < links.length - 1 && <span className="text-slate-600">·</span>}
        </span>
      ))}
      <span className="text-slate-600">·</span>
      <button
        onClick={logout}
        className="text-slate-400 hover:text-slate-200 underline"
      >
        Esci
      </button>
    </div>
  );
}