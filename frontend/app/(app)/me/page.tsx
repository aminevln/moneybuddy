"use client";

/**
 * Pagina /me: profilo dell'utente loggato.
 */

import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  Hash,
  LogOut,
  Mail,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/context/useAuth";


export default function MePage() {
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  return (
    <main className="min-h-screen bg-bg-base p-4 sm:p-6">
      <div className="max-w-2xl mx-auto py-6 space-y-4">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs text-fg-muted"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="hover:text-fg-primary transition-colors duration-150"
          >
            Home
          </Link>
          <ChevronRight className="w-3 h-3" aria-hidden />
          <span className="text-fg-secondary">Profilo</span>
        </nav>
        
        {/* Main card */}
        <div className="bg-bg-surface border border-border rounded-xl p-5 sm:p-6">
          {/* Header with avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-soft">
              <UserIcon className="w-6 h-6 text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-fg-primary truncate">
                {user.display_name}
              </h1>
              <p className="text-sm text-fg-secondary truncate">{user.email}</p>
            </div>
          </div>
          
          {/* Fields */}
          <dl className="space-y-2">
            <Field
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={user.email}
            />
            <Field
              icon={<CreditCard className="w-4 h-4" />}
              label="Valuta"
              value={user.currency}
            />
            <Field
              icon={<Globe className="w-4 h-4" />}
              label="Fuso orario"
              value={user.timezone}
            />
            <Field
              icon={<Clock className="w-4 h-4" />}
              label="Giorno stipendio"
              value={
                user.salary_day
                  ? `${user.salary_day} del mese`
                  : "Non impostato"
              }
            />
            <Field
              icon={<Calendar className="w-4 h-4" />}
              label="Registrato il"
              value={new Date(user.created_at).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <Field
              icon={<Hash className="w-4 h-4" />}
              label="User ID"
              value={user.id}
              mono
            />
          </dl>
          
          {/* Actions */}
          <div className="mt-6 pt-5 border-t border-border-muted space-y-2">
            <Link href="/" className="block">
              <Button
                variant="secondary"
                iconLeft={<ArrowLeft className="w-4 h-4" />}
              >
                Torna alla home
              </Button>
            </Link>
            <button
              onClick={logout}
              className="
                w-full inline-flex items-center justify-center gap-2
                px-4 py-2 rounded-lg
                text-sm text-fg-muted hover:text-danger
                transition-colors duration-150
              "
            >
              <LogOut className="w-4 h-4" />
              <span>Esci dall&apos;account</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


// ============================================================
// SUB-COMPONENTS
// ============================================================

function Field({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className="
        flex items-center gap-3 p-3 rounded-lg
        bg-bg-elevated border border-border-muted
        transition-colors duration-150
        hover:border-border
      "
    >
      <div className="shrink-0 text-fg-muted">{icon}</div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-fg-muted uppercase tracking-wider font-medium">
          {label}
        </dt>
        <dd
          className={`
            text-sm text-fg-primary mt-0.5
            ${mono ? "font-mono text-xs break-all text-fg-secondary" : ""}
          `}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}