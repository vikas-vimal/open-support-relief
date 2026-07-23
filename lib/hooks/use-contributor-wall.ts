"use client";

import { useQuery } from "@tanstack/react-query";

import { contributorWallSchema } from "@/lib/api/schemas/contributor-wall.schema";
import type { ContributorWall } from "@/lib/api/schemas/contributor-wall.schema";
import { queryKeys } from "@/lib/query/query-keys";

async function fetchContributorWall(): Promise<ContributorWall> {
  const response = await fetch("/api/contributors", {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const parsed = contributorWallSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected response");
  return parsed.data;
}

/** The public contributors wall. Not persisted to disk (see query-keys.ts). */
export function useContributorWall() {
  return useQuery({
    queryKey: queryKeys.contributors(),
    queryFn: fetchContributorWall,
  });
}
