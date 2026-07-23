import type { NextRequest } from "next/server";

import { isAuthorizedCron } from "@/lib/server/cron-auth";
import { purgeExpiredProofs } from "@/lib/server/proof-purge.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/cron/purge-proofs";

/**
 * Scheduled sweep that deletes expired proof screenshots (§7 data minimisation).
 * Runs hourly via vercel.json; gated on CRON_SECRET so it is not publicly
 * triggerable.
 */
export async function GET(request: NextRequest): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await purgeExpiredProofs(new Date());
    logger.info({
      scope: SCOPE,
      message: "Proof purge complete",
      meta: { purged: result.purged, failed: result.failed },
    });
    return Response.json(result);
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Proof purge failed",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
