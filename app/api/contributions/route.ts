import type { NextRequest } from "next/server";

import {
  contributionRequestSchema,
  contributionResponseSchema,
} from "@/lib/api/schemas/contribution.schema";
import { getAuthedUser } from "@/lib/auth/session";
import {
  claimContribution,
  ForbiddenProofError,
  NeedNotFoundError,
  OversellError,
  ReceiverCodeTakenError,
} from "@/lib/server/contribution.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "POST /api/contributions";

/**
 * Records a contribution claim and advances the board counter.
 *
 * Requires an `Idempotency-Key` header — without it an offline retry would
 * double-count, which is the one failure this app most needs to avoid. The
 * client generates the key once per claim and reuses it across retries.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return Response.json(
      { error: "Idempotency-Key header is required" },
      { status: 400 },
    );
  }

  const parsed = contributionRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid contribution", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await claimContribution(user.id, idempotencyKey, parsed.data);
    return Response.json(contributionResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof NeedNotFoundError) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }
    if (error instanceof OversellError) {
      return Response.json(
        { error: "This item is already covered — please pick another" },
        { status: 409 },
      );
    }
    if (error instanceof ForbiddenProofError) {
      return Response.json({ error: "Invalid proof reference" }, { status: 403 });
    }
    if (error instanceof ReceiverCodeTakenError) {
      return Response.json(
        { error: "Receiver code clashed — reveal the drop point again", code: "RECEIVER_CODE_TAKEN" },
        { status: 409 },
      );
    }
    logger.error({
      scope: SCOPE,
      message: "Failed to record contribution",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
