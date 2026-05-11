"use client";

/**
 * Pagina di registrazione.
 *
 * Form con email, password, display_name.
 * Su successo: salva token, redirect alla home.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth/context/useAuth";
import { getErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";


export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  
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
      // Login automatico OK → vai alla home
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card>
      <h1 className="text-2xl font-bold text-white mb-2">Crea il tuo account</h1>
      <p className="text-slate-400 text-sm mb-6">
        Bastano pochi secondi per iniziare.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        
        <div>
          <Label htmlFor="display_name">Nome</Label>
          <Input
            id="display_name"
            type="text"
            placeholder="Come ti chiami?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={1}
            maxLength={100}
            autoComplete="name"
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="mario@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Almeno 8 caratteri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        
        <Button type="submit" loading={loading}>
          Crea account
        </Button>
      </form>
      
      <p className="text-sm text-slate-400 text-center mt-6">
        Hai già un account?{" "}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
          Accedi
        </Link>
      </p>
    </Card>
  );
}