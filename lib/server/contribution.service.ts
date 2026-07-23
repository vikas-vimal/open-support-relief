import { Prisma } from "@prisma/client";

import type { ContributionRequest } from "@/lib/api/schemas/contribution.schema";
import { prisma } from "@/lib/db/prisma";

export class NeedNotFoundError extends Error {
  constructor() {
    super("Need not found or inactive");
    this.name = "NeedNotFoundError";
  }
}

/** The claim would push fulfilled+reserved past the request. */
export class OversellError extends Error {
  constructor() {
    super("This item is already covered");
    this.name = "OversellError";
  }
}

/** A proof path that does not belong to the claiming user. */
export class ForbiddenProofError extends Error {
  constructor() {
    super("Proof does not belong to this user");
    this.name = "ForbiddenProofError";
  }
}

/** Retention cap for a proof still awaiting moderator review. */
const PROOF_PENDING_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export interface ClaimResult {
  contributionId: string;
  needId: string;
  state: "PENDING" | "VERIFIED" | "REJECTED" | "DISPUTED";
  qtyFulfilled: number;
  qtyReserved: number;
  shortfall: number;
  deduplicated: boolean;
}

function shortfallOf(qtyRequested: number, qtyFulfilled: number, qtyReserved: number): number {
  return Math.max(0, qtyRequested - qtyFulfilled - qtyReserved);
}

/**
 * Records a contribution claim and advances the board counter atomically.
 *
 * Integrity rules, all load-bearing:
 *  - Everything (create claim, increment fulfilled, release the user's own
 *    reservation, write the audit event) happens in ONE `$transaction`. A
 *    partial apply would desync the counter from the claims.
 *  - `idempotencyKey` is unique. A replayed key returns the original result as a
 *    no-op — the offline retry path must never double-count.
 *  - Oversell is guarded twice: an explicit check for a clean 409, and the DB
 *    CHECK constraint (need_counters_nonneg) as the backstop against two
 *    concurrent claims that each individually looked fine.
 */
export async function claimContribution(
  userId: string,
  idempotencyKey: string,
  input: ContributionRequest,
): Promise<ClaimResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const need = await tx.need.findUnique({ where: { id: input.needId } });
      if (!need || !need.isActive) throw new NeedNotFoundError();

      // Release this user's own live reservations on this need — they are now
      // converting intent into a real claim, so the held quantity comes back.
      const reserved = await tx.intent.aggregate({
        where: { needId: need.id, userId, expiresAt: { gt: new Date() } },
        _sum: { qty: true },
      });
      const releaseQty = Math.min(reserved._sum.qty ?? 0, need.qtyReserved);

      const nextFulfilled = need.qtyFulfilled + input.qty;
      const nextReserved = need.qtyReserved - releaseQty;
      // Clean pre-check; the DB constraint backstops the concurrent case.
      if (nextFulfilled + nextReserved > need.qtyRequested) {
        throw new OversellError();
      }

      const contribution = await tx.contribution.create({
        data: {
          needId: need.id,
          userId,
          qtyClaimed: input.qty,
          platform: input.platform,
          platformOther:
            input.platform === "OTHER" ? input.platformOther : null,
          orderRef: input.orderRef,
          idempotencyKey,
          state: "PENDING",
        },
      });

      // Attach proof if one was uploaded. The path MUST live under this user's
      // own prefix — otherwise a claim could reference another person's object.
      if (input.proofStoragePath) {
        if (!input.proofStoragePath.startsWith(`proofs/${userId}/`)) {
          throw new ForbiddenProofError();
        }
        await tx.proofImage.create({
          data: {
            contributionId: contribution.id,
            storagePath: input.proofStoragePath,
            // Un-reviewed proofs are capped at 30 days; a moderator's verify
            // step (next) shortens this to 7 days after verification.
            purgeAfter: new Date(Date.now() + PROOF_PENDING_RETENTION_MS),
          },
        });
      }

      await tx.intent.deleteMany({ where: { needId: need.id, userId } });

      const updated = await tx.need.update({
        where: { id: need.id },
        data: {
          qtyFulfilled: { increment: input.qty },
          qtyReserved: releaseQty > 0 ? { decrement: releaseQty } : undefined,
        },
      });

      await tx.needEvent.create({
        data: {
          needId: need.id,
          actorId: userId,
          delta: input.qty,
          reason: "CONTRIBUTION_PENDING",
        },
      });

      // Opt-in wall visibility, recorded on the user.
      if (input.showName) {
        await tx.user.update({
          where: { id: userId },
          data: { showOnWall: true },
        });
      }

      return {
        contributionId: contribution.id,
        needId: need.id,
        state: "PENDING" as const,
        qtyFulfilled: updated.qtyFulfilled,
        qtyReserved: updated.qtyReserved,
        shortfall: shortfallOf(
          updated.qtyRequested,
          updated.qtyFulfilled,
          updated.qtyReserved,
        ),
        deduplicated: false,
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Replayed idempotency key — return the original claim, no double count.
      if (error.code === "P2002") {
        return replayClaim(idempotencyKey);
      }
      // CHECK constraint (need_counters_nonneg) — concurrent oversell backstop.
      if (
        error.code === "P2010" &&
        String(error.meta?.message ?? "").includes("need_counters_nonneg")
      ) {
        throw new OversellError();
      }
    }
    throw error;
  }
}

/** Returns the already-recorded claim's current view — the idempotent no-op. */
async function replayClaim(idempotencyKey: string): Promise<ClaimResult> {
  const existing = await prisma.contribution.findUniqueOrThrow({
    where: { idempotencyKey },
    include: { need: true },
  });

  return {
    contributionId: existing.id,
    needId: existing.needId,
    state: existing.state,
    qtyFulfilled: existing.need.qtyFulfilled,
    qtyReserved: existing.need.qtyReserved,
    shortfall: shortfallOf(
      existing.need.qtyRequested,
      existing.need.qtyFulfilled,
      existing.need.qtyReserved,
    ),
    deduplicated: true,
  };
}
