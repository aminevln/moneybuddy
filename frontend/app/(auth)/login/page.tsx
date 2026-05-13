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
    <div className="text-center text-slate-400 text-sm py-8">
      Caricamento...
    </div>
  );
}