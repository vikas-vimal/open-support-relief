import type { NextRequest } from "next/server";

import {
  dropPointCreateSchema,
  managedDropPointSchema,
  managedDropPointsResponseSchema,
} from "@/lib/api/schemas/drop-point-admin.schema";
import { getAuthedUser, isVolunteer } from "@/lib/auth/session";
import {
  createDropPoint,
  listManagedDropPoints,
  NoActiveSiteError,
} from "@/lib/server/drop-point-admin.service";
import { logger } from "@/lib/server/logger";

const LIST_SCOPE = "GET /api/drop-points";
const CREATE_SCOPE = "POST /api/drop-points";

/** Never let an intermediary cache address data. */
const NO_STORE = { "Cache-Control": "no-store, private" } as const;

/** Drop points for the active site, WITH gated detail — VOLUNTEER+ only. */
export async function GET(): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isVolunteer(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const result = await listManagedDropPoints();
    return Response.json(managedDropPointsResponseSchema.parse(result), {
      headers: NO_STORE,
    });
  } catch (error) {
    if (error instanceof NoActiveSiteError) {
      return Response.json({ error: "No active site" }, { status: 404 });
    }
    logger.error({
      scope: LIST_SCOPE,
      message: "Failed to list managed drop points",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

/** Create a drop point on the active site — VOLUNTEER+ only. */
export async function POST(request: NextRequest): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isVolunteer(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const parsed = dropPointCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Invalid drop point" }, { status: 400 });
  }

  try {
    const created = await createDropPoint(user.id, parsed.data);
    return Response.json(managedDropPointSchema.parse(created), {
      status: 201,
      headers: NO_STORE,
    });
  } catch (error) {
    if (error instanceof NoActiveSiteError) {
      return Response.json({ error: "No active site" }, { status: 404 });
    }
    logger.error({
      scope: CREATE_SCOPE,
      message: "Failed to create drop point",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
