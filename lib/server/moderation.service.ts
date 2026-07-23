import type {
  PendingContribution,
  ReviewResult,
} from "@/lib/api/schemas/moderation.schema";
import {
  UNDO_WINDOW_MINUTES,
  type DisputeReason,
} from "@/lib/domain/airdrop.constants";
import { prisma } from "@/lib/db/prisma";
import { signProofReadUrl } from "@/lib/server/storage";

export class ContributionNotPendingError extends Error {
  constructor() {
    super("Contribution is not pending review");
    this.name = "ContributionNotPendingError";
  }
}

/** A Missing-qty dispute whose received amount is out of range. */
export class InvalidDisputeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDisputeError";
  }
}

export interface DisputeInput {
  reason: DisputeReason;
  qtyReceived?: number;
  note?: string;
}

/** Proofs are kept 7 days past verification, then the purge cron removes them. */
const VERIFIED_PROOF_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
/** A reopened claim's proof reverts to the 30-day pending cap. */
const PENDING_PROOF_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

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

  return Promise.all(rows.map(toModeratorView));
}

/** Shapes a contribution row (+ signed proof URLs) for the moderator surfaces. */
export async function toModeratorView(row: {
  id: string;
  qtyClaimed: number;
  platform: string;
  platformOther: string | null;
  receiverCode: string | null;
  state: PendingContribution["state"];
  reviewReason: string | null;
  qtyReceived: number | null;
  createdAt: Date;
  reviewedAt: Date | null;
  need: { item: { name: string; unit: string } };
  user: { isAnonymous: boolean };
  proofs: { storagePath: string }[];
}): Promise<PendingContribution> {
  return {
    id: row.id,
    itemName: row.need.item.name,
    unit: row.need.item.unit,
    qtyClaimed: row.qtyClaimed,
    platform: row.platform,
    platformOther: row.platformOther,
    receiverCode: row.receiverCode,
    state: row.state,
    reviewReason: row.reviewReason,
    qtyReceived: row.qtyReceived,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    contributorIsAnonymous: row.user.isAnonymous,
    proofUrls: await Promise.all(
      row.proofs.map((proof) => signProofReadUrl(proof.storagePath)),
    ),
  };
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
        reviewedAt: reviewedAt.toISOString(),
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
      reviewedAt: reviewedAt.toISOString(),
    };
  });
}

/**
 * Flags a problem with a received parcel, telling the supporter why (§17.3).
 *
 * The counter is given back so the item can be re-sent — fully for Fraud /
 * Quality / Not-received / Other, and by the shortfall only for Missing-qty
 * (the moderator says how many actually arrived, which stay counted). A claim
 * added its full quantity to `qtyFulfilled` when made, so decrementing by the
 * restored amount can never drive it negative. Guarded to a still-PENDING row,
 * so it cannot double-restore.
 */
export async function disputeContribution(
  moderatorId: string,
  contributionId: string,
  input: DisputeInput,
): Promise<ReviewResult> {
  return prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.findUnique({
      where: { id: contributionId },
      include: { need: true },
    });
    if (!contribution || contribution.state !== "PENDING") {
      throw new ContributionNotPendingError();
    }

    const isMissingQty = input.reason === "MISSING_QTY";
    const received = isMissingQty ? (input.qtyReceived ?? -1) : 0;
    if (isMissingQty && (received < 0 || received >= contribution.qtyClaimed)) {
      throw new InvalidDisputeError(
        "Received quantity must be between 0 and the claimed amount",
      );
    }
    const restore = contribution.qtyClaimed - received;
    const reviewedAt = new Date();

    await tx.contribution.update({
      where: { id: contributionId },
      data: {
        state: "DISPUTED",
        reviewReason: input.reason,
        reviewNote: input.note ?? null,
        qtyReceived: isMissingQty ? received : null,
        reviewedById: moderatorId,
        reviewedAt,
      },
    });
    const need = await tx.need.update({
      where: { id: contribution.needId },
      data: { qtyFulfilled: { decrement: restore } },
    });
    await tx.needEvent.create({
      data: {
        needId: contribution.needId,
        actorId: moderatorId,
        delta: -restore,
        reason: "CONTRIBUTION_DISPUTED",
      },
    });
    // Keep the proof as evidence of the dispute, on the same 7-day post-review clock.
    await tx.proofImage.updateMany({
      where: { contributionId },
      data: { purgeAfter: new Date(Date.now() + VERIFIED_PROOF_RETENTION_MS) },
    });
    await tx.auditLog.create({
      data: {
        actorId: moderatorId,
        action: "REVIEW_DISPUTE",
        targetType: "Contribution",
        targetId: contributionId,
      },
    });

    return {
      contributionId,
      state: "DISPUTED" as const,
      needId: need.id,
      qtyFulfilled: need.qtyFulfilled,
      shortfall: shortfallOf(need.qtyRequested, need.qtyFulfilled, need.qtyReserved),
      reviewedAt: reviewedAt.toISOString(),
    };
  });
}

