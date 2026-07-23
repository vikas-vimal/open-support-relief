import { prisma } from "@/lib/db/prisma";
import { deleteProofObject } from "@/lib/server/storage";
import { logger } from "@/lib/server/logger";

const SCOPE = "purgeExpiredProofs";
/** Bound the work per run so one invocation can't stall on a huge backlog. */
const MAX_PER_RUN = 500;

export interface PurgeResult {
  /** Rows whose object was removed (or was already gone) and row deleted. */
  purged: number;
  /** Rows left for a later run because the storage delete failed. */
  failed: number;
}

/**
 * Deletes proof screenshots whose `purgeAfter` has passed — object first, DB row
 * only on success.
 *
 * The order is the whole point (§7): a row is never deleted while its object
 * survives, because that would strand a screenshot of someone's name, phone and
 * home address in storage with nothing left in the database to ever find it
 * again. A storage failure keeps the row so the next run retries it.
 */
export async function purgeExpiredProofs(now: Date): Promise<PurgeResult> {
  const expired = await prisma.proofImage.findMany({
    where: { purgeAfter: { lte: now } },
    select: { id: true, storagePath: true },
    take: MAX_PER_RUN,
  });

  const deletableIds: string[] = [];
  let failed = 0;

  for (const proof of expired) {
    try {
      await deleteProofObject(proof.storagePath);
      deletableIds.push(proof.id);
    } catch (error) {
      failed += 1;
      logger.error({
        scope: SCOPE,
        message: "Could not delete proof object; keeping row for retry",
        meta: {
          proofId: proof.id,
          reason: error instanceof Error ? error.message : "unknown",
        },
      });
    }
  }

  if (deletableIds.length > 0) {
    await prisma.proofImage.deleteMany({ where: { id: { in: deletableIds } } });
  }

  return { purged: deletableIds.length, failed };
}
