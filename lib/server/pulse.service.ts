import type { Pulse } from "@/lib/api/schemas/pulse.schema";
import { prisma } from "@/lib/db/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Momentum figures for the board ticker, from VERIFIED contributions only.
 *
 * The verify gate matters here too: a pending claim is not "delivered" yet, so
 * counting it would let the ticker overstate what has actually reached the site.
 * The 24h figure keys off `reviewedAt` — when it was confirmed — not when the
 * claim was made.
 */
export async function getPulse(): Promise<Pulse> {
  const since = new Date(Date.now() - DAY_MS);

  const [allTime, last24h] = await Promise.all([
    prisma.contribution.aggregate({
      where: { state: "VERIFIED" },
      _sum: { qtyClaimed: true },
      _count: { _all: true },
    }),
    prisma.contribution.aggregate({
      where: { state: "VERIFIED", reviewedAt: { gte: since } },
      _sum: { qtyClaimed: true },
    }),
  ]);

  return {
    itemsAllTime: allTime._sum.qtyClaimed ?? 0,
    itemsLast24h: last24h._sum.qtyClaimed ?? 0,
    airdropsAllTime: allTime._count._all,
  };
}
