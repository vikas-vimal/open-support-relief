import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";

export interface AuthedUser {
  id: string;
  role: string;
  isAnonymous: boolean;
}

/**
 * Resolves the current user inside a route handler, or null if unauthenticated.
 *
 * The single gate every protected endpoint calls. Reads the session cookie via
 * better-auth — never trusts a client-supplied user id.
 */
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = session.user as typeof session.user & {
    role?: string;
    isAnonymous?: boolean;
  };

  return {
    id: user.id,
    role: user.role ?? "PUBLIC",
    isAnonymous: user.isAnonymous ?? false,
  };
}

const MODERATOR_ROLES = new Set(["MODERATOR", "ADMIN"]);

/** True for MODERATOR and ADMIN — the roles allowed to review submissions. */
export function isModerator(user: AuthedUser): boolean {
  return MODERATOR_ROLES.has(user.role);
}

export function isAdmin(user: AuthedUser): boolean {
  return user.role === "ADMIN";
}
