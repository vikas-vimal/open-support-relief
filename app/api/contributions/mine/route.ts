import { myContributionsResponseSchema } from "@/lib/api/schemas/my-contributions.schema";
import { getAuthedUser } from "@/lib/auth/session";
import { listMyContributions } from "@/lib/server/my-contributions.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/contributions/mine";

/**
 * The caller's own airdrop history.
 *
 * A visitor with no session simply has none yet — returns an empty list rather
 * than a 401, so the page renders a clean "nothing sent yet" state instead of
 * an error for a first-time user.
 */
export async function GET(): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) {
    return Response.json({ contributions: [] });
  }

  try {
    const contributions = await listMyContributions(user.id);
    return Response.json(
      myContributionsResponseSchema.parse({ contributions }),
      // User-specific: never cached by a shared/intermediary cache.
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to load own contributions",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
