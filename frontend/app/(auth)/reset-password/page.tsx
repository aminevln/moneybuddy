"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
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
    <div className="bg-bg-surface border border-border rounded-2xl p-8 text-center">
      <div className="inline-block w-6 h-6 border-2 border-border-strong border-t-accent rounded-full animate-spin mb-3" />
      <p className="text-fg-secondary text-sm">Caricamento...</p>
    </div>
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
    <div className="bg-bg-surface border border-border rounded-2xl p-6 sm:p-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-fg-primary tracking-tight">
          Reimposta la password
        </h1>
        <p className="text-fg-secondary text-sm mt-1">
          Inserisci la tua nuova password.
        </p>
      </div>
      
      {success ? (
        <div className="space-y-4">
          {/* Success message */}
          <div
            className="
              flex items-start gap-2.5
              bg-success-soft border border-success/30
              text-success text-sm
              rounded-lg px-3 py-3
            "
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Password aggiornata. Reindirizzamento al login in 3 secondi...
            </span>
          </div>
          
          <Link href="/login" className="block">
            <Button
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Vai al login subito
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error} />
          
          {/* Token missing warning */}
          {!token && (
            <div
              className="
                flex items-start gap-2.5
                bg-warning-soft border border-warning/30
                text-warning text-sm
                rounded-lg px-3 py-2.5
              "
              role="alert"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Token mancante nell&apos;URL. Richiedi un nuovo link di reset
                dalla pagina{" "}
                <Link
                  href="/forgot-password"
                  className="underline font-medium hover:text-warning"
                >
                  Password dimenticata
                </Link>
                .
              </span>
            </div>
          )}
          
          <div>
            <Label htmlFor="password" required>
              Nuova password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Almeno 8 caratteri"
              iconLeft={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              autoFocus
              disabled={loading || !token}
            />
          </div>
          
          <div>
            <Label htmlFor="confirm" required>
              Conferma password
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Ripeti la nuova password"
              iconLeft={<Lock className="w-4 h-4" />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              disabled={loading || !token}
            />
          </div>
          
          <Button
            type="submit"
            loading={loading}
            disabled={!token}
            iconRight={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
          >
            Imposta nuova password
          </Button>
        </form>
      )}
    </div>
  );
}