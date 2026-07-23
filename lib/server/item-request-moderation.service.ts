import type { Prisma } from "@prisma/client";

import type {
  ItemRequestDecision,
  ItemRequestReviewResult,
  PendingItemRequest,
} from "@/lib/api/schemas/item-request-moderation.schema";
import { prisma } from "@/lib/db/prisma";
import { normalizeItemName, scoreNameSimilarity } from "@/lib/domain/item-match.util";

export class ItemRequestNotPendingError extends Error {
  constructor() {
    super("Item request is not pending review");
    this.name = "ItemRequestNotPendingError";
  }
}

export class InvalidMergeTargetError extends Error {
  constructor() {
    super("Merge target is not a valid need for this site");
    this.name = "InvalidMergeTargetError";
  }
}

/** A candidate need must look at least this similar to be offered as a merge. */
const MERGE_CANDIDATE_THRESHOLD = 0.5;
/** Cap so one proposal card cannot sprout an unbounded list of merge buttons. */
const MAX_MERGE_CANDIDATES = 4;

/**
 * Pending public proposals for the moderator queue, newest first, each carrying
 * the existing needs it most resembles.
 *
 * Merge candidates are scored with the SAME matcher the public duplicate guard
 * uses, so what the moderator is offered to merge into is exactly what the
 * proposer was shown before submitting — a proposal that slipped past the guard
 * as "new" is re-checked here against the live board.
 */
export async function listPendingItemRequests(): Promise<PendingItemRequest[]> {
  const requests = await prisma.itemRequest.findMany({
    where: { state: "PENDING_REVIEW" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { requestedBy: { select: { isAnonymous: true } } },
  });
  if (requests.length === 0) return [];

  const siteIds = [...new Set(requests.map((request) => request.siteId))];
  const needs = await prisma.need.findMany({
    where: { siteId: { in: siteIds }, isActive: true },
    include: { item: true },
  });

  const needsBySite = new Map<string, typeof needs>();
  for (const need of needs) {
    const list = needsBySite.get(need.siteId) ?? [];
    list.push(need);
    needsBySite.set(need.siteId, list);
  }

  return requests.map((request) => {
    const siteNeeds = needsBySite.get(request.siteId) ?? [];
    const mergeCandidates = siteNeeds
      .map((need) => ({
        need,
        score: scoreNameSimilarity(request.proposedName, need.item.name),
      }))
      .filter((scored) => scored.score >= MERGE_CANDIDATE_THRESHOLD)
      .sort((left, right) => right.score - left.score)
      .slice(0, MAX_MERGE_CANDIDATES)
      .map(({ need }) => ({
        needId: need.id,
        itemName: need.item.name,
        unit: need.item.unit,
        qtyRequested: need.qtyRequested,
      }));

    return {
      id: request.id,
      proposedName: request.proposedName,
      category: request.category,
      unit: request.unit,
      qtyRequested: request.qtyRequested,
      note: request.note,
      createdAt: request.createdAt.toISOString(),
      requesterIsAnonymous: request.requestedBy.isAnonymous,
      mergeCandidates,
    };
  });
}

function writeAudit(
  tx: Prisma.TransactionClient,
  moderatorId: string,
  action: string,
  requestId: string,
): Promise<unknown> {
  return tx.auditLog.create({
    data: {
      actorId: moderatorId,
      action,
      targetType: "ItemRequest",
      targetId: requestId,
    },
  });
}

/**
 * Applies a moderator's decision to a pending proposal, in one transaction.
 *
 * APPROVE promotes the proposal to the board: it upserts the catalogue
 * `SupplyItem` (keyed on the normalized name, so an approval never fragments an
 * existing catalogue entry) and then either creates the site's `Need` or, if one
 * already exists for that item, folds the quantity in — the `(siteId,itemId)`
 * uniqueness makes a blind create unsafe. MERGE folds the quantity into a
 * moderator-chosen existing need. REJECT discards it.
 *
 * Every quantity change writes a `NeedEvent`, and the row is guarded to
 * PENDING_REVIEW so a double review cannot promote or count a proposal twice.
 */
export async function reviewItemRequest(
  moderatorId: string,
  requestId: string,
  decision: ItemRequestDecision,
): Promise<ItemRequestReviewResult> {
  return prisma.$transaction(async (tx) => {
    const request = await tx.itemRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.state !== "PENDING_REVIEW") {
      throw new ItemRequestNotPendingError();
    }

    const reviewedAt = new Date();

    if (decision.decision === "REJECT") {
      await tx.itemRequest.update({
        where: { id: requestId },
        data: { state: "REJECTED", reviewedAt },
      });
      await writeAudit(tx, moderatorId, "ITEM_REQUEST_REJECT", requestId);
      return { id: requestId, state: "REJECTED" as const, needId: null };
    }

    if (decision.decision === "MERGE") {
      const target = await tx.need.findUnique({
        where: { id: decision.targetNeedId },
      });
      if (!target || target.siteId !== request.siteId || !target.isActive) {
        throw new InvalidMergeTargetError();
      }
      const need = await tx.need.update({
        where: { id: target.id },
        data: { qtyRequested: { increment: request.qtyRequested } },
      });
      await tx.needEvent.create({
        data: {
          needId: need.id,
          actorId: moderatorId,
          delta: request.qtyRequested,
          reason: "ITEM_REQUEST_MERGED",
        },
      });
      await tx.itemRequest.update({
        where: { id: requestId },
        data: { state: "MERGED", reviewedAt, mergedIntoNeedId: need.id },
      });
      await writeAudit(tx, moderatorId, "ITEM_REQUEST_MERGE", requestId);
      return { id: requestId, state: "MERGED" as const, needId: need.id };
    }

    // APPROVE — promote to a board need via the catalogue.
    const normalized = normalizeItemName(request.proposedName);
    const item = await tx.supplyItem.upsert({
      where: { normalized },
      create: {
        name: request.proposedName,
        normalized,
        unit: request.unit,
        category: request.category,
        requestCount: 1,
      },
      update: { requestCount: { increment: 1 } },
    });

    // A need for this catalogue item at the site may already exist (the proposer
    // didn't find it, but it was there). Fold in rather than break uniqueness.
    const existing = await tx.need.findUnique({
      where: { siteId_itemId: { siteId: request.siteId, itemId: item.id } },
    });
    const need = existing
      ? await tx.need.update({
          where: { id: existing.id },
          data: {
            qtyRequested: { increment: request.qtyRequested },
            isActive: true,
          },
        })
      : await tx.need.create({
          data: {
            siteId: request.siteId,
            itemId: item.id,
            qtyRequested: request.qtyRequested,
          },
        });

    await tx.needEvent.create({
      data: {
        needId: need.id,
        actorId: moderatorId,
        delta: request.qtyRequested,
        reason: existing
          ? "ITEM_REQUEST_APPROVED_EXISTING"
          : "ITEM_REQUEST_APPROVED_NEW",
      },
    });
    await tx.itemRequest.update({
      where: { id: requestId },
      data: { state: "APPROVED", reviewedAt, mergedIntoNeedId: need.id },
    });
    await writeAudit(tx, moderatorId, "ITEM_REQUEST_APPROVE", requestId);

    return { id: requestId, state: "APPROVED" as const, needId: need.id };
  });
}
