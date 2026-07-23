import { moderationQueueResponseSchema } from "@/lib/api/schemas/moderation.schema";
import { getAuthedUser, isModerator } from "@/lib/auth/session";
import { listPendingContributions } from "@/lib/server/moderation.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/moderation/contributions";

/** Pending claims for review — MODERATOR/ADMIN only. */
export async function GET(): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isModerator(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const contributions = await listPendingContributions();
    return Response.json(
      moderationQueueResponseSchema.parse({ contributions }),
    );
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to load moderation queue",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
