import type { NextRequest } from "next/server";

import { boardQuerySchema, boardSnapshotSchema } from "@/lib/api/schemas/board.schema";
import { getActiveBoard, NoActiveSiteError } from "@/lib/server/board.service";
import { rankNeeds } from "@/lib/domain/needs.util";
import { buildMockBoardSnapshot } from "@/lib/mock/needs.mock";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/needs";

/**
 * Public board for the active site. No auth, no address — coarse area label only.
 *
 * Not cached by default (route handlers aren't), which is correct: the counters
 * change constantly and the client already caches via React Query. A short
 * s-maxage could be added once a CDN is in front, but staleness here means
 * someone double-buys, so keep it live for now.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const query = boardQuerySchema.safeParse({
    siteId: request.nextUrl.searchParams.get("siteId") ?? undefined,
  });

  if (!query.success) {
    return Response.json(
      { error: "Invalid query parameters", details: query.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const board = await getActiveBoard(query.data.siteId);
    // Parse our own output — a Prisma/DTO drift must fail here, not on a phone.
    const body = boardSnapshotSchema.parse(board);
    return Response.json(body);
  } catch (error) {
    if (error instanceof NoActiveSiteError) {
      return Response.json({ error: "No active site" }, { status: 404 });
    }

    /*
     * Dev convenience only: with no live database (the password is still a
     * placeholder), fall back to seed data so the UI keeps working. In
     * production a DB failure is a real 500 — never a silent stale board that
     * hides an outage.
     */
    if (process.env.NODE_ENV !== "production") {
      logger.warn({
        scope: SCOPE,
        message: "Database unreachable — serving seed fallback (dev only)",
        meta: { reason: error instanceof Error ? error.message : "unknown" },
      });
      // Rank the fixture too, so the fallback honours the same contract the DB
      // path does (ranked output) rather than returning raw seed order.
      const fixture = buildMockBoardSnapshot(new Date());
      const seed = boardSnapshotSchema.parse({
        ...fixture,
        needs: rankNeeds(fixture.needs),
      });
      return Response.json(seed, { headers: { "X-Data-Source": "seed-fallback" } });
    }

    logger.error({
      scope: SCOPE,
      message: "Failed to build board",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
