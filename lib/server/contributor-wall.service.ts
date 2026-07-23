import type { ContributorWall } from "@/lib/api/schemas/contributor-wall.schema";
import { prisma } from "@/lib/db/prisma";

/** Cap the named leaderboard; the rest fold into the anonymous aggregate. */
const MAX_LEADERS = 50;

/**
 * Builds the public contributors wall from VERIFIED airdrops only.
 *
 * The verify gate is the whole point: a pending or rejected claim contributes
 * nothing here, so the wall cannot be farmed with unverified proofs. A supporter
 * is named only if they set `showOnWall` AND a display name; everyone else is
 * counted anonymously, never exposed.
 */
export async function getContributorWall(): Promise<ContributorWall> {
  const grouped = await prisma.contribution.groupBy({
    by: ["userId"],
    where: { state: "VERIFIED" },
    _sum: { qtyClaimed: true },
    _count: { _all: true },
  });
  if (grouped.length === 0) {
    return { leaders: [], anonymousSupporterCount: 0, anonymousQty: 0 };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((row) => row.userId) } },
    select: { id: true, displayName: true, showOnWall: true },
  });
  const userById = new Map(users.map((user) => [user.id, user]));

  const leaders: ContributorWall["leaders"] = [];
  let anonymousSupporterCount = 0;
  let anonymousQty = 0;

  for (const row of grouped) {
    const verifiedQty = row._sum.qtyClaimed ?? 0;
    if (verifiedQty <= 0) continue;

    const user = userById.get(row.userId);
    const name = user?.showOnWall ? user.displayName?.trim() : null;

    if (name) {
      leaders.push({
        displayName: name,
        verifiedQty,
        verifiedCount: row._count._all,
      });
    } else {
      anonymousSupporterCount += 1;
      anonymousQty += verifiedQty;
    }
  }

  leaders.sort((left, right) => right.verifiedQty - left.verifiedQty);

  return {
    leaders: leaders.slice(0, MAX_LEADERS),
    anonymousSupporterCount,
    anonymousQty,
  };
}
