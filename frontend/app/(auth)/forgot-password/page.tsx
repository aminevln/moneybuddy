"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Terminal } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { apiFetch } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";


async function requestPasswordReset(
  email: string
): Promise<{ message: string }> {
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
      await requestPasswordReset(email.trim());
      setSubmitted(true);
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
          Password dimenticata?
        </h1>
        <p className="text-fg-secondary text-sm mt-1">
          Inserisci la tua email. Se è registrata, ti invieremo un link per
          reimpostare la password.
        </p>
      </div>
      
      {submitted ? (
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
              Se l&apos;email è registrata, riceverai a breve un link per il
              reset. Controlla anche la cartella spam.
            </span>
          </div>
          
          {/* Dev-only hint */}
          <div
            className="
              flex items-start gap-2.5
              bg-warning-soft border border-warning/30
              text-warning text-xs
              rounded-lg px-3 py-2.5
            "
          >
            <Terminal className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Dev mode:</strong> controlla il terminale del backend,
              il link di reset è stampato lì.
            </span>
          </div>
          
          {/* Back link */}
          <Link href="/login" className="block">
            <Button
              variant="secondary"
              iconLeft={<ArrowLeft className="w-4 h-4" />}
            >
              Torna al login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error} />
          
          <div>
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@example.com"
              iconLeft={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
            />
          </div>
          
          <Button
            type="submit"
            loading={loading}
            iconRight={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
          >
            Invia link di reset
          </Button>
          
          {/* Footer link */}
          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="
                inline-flex items-center gap-1 text-sm
                text-fg-muted hover:text-accent
                transition-colors duration-150
              "
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Torna al login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}