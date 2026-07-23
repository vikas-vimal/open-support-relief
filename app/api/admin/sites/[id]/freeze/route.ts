import type { NextRequest } from "next/server";
import { z } from "zod";

import { getAuthedUser, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/server/logger";

const SCOPE = "POST /api/admin/sites/:id/freeze";
const bodySchema = z.object({ frozen: z.boolean() });

/**
 * The kill switch. Setting `frozen` true makes every drop-point reveal for the
 * site return 403 immediately — one call blacks out all addresses. ADMIN only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isAdmin(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const site = await prisma.site.update({
      where: { id },
      data: { isFrozen: parsed.data.frozen },
      select: { id: true, isFrozen: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: parsed.data.frozen ? "SITE_FREEZE" : "SITE_UNFREEZE",
        targetType: "Site",
        targetId: id,
      },
    });
    return Response.json(site);
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to toggle site freeze",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
