"use client";

import { useQuery } from "@tanstack/react-query";

import { myContributionsResponseSchema } from "@/lib/api/schemas/my-contributions.schema";
import type { MyContribution } from "@/lib/api/schemas/my-contributions.schema";
import { queryKeys } from "@/lib/query/query-keys";

async function fetchMyContributions(): Promise<MyContribution[]> {
  const response = await fetch("/api/contributions/mine", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const parsed = myContributionsResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected response");
  return parsed.data.contributions;
}

/**
 * The caller's airdrop history.
 *
 * Keyed under the `contributions` scope, which is deliberately absent from the
 * persist allow-list (lib/query/query-keys.ts) — a supporter's activity must
 * never be written to disk where it could outlive their session.
 */
export function useMyContributions() {
  return useQuery({
    queryKey: queryKeys.contributions("mine"),
    queryFn: fetchMyContributions,
  });
}
