import type { AirdropCategory, Urgency } from "./airdrop.constants";

/**
 * One row on the public board: the aggregate need for a single item at a site.
 * Contains no drop-point data — addresses and phone numbers are only ever
 * returned by the login-gated reveal endpoint.
 */
export interface NeedSummary {
  id: string;
  itemName: string;
  /** Unit of measure, e.g. "bottle", "packet", "piece". */
  unit: string;
  category: AirdropCategory;
  qtyRequested: number;
  /** Includes claims still PENDING moderator verification. */
  qtyFulfilled: number;
  /** Quantity held by unexpired intent locks. */
  qtyReserved: number;
  /** Postgres generated column: max(0, requested - fulfilled - reserved). */
  shortfall: number;
  urgency: Urgency;
  /** Contributors with an active intent lock — powers "3 people ordering now". */
  activeContributorCount: number;
  updatedAt: string;
}

/** Public site metadata. `areaLabel` is intentionally coarse. */
export interface SiteSummary {
  id: string;
  name: string;
  /** Coarse public location, e.g. "Near Jantar Mantar, Delhi". Never an address. */
  areaLabel: string;
  isFrozen: boolean;
}

/**
 * What the board query returns.
 *
 * Deliberately carries no freshness fields: React Query owns fetch timing
 * (`dataUpdatedAt`, error state), and duplicating it here would give the UI two
 * sources of truth that drift the moment a refetch fails.
 */
export interface BoardSnapshot {
  site: SiteSummary;
  needs: readonly NeedSummary[];
}
