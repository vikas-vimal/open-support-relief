import { manageNeedsResponseSchema } from "@/lib/api/schemas/needs-admin.schema";
import { getAuthedUser, isVolunteer } from "@/lib/auth/session";
import {
  listManagedNeeds,
  NoActiveSiteError,
} from "@/lib/server/needs-admin.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/needs/manage";

/** Editable board for the volunteer console — VOLUNTEER+ only, no address. */
export async function GET(): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isVolunteer(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const result = await listManagedNeeds();
    return Response.json(manageNeedsResponseSchema.parse(result), {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    if (error instanceof NoActiveSiteError) {
      return Response.json({ error: "No active site" }, { status: 404 });
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to list managed needs",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
