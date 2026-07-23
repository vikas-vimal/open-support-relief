/**
 * Query keys, and the allow-list controlling what may be written to disk.
 */

/** Single-site UI; becomes the real siteId when the picker lands. */
export const BOARD_SCOPE = "active";

export const queryKeys = {
  board: (scope: string = BOARD_SCOPE) => ["board", scope] as const,
  contributions: (userId: string) => ["contributions", userId] as const,
  /** Public opt-in wall — safe to fetch, deliberately not persisted to disk. */
  contributors: () => ["contributors"] as const,
  /** Public momentum ticker — aggregate counts only, not persisted. */
  pulse: () => ["pulse"] as const,
  /** Active-site list for the multi-site picker — not persisted. */
  sites: () => ["sites"] as const,
  /** NOT persistable — see below. */
  dropPointReveal: (dropPointId: string) =>
    ["drop-point-reveal", dropPointId] as const,
} as const;

/**
 * Only these query scopes are persisted to IndexedDB.
 *
 * ALLOW-LIST, deliberately — the same rule the service worker follows. The
 * query cache is written to disk wholesale by default, so a deny-list would
 * eventually persist the drop-point reveal: a volunteer's street address and
 * phone number, surviving sign-out AND the server-side `isFrozen` kill switch.
 *
 * Adding a scope here is a privacy decision, not a caching one.
 */
const PERSISTABLE_SCOPES: readonly string[] = ["board"];

export function isPersistableQueryKey(queryKey: readonly unknown[]): boolean {
  const [scope] = queryKey;
  return typeof scope === "string" && PERSISTABLE_SCOPES.includes(scope);
}
