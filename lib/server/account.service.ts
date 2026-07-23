import { prisma } from "@/lib/db/prisma";
import { deleteProofObject } from "@/lib/server/storage";

/** Sentinel actor kept on counter events after the real user is erased. */
const ERASED_ACTOR = "account-deleted";

/**
 * Erases a user and everything personal about them (§7 one-tap deletion).
 *
 * Two ordered steps:
 *
 * 1. Delete their proof screenshots from storage FIRST. If any object cannot be
 *    removed this throws, so the account is NOT deleted — otherwise the
 *    ProofImage rows would cascade away and strand a screenshot of the person's
 *    name/phone/address in the bucket with no record left to find it by.
 *
 * 2. In one transaction: give back the board counters their still-counting
 *    (PENDING/VERIFIED) contributions added — deleting a Contribution row does
 *    NOT decrement qtyFulfilled, so skipping this would leave the board
 *    permanently overstated — then delete the non-cascading rows (intents,
 *    audit, rate-limit), anonymise the counter events they authored, and delete
 *    the user (cascading sessions, accounts, contributions→proofs, item
 *    requests).
 */
export async function deleteAccount(userId: string): Promise<void> {
  const proofs = await prisma.proofImage.findMany({
    where: { contribution: { userId } },
    select: { storagePath: true },
  });
  for (const proof of proofs) {
    await deleteProofObject(proof.storagePath); // throws on a real failure
  }

  await prisma.$transaction(async (tx) => {
    const counting = await tx.contribution.findMany({
      where: { userId, state: { in: ["PENDING", "VERIFIED"] } },
      select: { needId: true, qtyClaimed: true },
    });
    const givebackByNeed = new Map<string, number>();
    for (const claim of counting) {
      givebackByNeed.set(
        claim.needId,
        (givebackByNeed.get(claim.needId) ?? 0) + claim.qtyClaimed,
      );
    }
    for (const [needId, qty] of givebackByNeed) {
      await tx.need.update({
        where: { id: needId },
        data: { qtyFulfilled: { decrement: qty } },
      });
      await tx.needEvent.create({
        data: {
          needId,
          actorId: ERASED_ACTOR,
          delta: -qty,
          reason: "ACCOUNT_DELETED",
        },
      });
    }

    // Rows that do NOT cascade from User.
    await tx.intent.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { actorId: userId } });
    await tx.rateLimit.deleteMany({ where: { userId } });
    // Keep the counter audit trail, but strip the actor — it is the only
    // identifier on a NeedEvent and it must not outlive the account.
    await tx.needEvent.updateMany({
      where: { actorId: userId },
      data: { actorId: ERASED_ACTOR },
    });

    await tx.user.delete({ where: { id: userId } });
  });
}
