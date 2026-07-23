import type { NextRequest } from "next/server";

import {
  dropPointUpdateSchema,
  managedDropPointSchema,
} from "@/lib/api/schemas/drop-point-admin.schema";
import { getAuthedUser, isVolunteer } from "@/lib/auth/session";
import {
  DropPointNotFoundError,
  NoActiveSiteError,
  updateDropPoint,
} from "@/lib/server/drop-point-admin.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "PATCH /api/drop-points/:id";

/** Edit a drop point on the active site — VOLUNTEER+ only. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isVolunteer(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = dropPointUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Invalid drop point" }, { status: 400 });
  }

  try {
    const updated = await updateDropPoint(user.id, id, parsed.data);
    return Response.json(managedDropPointSchema.parse(updated), {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    if (error instanceof DropPointNotFoundError) {
      return Response.json({ error: "Drop point not found" }, { status: 404 });
    }
    if (error instanceof NoActiveSiteError) {
      return Response.json({ error: "No active site" }, { status: 404 });
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to update drop point",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
