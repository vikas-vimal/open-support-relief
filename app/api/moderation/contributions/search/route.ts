import type { NextRequest } from "next/server";

import { contributionSearchSchema } from "@/lib/api/schemas/moderation-search.schema";
import { moderationQueueResponseSchema } from "@/lib/api/schemas/moderation.schema";
import { getAuthedUser, isModerator } from "@/lib/auth/session";
import { searchContributions } from "@/lib/server/moderation-search.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "GET /api/moderation/contributions/search";

const FIELDS = [
  "supporterName",
  "itemName",
  "receiverCode",
  "qty",
  "platform",
  "state",
  "dateFrom",
  "dateTo",
] as const;

/** Advanced contribution search — MODERATOR/ADMIN only, never cached. */
export async function GET(request: NextRequest): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) return Response.json({ error: "Sign in" }, { status: 401 });
  if (!isModerator(user)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  // Only forward non-empty params, so coercion never sees a blank string.
  const raw: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = request.nextUrl.searchParams.get(field);
    if (value !== null && value.trim() !== "") raw[field] = value;
  }

  const parsed = contributionSearchSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid search" }, { status: 400 });
  }

  try {
    const contributions = await searchContributions(parsed.data);
    return Response.json(
      moderationQueueResponseSchema.parse({ contributions }),
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Contribution search failed",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
