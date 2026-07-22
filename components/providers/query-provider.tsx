"use client";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";

import { createIdbPersister } from "@/lib/query/idb-persister";
import { isPersistableQueryKey } from "@/lib/query/query-keys";
import {
  createQueryClient,
  PERSIST_BUSTER,
  PERSIST_MAX_AGE,
  PERSIST_STORAGE_KEY,
} from "@/lib/query/query-client";

/**
 * React Query provider with IndexedDB-backed persistence.
 *
 * Both the client and the persister are created lazily in `useState` so React
 * Strict Mode's double-invoke cannot spawn a second QueryClient and split the
 * cache in two.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [persister] = useState(() => createIdbPersister(PERSIST_STORAGE_KEY));

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          /*
           * The privacy gate. Without this React Query writes EVERY query to
           * disk, which would eventually include the drop-point reveal —
           * a volunteer's address and phone, surviving sign-out and the
           * isFrozen kill switch. Allow-listed in lib/query/query-keys.ts.
           */
          shouldDehydrateQuery: (query) =>
            isPersistableQueryKey(query.queryKey) &&
            query.state.status === "success",
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
