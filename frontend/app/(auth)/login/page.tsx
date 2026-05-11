"use client";

/**
 * Pagina di login.
 *
 * Form con email e password. Su successo: salva token, redirect alla home.
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


export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card>
      <h1 className="text-2xl font-bold text-white mb-2">Bentornato</h1>
      <p className="text-slate-400 text-sm mb-6">
        Accedi al tuo account MoneyBuddy.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />
        
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
            autoFocus
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="La tua password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        
        <Button type="submit" loading={loading}>
          Accedi
        </Button>
      </form>
      
      <p className="text-sm text-slate-400 text-center mt-6">
        Non hai un account?{" "}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
          Registrati
        </Link>
      </p>
    </Card>
  );
}