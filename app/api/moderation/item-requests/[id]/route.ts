import type { NextRequest } from "next/server";

import {
  itemRequestDecisionSchema,
  itemRequestReviewResultSchema,
} from "@/lib/api/schemas/item-request-moderation.schema";
import { getAuthedUser, isModerator } from "@/lib/auth/session";
import {
  InvalidMergeTargetError,
  ItemRequestNotPendingError,
  reviewItemRequest,
} from "@/lib/server/item-request-moderation.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "POST /api/moderation/item-requests/:id";

/** Approve / merge / reject a pending proposal — MODERATOR/ADMIN only. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isModerator(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = itemRequestDecisionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Invalid decision" }, { status: 400 });
  }

  try {
    const result = await reviewItemRequest(user.id, id, parsed.data);
    return Response.json(itemRequestReviewResultSchema.parse(result));
  } catch (error) {
    if (error instanceof ItemRequestNotPendingError) {
      return Response.json({ error: "Already reviewed" }, { status: 409 });
    }
    if (error instanceof InvalidMergeTargetError) {
      return Response.json({ error: "Invalid merge target" }, { status: 400 });
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to review item request",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
