import type { NextRequest } from "next/server";

import {
  itemRequestResponseSchema,
  itemRequestSchema,
} from "@/lib/api/schemas/item-request.schema";
import { getAuthedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createItemRequest } from "@/lib/server/item-request.service";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/server/logger";

const SCOPE = "POST /api/item-requests";
const ACTION = "ITEM_REQUEST";
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * Accepts a public item proposal for moderator review.
 *
 * Public free text is a spam surface, so this is both authenticated and
 * rate-limited (5/hour/user). Nothing submitted here appears on the board until
 * a moderator approves it.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const limit = await checkRateLimit(user.id, ACTION, LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many requests — please wait a while" },
      { status: 429 },
    );
  }

  const parsed = itemRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const site = await prisma.site.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!site) {
    return Response.json({ error: "No active site" }, { status: 404 });
  }

  try {
    const created = await createItemRequest(user.id, site.id, parsed.data);
    return Response.json(itemRequestResponseSchema.parse(created), {
      status: 201,
    });
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to create item request",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
