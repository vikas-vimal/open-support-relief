import type { NextRequest } from "next/server";

import {
  uploadSignRequestSchema,
  uploadSignResponseSchema,
} from "@/lib/api/schemas/upload.schema";
import { getAuthedUser } from "@/lib/auth/session";
import { logger } from "@/lib/server/logger";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { presignProofUpload } from "@/lib/server/storage";

const SCOPE = "POST /api/uploads/sign";
const ACTION = "UPLOAD_SIGN";
const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * Issues a short-lived presigned PUT so the browser uploads a proof screenshot
 * straight to Supabase Storage — the file never passes through our server.
 *
 * The storage key is generated server-side and namespaced by user, so a caller
 * can neither pick a path nor upload on someone else's behalf. Rate-limited so a
 * signing URL can't be farmed.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const limit = await checkRateLimit(user.id, ACTION, LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return Response.json({ error: "Too many uploads" }, { status: 429 });
  }

  const parsed = uploadSignRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Only JPEG or PNG images are accepted" },
      { status: 400 },
    );
  }

  try {
    const presigned = await presignProofUpload(user.id, parsed.data.contentType);
    return Response.json(uploadSignResponseSchema.parse(presigned));
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to presign upload",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
