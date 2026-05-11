"use client";

/**
 * Pagina /me: profilo dell'utente loggato.
 *
 * Demo della "protected route". Mostra tutti i dati che il backend
 * conosce dell'utente.
 */

import Link from "next/link";

import { useAuth } from "@/lib/auth/context/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";


export default function MePage() {
  const { user, logout } = useAuth();
  
  // RequireAuth ci garantisce che user != null qui dentro
  if (!user) return null;
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-white mb-1">
            Il tuo profilo
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            I dati che MoneyBuddy conosce di te.
          </p>
          
          <dl className="space-y-3 text-sm">
            <Field label="Nome" value={user.display_name} />
            <Field label="Email" value={user.email} />
            <Field label="Valuta" value={user.currency} />
            <Field label="Fuso orario" value={user.timezone} />
            <Field
              label="Giorno stipendio"
              value={user.salary_day ? `${user.salary_day} del mese` : "Non impostato"}
            />
            <Field
              label="Registrato il"
              value={new Date(user.created_at).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <Field label="User ID" value={user.id} mono />
          </dl>
          
          <div className="mt-6 space-y-2">
            <Link href="/" className="block">
              <Button variant="secondary">Torna alla home</Button>
            </Link>
            <button
              onClick={logout}
              className="w-full text-sm text-slate-400 hover:text-slate-200 underline py-2"
            >
              Esci dall&apos;account
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}


// ============================================================
// SUB-COMPONENTS
// ============================================================

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 bg-slate-900/50 rounded-lg">
      <dt className="text-xs text-slate-500 uppercase tracking-wider">{label}</dt>
      <dd className={`text-slate-200 ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </dd>
    </div>
  );
}