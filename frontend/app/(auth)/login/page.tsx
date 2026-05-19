/**
 * Pagina di login.
 *
 * Wrappata in <Suspense> perché useSearchParams (usato per ?next=)
 * non può essere pre-renderizzato staticamente.
 */

import { Suspense } from "react";

import { LoginForm } from "./LoginForm";


export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}


function LoginLoading() {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-8 text-center">
      <div className="inline-block w-6 h-6 border-2 border-border-strong border-t-accent rounded-full animate-spin mb-3" />
      <p className="text-fg-secondary text-sm">Caricamento...</p>
    </div>
  );
}