"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { fetchBoardSnapshot } from "@/lib/api/board.client";
import type { BoardSnapshot } from "@/lib/domain/airdrop.types";
import { BOARD_SCOPE, queryKeys } from "@/lib/query/query-keys";

interface BoardQueryResult {
  snapshot: BoardSnapshot | null;
  /** Showing data we could not refresh — drives the freshness banner. */
  isStale: boolean;
  /** ISO timestamp of the last successful fetch. */
  lastUpdatedAt: string | null;
  /** Background refetch in flight. */
  isRefreshing: boolean;
}

/**
 * The board's single read hook.
 *
 * Persisted to IndexedDB by QueryProvider, so a returning protester sees the
 * last known board immediately — before the network answers, or instead of it.
 */
export function useBoardQuery(siteId?: string): BoardQueryResult {
  const query = useQuery({
    // Keyed per site so switching sites keeps each board cached separately; the
    // default (no siteId) stays the single "active" scope, unchanged.
    queryKey: queryKeys.board(siteId ?? BOARD_SCOPE),
    // Forward React Query's AbortSignal so a superseded refetch is cancelled.
    queryFn: ({ signal }) => fetchBoardSnapshot(signal, siteId),
  });

  return {
    snapshot: query.data ?? null,
    /*
     * Stale specifically means "this is cached data we failed to refresh".
     * Deliberately NOT React Query's `isStale`, which only means "older than
     * staleTime" and would flag a perfectly current board 30 seconds in,
     * training people to ignore the banner.
     */
    isStale: query.isError && query.data !== undefined,
    lastUpdatedAt: query.dataUpdatedAt
      ? new Date(query.dataUpdatedAt).toISOString()
      : null,
    isRefreshing: query.isFetching && !query.isLoading,
  };
}

/**
 * Invalidates the board so the next render refetches.
 *
 * Call after anything that changes server-side counts — a fulfilment claim, an
 * approved item request. Without it the contributor sees their own contribution
 * missing from the board and files it again.
 */
export function useInvalidateBoard(): () => Promise<void> {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // Prefix match on ["board"] so whichever site's board is showing refetches,
    // not only the default "active" scope.
    await queryClient.invalidateQueries({ queryKey: ["board"] });
  }, [queryClient]);
}
