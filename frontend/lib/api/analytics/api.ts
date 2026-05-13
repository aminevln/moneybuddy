import { apiFetch } from "@/lib/api/client";
import type { AnalyticsOverview } from "./types";


export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiFetch<AnalyticsOverview>("/analytics/overview");
}