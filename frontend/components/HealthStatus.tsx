"use client";

/**
 * Componente che mostra lo stato live dei servizi backend.
 *
 * Fa polling ogni 10 secondi a /health e aggiorna l'UI.
 * "use client" in cima perché usa hook React (useState, useEffect).
 */

import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "@/lib/api/health";

type Status = "loading" | "ok" | "error";

interface ServiceStatusProps {
  label: string;
  status: Status;
  detail?: string;
}

function ServiceStatus({ label, status, detail }: ServiceStatusProps) {
  const statusConfig = {
    loading: { color: "bg-slate-500", text: "verifica..." },
    ok: { color: "bg-emerald-500", text: detail ?? "ok" },
    error: { color: "bg-red-500", text: detail ?? "errore" },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
      <span className="text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-slate-400 text-sm">{config.text}</span>
      </div>
    </div>
  );
}

export function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function check() {
      try {
        const data = await getHealth();
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "errore sconosciuto");
          setHealth(null);
        }
      }
    }
    
    check();
    
    const interval = setInterval(check, 10_000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
  
  const backendStatus: Status = error ? "error" : health ? "ok" : "loading";
  const dbStatus: Status = error
    ? "error"
    : health?.database === "ok"
    ? "ok"
    : health
    ? "error"
    : "loading";
  const pgvectorStatus: Status = error
    ? "error"
    : health?.pgvector === "ok"
    ? "ok"
    : health
    ? "error"
    : "loading";
  
  return (
    <div className="space-y-3">
      <ServiceStatus label="Backend" status={backendStatus} />
      <ServiceStatus label="Database" status={dbStatus} />
      <ServiceStatus label="pgvector" status={pgvectorStatus} />
      {error && (
        <p className="text-xs text-red-400 mt-2">
          Errore: {error}
        </p>
      )}
    </div>
  );
}