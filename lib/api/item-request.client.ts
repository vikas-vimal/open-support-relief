import type { AirdropCategory } from "@/lib/domain/airdrop.constants";
import { signIn } from "@/lib/auth/auth-client";

export interface ItemRequestDraft {
  proposedName: string;
  category: AirdropCategory;
  qtyRequested: number;
  unit: string;
  note: string;
}

export class ItemRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ItemRequestError";
  }
}

async function postItemRequest(draft: ItemRequestDraft): Promise<Response> {
  return fetch("/api/item-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      proposedName: draft.proposedName.trim(),
      category: draft.category,
      qtyRequested: draft.qtyRequested,
      unit: draft.unit,
      note: draft.note.trim() || undefined,
    }),
  });
}

/**
 * Submits a publicly proposed item for moderator review.
 *
 * Proposing requires a session, but the friction stays invisible: a first-time
 * user is signed in anonymously and the submit is retried once, mirroring the
 * reveal flow. No personal detail is required to propose.
 */
export async function submitItemRequest(
  draft: ItemRequestDraft,
): Promise<void> {
  let response = await postItemRequest(draft);

  if (response.status === 401) {
    await signIn.anonymous();
    response = await postItemRequest(draft);
  }

  if (!response.ok) {
    const message =
      response.status === 429
        ? "Too many requests — please wait a while"
        : "Could not send your request";
    throw new ItemRequestError(message, response.status);
  }
}
