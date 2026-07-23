/**
 * Pure authorization logic — role → capability, and nothing else.
 *
 * Deliberately free of any Prisma/better-auth import so it can be unit-tested
 * without a database (see authorization.spec.ts). `session.ts` composes this
 * with the session reader; everything that only needs to check a role imports
 * from here (directly or via session's re-export).
 */

export interface AuthedUser {
  id: string;
  role: string;
  isAnonymous: boolean;
}

const VOLUNTEER_ROLES = new Set(["VOLUNTEER", "MODERATOR", "ADMIN"]);
const MODERATOR_ROLES = new Set(["MODERATOR", "ADMIN"]);

/**
 * True for VOLUNTEER and up — the on-site roles allowed to manage a site's
 * operational data, including drop-point addresses. Broader than `isModerator`:
 * a volunteer runs the drop but does not review submissions.
 */
export function isVolunteer(user: AuthedUser): boolean {
  return VOLUNTEER_ROLES.has(user.role);
}

/** True for MODERATOR and ADMIN — the roles allowed to review submissions. */
export function isModerator(user: AuthedUser): boolean {
  return MODERATOR_ROLES.has(user.role);
}

export function isAdmin(user: AuthedUser): boolean {
  return user.role === "ADMIN";
}
