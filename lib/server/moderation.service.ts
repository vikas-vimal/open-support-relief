import type {
  PendingContribution,
  ReviewResult,
} from "@/lib/api/schemas/moderation.schema";
import { prisma } from "@/lib/db/prisma";
import { signProofReadUrl } from "@/lib/server/storage";

export class ContributionNotPendingError extends Error {
  constructor() {
    super("Contribution is not pending review");
    this.name = "ContributionNotPendingError";
  }
}

/** Proofs are kept 7 days past verification, then the purge cron removes them. */
const VERIFIED_PROOF_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function shortfallOf(req: number, ful: number, res: number): number {
  return Math.max(0, req - ful - res);
}

/**
 * Pending claims for the moderator queue, newest first, each with short-lived
 * signed URLs for its proof images. The signed URL is the ONLY way a proof is
 * ever read — the bucket is private — so it is generated per request and
 * expires in seconds.
 */
export async function listPendingContributions(): Promise<PendingContribution[]> {
  const rows = await prisma.contribution.findMany({
    where: { state: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      need: { include: { item: true } },
      user: { select: { isAnonymous: true } },
      proofs: true,
    },
  });

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      itemName: row.need.item.name,
      unit: row.need.item.unit,
      qtyClaimed: row.qtyClaimed,
      platform: row.platform,
      platformOther: row.platformOther,
      createdAt: row.createdAt.toISOString(),
      contributorIsAnonymous: row.user.isAnonymous,
      proofUrls: await Promise.all(
        row.proofs.map((proof) => signProofReadUrl(proof.storagePath)),
      ),
    })),
  );
}

/**
 * Verifies or rejects a pending claim.
 *
 * REJECT is the load-bearing case: the claim's quantity was added to the board
 * counter the moment it was made (PENDING counts), so rejecting must give it
 * back. That restore — decrement `qtyFulfilled` by the claimed amount, in the
 * same transaction as the state change and an audit event — is the whole reason
 * "count now, verify later" is safe: a bad claim is fully reversible.
 *
 * VERIFY leaves the counter untouched (it already reflects the claim) and just
 * shortens proof retention.
 *
 * Both are guarded to only act on a still-PENDING row, so a double click or a
 * race cannot restore the counter twice.
 */
export async function reviewContribution(
  moderatorId: string,
  contributionId: string,
  action: "VERIFY" | "REJECT",
): Promise<ReviewResult> {
  return prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.findUnique({
      where: { id: contributionId },
      include: { need: true },
    });
    if (!contribution || contribution.state !== "PENDING") {
      throw new ContributionNotPendingError();
    }

    const reviewedAt = new Date();

    if (action === "REJECT") {
      await tx.contribution.update({
        where: { id: contributionId },
        data: { state: "REJECTED", reviewedById: moderatorId, reviewedAt },
      });
      const need = await tx.need.update({
        where: { id: contribution.needId },
        data: { qtyFulfilled: { decrement: contribution.qtyClaimed } },
      });
      await tx.needEvent.create({
        data: {
          needId: contribution.needId,
          actorId: moderatorId,
          delta: -contribution.qtyClaimed,
          reason: "CONTRIBUTION_REJECTED",
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: moderatorId,
          action: "REVIEW_REJECT",
          targetType: "Contribution",
          targetId: contributionId,
        },
      });
      return {
        contributionId,
        state: "REJECTED" as const,
        needId: need.id,
        qtyFulfilled: need.qtyFulfilled,
        shortfall: shortfallOf(need.qtyRequested, need.qtyFulfilled, need.qtyReserved),
      };
    }

    await tx.contribution.update({
      where: { id: contributionId },
      data: { state: "VERIFIED", reviewedById: moderatorId, reviewedAt },
    });
    // Proofs now purge 7 days after verification instead of the 30-day pending cap.
    await tx.proofImage.updateMany({
      where: { contributionId },
      data: { purgeAfter: new Date(Date.now() + VERIFIED_PROOF_RETENTION_MS) },
    });
    await tx.auditLog.create({
      data: {
        actorId: moderatorId,
        action: "REVIEW_VERIFY",
        targetType: "Contribution",
        targetId: contributionId,
      },
    });

    return {
      contributionId,
      state: "VERIFIED" as const,
      needId: contribution.need.id,
      qtyFulfilled: contribution.need.qtyFulfilled,
      shortfall: shortfallOf(
        contribution.need.qtyRequested,
        contribution.need.qtyFulfilled,
        contribution.need.qtyReserved,
      ),
    };
  });
}
