import type { NextRequest } from "next/server";

import {
  reviewActionSchema,
  reviewResultSchema,
} from "@/lib/api/schemas/moderation.schema";
import { getAuthedUser, isModerator } from "@/lib/auth/session";
import {
  ContributionNotPendingError,
  reviewContribution,
} from "@/lib/server/moderation.service";
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

  try {
    const result = await reviewContribution(user.id, id, parsed.data.action);
    return Response.json(reviewResultSchema.parse(result));
  } catch (error) {
    if (error instanceof ContributionNotPendingError) {
      return Response.json(
        { error: "Already reviewed" },
        { status: 409 },
      );
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to review contribution",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
