import type { BoardSnapshot } from "@/lib/domain/airdrop.types";
import { buildMockBoardSnapshot } from "@/lib/mock/needs.mock";

/**
 * The board's only data-access function — the single place Phase 2 swaps a
 * fixture for the network.
 *
 * Phase 2 body:
 *   const response = await fetch("/api/needs?siteId=...", { signal });
 *   if (!response.ok) throw new BoardFetchError(...);
 *   return boardSnapshotSchema.parse(await response.json());
 *
 * Kept async from day one so callers already handle latency, cancellation and
 * failure, and so the snapshot's timestamps are only ever produced in the browser.
 */
export async function fetchBoardSnapshot(): Promise<BoardSnapshot> {
  return buildMockBoardSnapshot(new Date());
}
