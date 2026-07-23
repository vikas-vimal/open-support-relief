import { getAuthedUser } from "@/lib/auth/session";
import { deleteAccount } from "@/lib/server/account.service";
import { logger } from "@/lib/server/logger";

const SCOPE = "POST /api/account/delete";

/**
 * Erases the caller's account and all their data. POST (never GET) because it is
 * irreversible and side-effectful. Session-gated: a user can only delete
 * themselves — the id comes from the session cookie, never the client.
 */
export async function POST(): Promise<Response> {
  const user = await getAuthedUser();
  if (!user) {
    return Response.json({ error: "Sign in" }, { status: 401 });
  }

  try {
    await deleteAccount(user.id);
    // The session rows are gone with the user, so the cookie is now inert; the
    // client redirects and the next request simply has no session.
    return Response.json(
      { deleted: true },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    logger.error({
      scope: SCOPE,
      message: "Failed to delete account",
      meta: { reason: error instanceof Error ? error.message : "unknown" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
