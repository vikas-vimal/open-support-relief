import { siteListResponseSchema } from "@/lib/api/schemas/sites.schema";
import { listActiveSites } from "@/lib/server/sites.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/sites";

/** Public list of active sites for the picker. Coarse fields only, no address. */
export async function GET(): Promise<Response> {
  try {
    const sites = await listActiveSites();
    return Response.json(siteListResponseSchema.parse({ sites }), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to list sites",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
