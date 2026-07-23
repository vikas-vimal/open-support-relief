import type { ItemRequestInput } from "@/lib/api/schemas/item-request.schema";
import { normalizeItemName } from "@/lib/domain/item-match.util";
import { prisma } from "@/lib/db/prisma";

export interface CreatedItemRequest {
  id: string;
  state: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "MERGED";
}

/**
 * Persists a public item proposal for moderator review.
 *
 * Stores a `normalizedName` (same normaliser the client dedupe uses) so a
 * moderator can spot near-duplicates and merge them, and so a future
 * server-side guard can reject an obvious repeat. Nothing here reaches the
 * public board until a moderator approves it.
 */
export async function createItemRequest(
  userId: string,
  siteId: string,
  input: ItemRequestInput,
): Promise<CreatedItemRequest> {
  const created = await prisma.itemRequest.create({
    data: {
      siteId,
      proposedName: input.proposedName,
      normalizedName: normalizeItemName(input.proposedName),
      unit: input.unit,
      category: input.category,
      qtyRequested: input.qtyRequested,
      note: input.note,
      requestedById: userId,
      state: "PENDING_REVIEW",
    },
    select: { id: true, state: true },
  });

  return created;
}
