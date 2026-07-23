import type { AirdropCategory, Urgency } from "@/lib/domain/airdrop.constants";
import type {
  BoardSnapshot,
  NeedSummary,
  SiteSummary,
} from "@/lib/domain/airdrop.types";
import { rankNeeds } from "@/lib/domain/needs.util";
import { prisma } from "@/lib/db/prisma";

/** Thrown when there is no active site to show a board for. Handler maps to 404. */
export class NoActiveSiteError extends Error {
  constructor() {
    super("No active site is configured");
    this.name = "NoActiveSiteError";
  }
}

/**
 * Builds the public board for the active site.
 *
 * Returns only the coarse `areaLabel` — never a drop-point address. Shortfall is
 * computed here rather than stored, so it can never drift from the counters, and
 * the result is ranked with the SAME `rankNeeds` the client uses, so an
 * optimistic client re-sort can never disagree with the next server payload.
 */
export async function getActiveBoard(siteId?: string): Promise<BoardSnapshot> {
  const site = await prisma.site.findFirst({
    where: siteId ? { id: siteId, isActive: true } : { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      // Public fields ONLY — address/phone are never selected into the board.
      dropPoints: {
        where: { isActive: true },
        select: { id: true, label: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!site) throw new NoActiveSiteError();

  const needs = await prisma.need.findMany({
    where: { siteId: site.id, isActive: true },
    include: { item: true },
  });

  // People with a live intent lock, per need — the "3 ordering now" signal.
  const activeIntents = await prisma.intent.groupBy({
    by: ["needId"],
    where: {
      needId: { in: needs.map((need) => need.id) },
      expiresAt: { gt: new Date() },
    },
    _count: { needId: true },
  });
  const orderingNowByNeed = new Map(
    activeIntents.map((row) => [row.needId, row._count.needId]),
  );

  const summaries: NeedSummary[] = needs.map((need) => ({
    id: need.id,
    itemName: need.item.name,
    unit: need.item.unit,
    category: need.item.category as AirdropCategory,
    qtyRequested: need.qtyRequested,
    qtyFulfilled: need.qtyFulfilled,
    qtyReserved: need.qtyReserved,
    shortfall: Math.max(
      0,
      need.qtyRequested - need.qtyFulfilled - need.qtyReserved,
    ),
    urgency: need.urgency as Urgency,
    activeContributorCount: orderingNowByNeed.get(need.id) ?? 0,
    updatedAt: need.updatedAt.toISOString(),
  }));

  const siteSummary: SiteSummary = {
    id: site.id,
    name: site.name,
    areaLabel: site.areaLabel,
    isFrozen: site.isFrozen,
    dropPoints: site.dropPoints.map((dp) => ({ id: dp.id, label: dp.label })),
  };

  return { site: siteSummary, needs: rankNeeds(summaries) };
}
