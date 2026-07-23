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
