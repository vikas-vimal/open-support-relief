import type { AirdropCategory } from "@/lib/domain/airdrop.constants";

export interface ItemRequestDraft {
  proposedName: string;
  category: AirdropCategory;
  qtyRequested: number;
  unit: string;
  note: string;
}

/**
 * Submits a publicly proposed item for moderator review.
 *
 * Phase 2 body:
 *   const response = await fetch("/api/item-requests", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", "Idempotency-Key": key },
 *     body: JSON.stringify(itemRequestSchema.parse(draft)),
 *   });
 *   if (!response.ok) throw new ItemRequestError(...);
 *
 * Kept async and throwing from day one so callers already handle the retry and
 * failure paths that the real endpoint will exercise.
 */
export async function submitItemRequest(
  draft: ItemRequestDraft,
): Promise<void> {
  if (!draft.proposedName.trim()) {
    throw new Error(
      "submitItemRequest() called with an empty proposedName — the sheet should have blocked this",
    );
  }
}
