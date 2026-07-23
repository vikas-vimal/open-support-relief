import { pulseSchema } from "@/lib/api/schemas/pulse.schema";
import { getPulse } from "@/lib/server/pulse.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/pulse";

/** Public momentum ticker. Short CDN cache — it only moves when a claim verifies. */
export async function GET(): Promise<Response> {
  try {
    const pulse = await getPulse();
    return Response.json(pulseSchema.parse(pulse), {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to build pulse",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
