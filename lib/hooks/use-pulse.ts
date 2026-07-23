"use client";

import { useQuery } from "@tanstack/react-query";

import { pulseSchema, type Pulse } from "@/lib/api/schemas/pulse.schema";
import { queryKeys } from "@/lib/query/query-keys";

async function fetchPulse(): Promise<Pulse> {
  // no-store so the client always revalidates — the response is edge-cacheable
  // (s-maxage) but a stale local copy would freeze the "live" ticker.
  const response = await fetch("/api/pulse", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const parsed = pulseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected response");
  return parsed.data;
}

/** The board momentum ticker. Not persisted to disk (see query-keys.ts). */
export function usePulse() {
  return useQuery({ queryKey: queryKeys.pulse(), queryFn: fetchPulse });
}
