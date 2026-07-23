import type { Prisma } from "@prisma/client";

import type { ContributionSearch } from "@/lib/api/schemas/moderation-search.schema";
import type { PendingContribution } from "@/lib/api/schemas/moderation.schema";
import { prisma } from "@/lib/db/prisma";
import { toModeratorView } from "@/lib/server/moderation.service";

const MAX_RESULTS = 100;

/**
 * Finds contributions matching the given filters, newest first.
 *
 * Filters combine with AND; text filters are case-insensitive `contains`. Same
 * detailed shape as the queue (via `toModeratorView`), so the same review card —
 * with Verify / Flag / Undo — works on a search hit, which is exactly the
 * drop-point flow: search the receiver code, see the expected items, act.
 */
export async function searchContributions(
  filters: ContributionSearch,
): Promise<PendingContribution[]> {
  const where: Prisma.ContributionWhereInput = {};

  if (filters.receiverCode) {
    where.receiverCode = { contains: filters.receiverCode, mode: "insensitive" };
  }
  if (filters.platform) where.platform = filters.platform;
  if (filters.state) where.state = filters.state;
  if (filters.qty !== undefined) where.qtyClaimed = filters.qty;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }
  if (filters.itemName) {
    where.need = {
      is: { item: { name: { contains: filters.itemName, mode: "insensitive" } } },
    };
  }
  if (filters.supporterName) {
    const match = { contains: filters.supporterName, mode: "insensitive" as const };
    where.user = {
      is: { OR: [{ displayName: match }, { name: match }] },
    };
  }

  const rows = await prisma.contribution.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_RESULTS,
    include: {
      need: { include: { item: true } },
      user: { select: { isAnonymous: true } },
      proofs: true,
    },
  });

  return Promise.all(rows.map(toModeratorView));
}
