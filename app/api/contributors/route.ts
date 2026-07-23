import { contributorWallSchema } from "@/lib/api/schemas/contributor-wall.schema";
import { getContributorWall } from "@/lib/server/contributor-wall.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/contributors";

/**
 * Public contributors wall. No auth — it carries only opt-in display names and
 * anonymous aggregates. Short CDN cache, since the wall changes only when a
 * moderator verifies a claim.
 */
export async function GET(): Promise<Response> {
  try {
    const wall = await getContributorWall();
    return Response.json(contributorWallSchema.parse(wall), {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to build contributors wall",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
