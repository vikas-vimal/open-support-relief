import { QueryClient } from "@tanstack/react-query";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** How long fetched data is treated as fresh before a background refetch. */
export const BOARD_STALE_TIME = 30 * 1000;

/**
 * Poll the board while the tab is visible, so counters stay live without a
 * websocket. This is the plan's deliberate choice over Supabase Realtime: a
 * small JSON GET every 30s is cheap on 2G, whereas a persistent socket is not.
 * It pauses when the tab is hidden (refetchIntervalInBackground stays false),
 * and focus/reconnect refetches cover the gap on return.
 */
export const BOARD_REFETCH_INTERVAL = 30 * 1000;

/**
 * Must be >= the persister's maxAge, or React Query garbage-collects entries
 * that the persister is still restoring, and the offline cache silently empties.
 */
export const QUERY_GC_TIME = 7 * DAY;

/** Persisted cache lifetime and its invalidation switch. */
export const PERSIST_MAX_AGE = 7 * DAY;
export const PERSIST_STORAGE_KEY = "airdrops:query-cache";

/**
 * Bump on any breaking change to a persisted payload shape. Everything cached
 * under an older buster is discarded rather than fed to code that cannot read it.
 */
export const PERSIST_BUSTER = "v1";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: BOARD_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        /*
         * offlineFirst, not the default 'online': `navigator.onLine` reports
         * true on a captive portal and on a connection that resolves DNS but
         * carries nothing — both routine at a protest. We attempt the request
         * regardless and fall back to cache when it fails, rather than
         * refusing to try because the browser claimed we were offline.
         */
        networkMode: "offlineFirst",
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        networkMode: "offlineFirst",
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      },
    },
  });
}
