import type { NextRequest } from "next/server";

import { revealResponseSchema } from "@/lib/api/schemas/reveal.schema";
import { getAuthedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/server/logger";
import { checkRateLimit } from "@/lib/server/rate-limit";

const SCOPE = "POST /api/drop-points/:id/reveal";
const REVEAL_ACTION = "DROP_POINT_REVEAL";
const REVEAL_LIMIT = 10;
const REVEAL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Returns a drop point's address and volunteer contact — the most sensitive
 * response in the app. Every guard here is load-bearing:
 *
 *   1. auth        — no anonymous scraping; a session (even anonymous) is required
 *   2. isFrozen    — the site kill switch blacks out every address instantly
 *   3. rate limit  — 10/hour/user, so a single account can't harvest the roster
 *   4. audit       — every successful reveal is logged with actor + target
 *
 * The address is returned but never cached: the response is not persisted by
 * React Query (query-keys allow-list) nor the service worker (sw.js allow-list),
 * so it cannot survive on disk past sign-out or the kill switch.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: dropPointId } = await params;

  const user = await getAuthedUser();
  if (!user) {
    return Response.json(
      { error: "Sign in to see the drop point" },
      { status: 401 },
    );
  }

  const dropPoint = await prisma.dropPoint.findUnique({
    where: { id: dropPointId },
    include: { site: { select: { isFrozen: true, isActive: true } } },
  });

  if (!dropPoint || !dropPoint.isActive || !dropPoint.site.isActive) {
    return Response.json({ error: "Drop point not found" }, { status: 404 });
  }

  // Kill switch — takes precedence over everything, including a valid session.
  if (dropPoint.site.isFrozen) {
    return Response.json(
      { error: "This site is temporarily locked" },
      { status: 403 },
    );
  }

  const limit = await checkRateLimit(
    user.id,
    REVEAL_ACTION,
    REVEAL_LIMIT,
    REVEAL_WINDOW_MS,
  );
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many reveals — please wait a while" },
      { status: 429 },
    );
  }

  // Audit BEFORE returning, so a reveal is recorded even if the client drops the
  // response. Never store the address in the audit meta — only who/what/when.
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: REVEAL_ACTION,
      targetType: "DropPoint",
      targetId: dropPoint.id,
      meta: { anonymous: user.isAnonymous },
    },
  });

  logger.info({
    scope: SCOPE,
    message: "Drop point revealed",
    meta: { dropPointId: dropPoint.id, remaining: limit.remaining },
  });

  const body = revealResponseSchema.parse({
    dropPointId: dropPoint.id,
    label: dropPoint.label,
    fullAddress: dropPoint.fullAddress,
    recipientName: dropPoint.recipientName,
    recipientPhone: dropPoint.recipientPhone,
    instructions: dropPoint.instructions,
    remaining: limit.remaining,
  });

  // no-store: belt-and-braces against any intermediary caching the address.
  return Response.json(body, {
    headers: { "Cache-Control": "no-store, private" },
  });
}
