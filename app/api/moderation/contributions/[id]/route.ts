import type { NextRequest } from "next/server";

import {
  reviewActionSchema,
  reviewResultSchema,
} from "@/lib/api/schemas/moderation.schema";
import { getAuthedUser, isModerator } from "@/lib/auth/session";
import {
  ContributionNotPendingError,
  disputeContribution,
  InvalidDisputeError,
  reviewContribution,
} from "@/lib/server/moderation.service";
import type { ReviewResult } from "@/lib/api/schemas/moderation.schema";
import { logger } from "@/lib/server/logger";

const SCOPE = "POST /api/moderation/contributions/:id";

/** Verify or reject a pending claim — MODERATOR/ADMIN only. */
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
  const parsed = reviewActionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const decision = parsed.data;
  try {
    let result: ReviewResult;
    if (decision.action === "DISPUTE") {
      result = await disputeContribution(user.id, id, {
        reason: decision.reason,
        qtyReceived: decision.qtyReceived,
        note: decision.note,
      });
    } else if (decision.action === "VERIFY" || decision.action === "REJECT") {
      result = await reviewContribution(user.id, id, decision.action);
    } else {
      // UNDO is wired in a later step.
      return Response.json({ error: "Unsupported action" }, { status: 400 });
    }
    return Response.json(reviewResultSchema.parse(result));
  } catch (error) {
    if (error instanceof ContributionNotPendingError) {
      return Response.json({ error: "Already reviewed" }, { status: 409 });
    }
    if (error instanceof InvalidDisputeError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to review contribution",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
