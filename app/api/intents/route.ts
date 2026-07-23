import type { NextRequest } from "next/server";

import {
  intentRequestSchema,
  intentResponseSchema,
} from "@/lib/api/schemas/intent.schema";
import { getAuthedUser } from "@/lib/auth/session";
import {
  NeedNotFoundError,
  OversellError,
} from "@/lib/server/contribution.service";
import { placeIntent } from "@/lib/server/intent.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "POST /api/intents";

/** Places a 15-minute soft reservation so ten people don't over-order one item. */
export async function POST(request: NextRequest): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const parsed = intentRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid intent", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await placeIntent(user.id, parsed.data);
    return Response.json(intentResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof NeedNotFoundError) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }
    if (error instanceof OversellError) {
      return Response.json(
        { error: "This item is already covered" },
        { status: 409 },
      );
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to place intent",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
