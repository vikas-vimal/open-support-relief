import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

/**
 * Persists the React Query cache to IndexedDB.
 *
 * IndexedDB rather than localStorage: the board is a few KB of JSON, writes are
 * async so they never block the main thread, and localStorage's synchronous API
 * is exactly the wrong thing to hit on a low-end phone mid-scroll.
 *
 * Every operation swallows its errors. Persistence is an optimisation — private
 * browsing, evicted storage or a quota error must degrade to "no cache", never
 * to a broken board.
 */
export function createIdbPersister(storageKey: string): Persister {
  return {
    persistClient: async (client: PersistedClient): Promise<void> => {
      try {
        await set(storageKey, client);
      } catch {
        // Quota or private mode — the in-memory cache still works.
      }
    },

    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        return await get<PersistedClient>(storageKey);
      } catch {
        return undefined;
      }
    },

    removeClient: async (): Promise<void> => {
      try {
        await del(storageKey);
      } catch {
        // Nothing to do — a stale entry is bounded by `buster` and `maxAge`.
      }
    },
  };
}
