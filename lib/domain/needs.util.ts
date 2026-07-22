import { findSimilarNeeds } from "./item-match.util";
import {
  CATEGORY_FILTER_ALL,
  CRITICAL_FILL_RATIO,
  AIRDROP_CATEGORY_ORDER,
  URGENCY_WEIGHT,
  type CategoryFilter,
} from "./airdrop.constants";
import type { NeedSummary } from "./airdrop.types";

/**
 * Ranks the board the same way the database does
 * (`ORDER BY urgency DESC, shortfall DESC`), so an optimistic client-side
 * re-sort after a contribution can never disagree with the next server payload.
 */
export function rankNeeds(needs: readonly NeedSummary[]): NeedSummary[] {
  return [...needs].sort((left, right) => {
    const urgencyDelta = URGENCY_WEIGHT[right.urgency] - URGENCY_WEIGHT[left.urgency];
    if (urgencyDelta !== 0) return urgencyDelta;

    const shortfallDelta = right.shortfall - left.shortfall;
    if (shortfallDelta !== 0) return shortfallDelta;

    // Stable tie-break so the list never jitters between renders.
    return left.itemName.localeCompare(right.itemName);
  });
}

export function filterNeedsByCategory(
  needs: readonly NeedSummary[],
  filter: CategoryFilter,
): NeedSummary[] {
  if (filter === CATEGORY_FILTER_ALL) return [...needs];
  return needs.filter((need) => need.category === filter);
}

/** Fraction of the request already covered, clamped to 0–1. */
export function calculateFillRatio(need: NeedSummary): number {
  if (need.qtyRequested <= 0) return 1;
  const covered = need.qtyFulfilled + need.qtyReserved;
  return Math.min(1, Math.max(0, covered / need.qtyRequested));
}

export function isCriticallyShort(need: NeedSummary): boolean {
  return calculateFillRatio(need) < CRITICAL_FILL_RATIO;
}

export function countShortItems(needs: readonly NeedSummary[]): number {
  return needs.filter((need) => need.shortfall > 0).length;
}

/**
 * The board's visible list: category filter and search compose rather than
 * override each other.
 *
 * Ordering intentionally differs by mode. With no query the board is a triage
 * list, so urgency/shortfall order wins. With a query the user is looking for
 * one specific thing, so relevance wins — burying an exact name match under an
 * unrelated urgent item would make search feel broken.
 */
export function selectVisibleNeeds(
  needs: readonly NeedSummary[],
  categoryFilter: CategoryFilter,
  searchQuery: string,
): NeedSummary[] {
  const inCategory = filterNeedsByCategory(needs, categoryFilter);

  if (!searchQuery.trim()) return rankNeeds(inCategory);

  return findSimilarNeeds(searchQuery, inCategory).map((match) => match.need);
}

/** Item count per filter chip, including the ALL sentinel. */
export function countNeedsByFilter(
  needs: readonly NeedSummary[],
): Record<CategoryFilter, number> {
  const counts = Object.fromEntries(
    AIRDROP_CATEGORY_ORDER.map((category) => [category, 0]),
  ) as Record<CategoryFilter, number>;

  counts[CATEGORY_FILTER_ALL] = needs.length;
  for (const need of needs) {
    counts[need.category] += 1;
  }

  return counts;
}


/**
 * Compact relative time for the freshness banner. `now` is injected rather than
 * read from the clock so this stays pure and testable — and so callers are
 * forced to compute it client-side, avoiding a build-time/hydration mismatch.
 */
export function formatRelativeTime(isoTimestamp: string, now: Date): string {
  const elapsedMs = now.getTime() - new Date(isoTimestamp).getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);

  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes === 1) return "1 min ago";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours === 1) return "1 hour ago";
  if (elapsedHours < 24) return `${elapsedHours} hours ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return elapsedDays === 1 ? "1 day ago" : `${elapsedDays} days ago`;
}
