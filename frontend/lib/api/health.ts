/**
 * Endpoint /health del backend.
 */

import { apiFetch } from "./client";

export interface HealthResponse {
  status: "ok" | "degraded";
  app: string;
  database: string;
  pgvector: string;
}

export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}