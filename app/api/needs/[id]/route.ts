import type { NextRequest } from "next/server";

import {
  managedNeedSchema,
  needUpdateSchema,
} from "@/lib/api/schemas/needs-admin.schema";
import { getAuthedUser, isVolunteer } from "@/lib/auth/session";
import {
  NeedNotFoundError,
  NoActiveSiteError,
  updateNeed,
} from "@/lib/server/needs-admin.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "PATCH /api/needs/:id";

/** Edit a need (qty / urgency / STOP) — VOLUNTEER/MODERATOR/ADMIN only. */
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
  const parsed = needUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Invalid update" }, { status: 400 });
  }

  try {
    const need = await updateNeed(user.id, id, parsed.data);
    return Response.json(managedNeedSchema.parse(need));
  } catch (error) {
    if (error instanceof NeedNotFoundError) {
      return Response.json({ error: "Need not found" }, { status: 404 });
    }
    if (error instanceof NoActiveSiteError) {
      return Response.json({ error: "No active site" }, { status: 404 });
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to update need",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
