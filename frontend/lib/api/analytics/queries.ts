import { useQuery } from "@tanstack/react-query";

import { getAnalyticsOverview } from "./api";


export const analyticsKeys = {
  overview: ["analytics", "overview"] as const,
};


export function useAnalyticsOverviewQuery() {
  return useQuery({
    queryKey: analyticsKeys.overview,
    queryFn: getAnalyticsOverview,
  });
}