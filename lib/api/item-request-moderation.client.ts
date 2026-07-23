import {
  itemRequestQueueResponseSchema,
  itemRequestReviewResultSchema,
  type ItemRequestDecision,
  type ItemRequestReviewResult,
  type PendingItemRequest,
} from "@/lib/api/schemas/item-request-moderation.schema";
import { ModerationError } from "@/lib/api/moderation.client";

export async function fetchPendingItemRequests(): Promise<PendingItemRequest[]> {
  const response = await fetch("/api/moderation/item-requests", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ModerationError(
      response.status === 403 ? "Moderators only" : "Could not load requests",
      response.status,
    );
  }
  const parsed = itemRequestQueueResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new ModerationError("Unexpected response", 500);
  return parsed.data.requests;
}

export async function reviewItemRequest(
  id: string,
  decision: ItemRequestDecision,
): Promise<ItemRequestReviewResult> {
  const response = await fetch(`/api/moderation/item-requests/${id}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(decision),
  });
  if (!response.ok) {
    throw new ModerationError(
      response.status === 409 ? "Already reviewed" : "Review failed",
      response.status,
    );
  }
  const parsed = itemRequestReviewResultSchema.safeParse(await response.json());
  if (!parsed.success) throw new ModerationError("Unexpected response", 500);
  return parsed.data;
}
