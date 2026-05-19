"use client";

/**
 * Pagina di registrazione.
 *
 * Form con email, password, display_name.
 * Su successo: salva token, redirect alla home.
 */

import { ArrowRight, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/context/useAuth";


export default function RegisterPage() {
  const router = useRouter();
  const { register, status } = useAuth();
  
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await register({
        email: email.trim(),
        password,
        display_name: displayName.trim(),
      });
      router.push("/");
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
          Crea il tuo account
        </h1>
        <p className="text-fg-secondary text-sm mt-1">
          Bastano pochi secondi per iniziare.
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        
        <div>
          <Label htmlFor="display_name" required>
            Nome
          </Label>
          <Input
            id="display_name"
            type="text"
            placeholder="Come ti chiami?"
            iconLeft={<User className="w-4 h-4" />}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={1}
            maxLength={100}
            autoComplete="name"
            autoFocus
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="mario@example.com"
            iconLeft={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="password" required>
            Password
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
            disabled={loading}
          />
        </div>
        
        <Button
          type="submit"
          loading={loading}
          iconRight={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
        >
          Crea account
        </Button>
      </form>
      
      {/* Footer link */}
      <div className="mt-6 pt-5 border-t border-border-muted">
        <p className="text-sm text-fg-secondary text-center">
          Hai già un account?{" "}
          <Link
            href="/login"
            className="text-accent hover:text-accent-hover font-medium transition-colors duration-150"
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}