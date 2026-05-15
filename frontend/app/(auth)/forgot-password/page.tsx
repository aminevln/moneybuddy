"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";


async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-white mb-1">
            Password dimenticata?
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Inserisci la tua email. Se è registrata, ti invieremo un link per
            reimpostare la password.
          </p>
          
          {submitted ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-300 text-sm">
                Se l'email è registrata, riceverai a breve un link per il reset.
                Controlla anche la cartella spam.
              </div>
              <p className="text-xs text-slate-500">
                In dev: <strong>controlla il terminale del backend</strong>,
                il link di reset è stampato lì.
              </p>
              <Link
                href="/login"
                className="block text-center text-emerald-400 hover:text-emerald-300 underline text-sm"
              >
                Torna al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormError message={error} />
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="tu@example.com"
                  autoComplete="email"
                />
              </div>
              
              <Button type="submit" loading={loading}>
                Invia link di reset
              </Button>
              
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-slate-400 hover:text-slate-200"
                >
                  ← Torna al login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}