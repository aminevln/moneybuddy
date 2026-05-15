"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";


async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetLoading />}>
      <ResetContent />
    </Suspense>
  );
}


function ResetLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
      <div className="text-slate-400">Caricamento...</div>
    </main>
  );
}


function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    if (!token) {
      setError("Token mancante nell'URL. Richiedi un nuovo link di reset.");
      return;
    }
    
    if (password !== confirm) {
      setError("Le password non corrispondono.");
      return;
    }
    
    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri.");
      return;
    }
    
    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
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
            Reimposta la password
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Inserisci la tua nuova password.
          </p>
          
          {success ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-300 text-sm">
                ✓ Password aggiornata. Reindirizzamento al login...
              </div>
              <Link
                href="/login"
                className="block text-center text-emerald-400 hover:text-emerald-300 underline text-sm"
              >
                Vai al login subito →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormError message={error} />
              
              {!token && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-xs">
                  Token mancante nell'URL. Richiedi un nuovo link di reset
                  dalla pagina "Password dimenticata".
                </div>
              )}
              
              <div>
                <Label htmlFor="password">Nuova password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  placeholder="Almeno 8 caratteri"
                  autoComplete="new-password"
                />
              </div>
              
              <div>
                <Label htmlFor="confirm">Conferma password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              
              <Button type="submit" loading={loading} disabled={!token}>
                Imposta nuova password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}