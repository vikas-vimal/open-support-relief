import { Prisma } from "@prisma/client";

import type { IntentRequest } from "@/lib/api/schemas/intent.schema";
import { INTENT_LOCK_TTL_MINUTES } from "@/lib/domain/airdrop.constants";
import { prisma } from "@/lib/db/prisma";
import { NeedNotFoundError, OversellError } from "@/lib/server/contribution.service";

export interface IntentResult {
  needId: string;
  qtyReserved: number;
  shortfall: number;
  expiresAt: string;
}

/**
 * Places (or refreshes) this user's soft reservation on a need.
 *
 * One live intent per (need, user): re-committing replaces the previous hold
 * rather than stacking. The reservation counts against shortfall via
 * `need.qtyReserved`, guarded by the same CHECK constraint as fulfilment, so an
 * intent can never reserve more than remains.
 */
export async function placeIntent(
  userId: string,
  input: IntentRequest,
): Promise<IntentResult> {
  const expiresAt = new Date(Date.now() + INTENT_LOCK_TTL_MINUTES * 60_000);

  try {
    return await prisma.$transaction(async (tx) => {
      const need = await tx.need.findUnique({ where: { id: input.needId } });
      if (!need || !need.isActive) throw new NeedNotFoundError();

      // Drop this user's existing holds first, returning their quantity.
      const prior = await tx.intent.aggregate({
        where: { needId: need.id, userId },
        _sum: { qty: true },
      });
      const priorQty = Math.min(prior._sum.qty ?? 0, need.qtyReserved);
      await tx.intent.deleteMany({ where: { needId: need.id, userId } });

      const baseReserved = need.qtyReserved - priorQty;
      if (need.qtyFulfilled + baseReserved + input.qty > need.qtyRequested) {
        throw new OversellError();
      }

      await tx.intent.create({
        data: { needId: need.id, userId, qty: input.qty, expiresAt },
      });

      const updated = await tx.need.update({
        where: { id: need.id },
        data: { qtyReserved: baseReserved + input.qty },
      });

      return {
        needId: need.id,
        qtyReserved: updated.qtyReserved,
        shortfall: Math.max(
          0,
          updated.qtyRequested - updated.qtyFulfilled - updated.qtyReserved,
        ),
        expiresAt: expiresAt.toISOString(),
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2010" &&
      String(error.meta?.message ?? "").includes("need_counters_nonneg")
    ) {
      throw new OversellError();
    }
    throw error;
  }
}
