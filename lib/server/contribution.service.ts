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

/** The issued receiver code was taken between reveal and confirm (≈ never). */
export class ReceiverCodeTakenError extends Error {
  constructor() {
    super("Receiver code already in use — reveal the drop point again");
    this.name = "ReceiverCodeTakenError";
  }
}

/** Retention cap for a proof still awaiting moderator review. */
const PROOF_PENDING_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export interface ClaimResult {
  contributionId: string;
  needId: string;
  state: "PENDING" | "VERIFIED" | "REJECTED" | "DISPUTED";
  receiverCode: string | null;
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
          receiverCode: input.receiverCode ?? null,
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
        receiverCode: contribution.receiverCode,
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
      if (error.code === "P2002") {
        // Which unique constraint fired decides the outcome, but `meta.target` is
        // not reliably populated by the pg driver adapter. Resolve it by fact: if
        // a row with this idempotency key exists, this is a safe replay; if not,
        // the receiverCode (≈ never) clashed and there is nothing to replay.
        const replay = await replayClaim(idempotencyKey);
        if (replay) return replay;
        throw new ReceiverCodeTakenError();
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

/**
 * The idempotent no-op: the already-recorded claim's current view, or null if no
 * row carries this key (so the P2002 came from a different unique constraint).
 */
async function replayClaim(
  idempotencyKey: string,
): Promise<ClaimResult | null> {
  const existing = await prisma.contribution.findUnique({
    where: { idempotencyKey },
    include: { need: true },
  });
  if (!existing) return null;

  return {
    contributionId: existing.id,
    needId: existing.needId,
    state: existing.state,
    receiverCode: existing.receiverCode,
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
