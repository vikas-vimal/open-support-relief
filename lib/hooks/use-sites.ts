"use client";

import { useQuery } from "@tanstack/react-query";

import {
  siteListResponseSchema,
  type SiteListItem,
} from "@/lib/api/schemas/sites.schema";
import { queryKeys } from "@/lib/query/query-keys";

async function fetchSites(): Promise<SiteListItem[]> {
  const response = await fetch("/api/sites", {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const parsed = siteListResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected response");
  return parsed.data.sites;
}

/**
 * The active-site list. Only meaningful when it holds more than one entry — the
 * picker hides itself for a single site, so this stays a cheap, rarely-changing
 * query.
 */
export function useSites() {
  return useQuery({ queryKey: queryKeys.sites(), queryFn: fetchSites });
}
