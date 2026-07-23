import { itemRequestQueueResponseSchema } from "@/lib/api/schemas/item-request-moderation.schema";
import { getAuthedUser, isModerator } from "@/lib/auth/session";
import { listPendingItemRequests } from "@/lib/server/item-request-moderation.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/moderation/item-requests";

/** Pending public item proposals for review — MODERATOR/ADMIN only. */
export async function GET(): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isModerator(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const requests = await listPendingItemRequests();
    return Response.json(itemRequestQueueResponseSchema.parse({ requests }));
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to load item-request queue",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
