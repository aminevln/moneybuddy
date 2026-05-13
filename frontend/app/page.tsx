"use client";

/**
 * Pagina home di MoneyBuddy.
 *
 * Mostra:
 * - Stato live dei servizi backend
 * - Saluto + link rapidi
 * - Widget "Disponibile" (totale spendibile)
 * - Widget "Ultime transazioni"
 */

import Link from "next/link";

import { HealthStatus } from "@/components/HealthStatus";
import { BalanceSummary } from "@/components/accounts/BalanceSummary";
import { RecentTransactionsWidget } from "@/components/transactions/RecentTransactionsWidget";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/context/useAuth";


export default function HomePage() {
  const { user, status, logout } = useAuth();
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">MoneyBuddy</h1>
        <p className="text-slate-400 mb-6">
          Il tuo assistente finanziario con AI
        </p>
        
        {status === "loading" && (
          <div className="mb-6 p-3 bg-slate-900/50 rounded-lg text-slate-400 text-sm">
            Verifico sessione...
          </div>
        )}
        
        {status === "authenticated" && user && (
          <>
            {/* Saluto */}
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-emerald-400 text-sm mb-3">
                Ciao <span className="font-semibold">{user.display_name}</span>!
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href="/me" className="text-emerald-400 hover:text-emerald-300 underline">
                  Profilo
                </Link>
                <span className="text-slate-600">·</span>
                <Link href="/transactions" className="text-emerald-400 hover:text-emerald-300 underline">
                  Transazioni
                </Link>
                <span className="text-slate-600">·</span>
                <Link href="/settings/accounts" className="text-emerald-400 hover:text-emerald-300 underline">
                  Account
                </Link>
                <span className="text-slate-600">·</span>
                <Link href="/settings/categories" className="text-emerald-400 hover:text-emerald-300 underline">
                  Categorie
                </Link>
                <span className="text-slate-600">·</span>
                <Link href="/settings/assets" className="text-emerald-400 hover:text-emerald-300 underline">
                  Asset
                </Link>
                <span className="text-slate-600">·</span>
                <Link href="/settings/debts" className="text-emerald-400 hover:text-emerald-300 underline">
                  Debiti
                </Link>
                <span className="text-slate-600">·</span>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-slate-200 underline"
                >
                  Esci
                </button>
              </div>
            </div>
            
            {/* Widget Disponibile */}
            <div className="mb-4">
              <BalanceSummary />
            </div>
            
            {/* Widget Ultime transazioni */}
            <div className="mb-6">
              <RecentTransactionsWidget />
            </div>
          </>
        )}
        
        {status === "unauthenticated" && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Link href="/login" className="block">
              <Button variant="secondary">Accedi</Button>
            </Link>
            <Link href="/register" className="block">
              <Button>Registrati</Button>
            </Link>
          </div>
        )}
        
        <HealthStatus />
        
        <p className="text-xs text-slate-500 mt-6 text-center">
          Fase 1 · Setup iniziale
        </p>
      </div>
    </main>
  );
}