/** Undo is only offered for a short window after the decision (§17.4). */
export class UndoWindowExpiredError extends Error {
  constructor() {
    super("Too late to undo — the review has locked");
    this.name = "UndoWindowExpiredError";
  }
}

/** There is no decision to undo (the claim is still pending). */
export class NothingToUndoError extends Error {
  constructor() {
    super("This claim has not been reviewed");
    this.name = "NothingToUndoError";
  }
}

/** Re-applying the reversed decision would push the board past its request. */
export class UndoOversellError extends Error {
  constructor() {
    super("The board has been refilled — cannot undo");
    this.name = "UndoOversellError";
  }
}

/**
 * Reverts a recent VERIFY / REJECT / DISPUTE back to PENDING (§17.4).
 *
 * Only within `UNDO_WINDOW_MINUTES` of the decision, so a late change can't
 * surprise a supporter. Reverses exactly what the decision did: VERIFY only
 * reopens (count untouched, proof retention reset to the pending cap); REJECT
 * and DISPUTE re-add the amount they gave back — refused if that would now
 * oversell the board, since others may have filled it in the meantime.
 */
export async function undoReview(
  moderatorId: string,
  contributionId: string,
): Promise<ReviewResult> {
  return prisma.$transaction(async (tx) => {
    const contribution = await tx.contribution.findUnique({
      where: { id: contributionId },
      include: { need: true },
    });
    if (!contribution) throw new NothingToUndoError();
    if (contribution.state === "PENDING") throw new NothingToUndoError();
    if (
      !contribution.reviewedAt ||
      Date.now() - contribution.reviewedAt.getTime() >
        UNDO_WINDOW_MINUTES * 60_000
    ) {
      throw new UndoWindowExpiredError();
    }

    // How much this decision handed back to the board, to re-apply now.
    const reAdd =
      contribution.state === "VERIFIED"
        ? 0
        : contribution.qtyClaimed - (contribution.qtyReceived ?? 0);

    const { need } = contribution;
    if (
      reAdd > 0 &&
      need.qtyFulfilled + reAdd + need.qtyReserved > need.qtyRequested
    ) {
      throw new UndoOversellError();
    }

    await tx.contribution.update({
      where: { id: contributionId },
      data: {
        state: "PENDING",
        reviewReason: null,
        reviewNote: null,
        qtyReceived: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });

    let updatedNeed = need;
    if (reAdd > 0) {
      updatedNeed = await tx.need.update({
        where: { id: need.id },
        data: { qtyFulfilled: { increment: reAdd } },
      });
      await tx.needEvent.create({
        data: {
          needId: need.id,
          actorId: moderatorId,
          delta: reAdd,
          reason: "REVIEW_UNDONE",
        },
      });
    }
    // Verified proofs had their retention shortened; reopening restores the cap.
    await tx.proofImage.updateMany({
      where: { contributionId },
      data: { purgeAfter: new Date(Date.now() + PENDING_PROOF_RETENTION_MS) },
    });
    await tx.auditLog.create({
      data: {
        actorId: moderatorId,
        action: "REVIEW_UNDO",
        targetType: "Contribution",
        targetId: contributionId,
      },
    });

    return {
      contributionId,
      state: "PENDING" as const,
      needId: updatedNeed.id,
      qtyFulfilled: updatedNeed.qtyFulfilled,
      shortfall: shortfallOf(
        updatedNeed.qtyRequested,
        updatedNeed.qtyFulfilled,
        updatedNeed.qtyReserved,
      ),
      reviewedAt: null,
    };
  });
}
