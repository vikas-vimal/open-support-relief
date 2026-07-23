import type { MyContribution } from "@/lib/api/schemas/my-contributions.schema";
import { prisma } from "@/lib/db/prisma";

/**
 * The caller's own airdrop history, newest first.
 *
 * Scoped strictly to `userId` — a supporter can only ever see their own claims,
 * never anyone else's. Returns just enough to show what was sent and where it
 * stands (pending / verified / rejected); no drop-point or contributor data.
 */
export async function listMyContributions(
  userId: string,
): Promise<MyContribution[]> {
  const rows = await prisma.contribution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { need: { include: { item: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    itemName: row.need.item.name,
    unit: row.need.item.unit,
    qtyClaimed: row.qtyClaimed,
    platform: row.platform,
    platformOther: row.platformOther,
    state: row.state,
    receiverCode: row.receiverCode,
    reviewReason: row.reviewReason,
    qtyReceived: row.qtyReceived,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  }));
}
