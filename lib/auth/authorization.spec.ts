import { describe, expect, it } from "vitest";

import { isAdmin, isModerator, isVolunteer, type AuthedUser } from "./roles";

/**
 * The authorization contract for every /api/* route, in one table.
 *
 * Prisma connects as a privileged role, so RLS is NOT the guard — each handler
 * authorises explicitly with exactly one of these three helpers (or a plain
 * session check). Getting the role→capability mapping wrong is the
 * highest-severity bug surface in the app: it is how an address leaks or a
 * counter is tampered with. This asserts the mapping directly, and lists which
 * routes lean on each rung so a new route with the wrong guard stands out.
 */

const ROLES = ["PUBLIC", "VOLUNTEER", "MODERATOR", "ADMIN"] as const;
type Role = (typeof ROLES)[number];

function userWith(role: Role): AuthedUser {
  return { id: `u-${role}`, role, isAnonymous: role === "PUBLIC" };
}

/** guard → the set of roles it must admit. */
const MATRIX: Record<
  "isVolunteer" | "isModerator" | "isAdmin",
  { guard: (u: AuthedUser) => boolean; allow: readonly Role[]; routes: string }
> = {
  isVolunteer: {
    guard: isVolunteer,
    allow: ["VOLUNTEER", "MODERATOR", "ADMIN"],
    routes: "POST/PATCH /api/needs, /api/needs/manage, /api/drop-points*",
  },
  isModerator: {
    guard: isModerator,
    allow: ["MODERATOR", "ADMIN"],
    routes: "/api/moderation/contributions*, /api/moderation/item-requests*",
  },
  isAdmin: {
    guard: isAdmin,
    allow: ["ADMIN"],
    routes: "/api/admin/sites/:id/freeze",
  },
};

describe.each(Object.entries(MATRIX))(
  "%s (%o)",
  (_name, { guard, allow }) => {
    it.each(ROLES)("role %s", (role) => {
      expect(guard(userWith(role))).toBe(allow.includes(role));
    });
  },
);

describe("privilege ordering", () => {
  it("every moderator is a volunteer, every admin is a moderator", () => {
    const mod = userWith("MODERATOR");
    const admin = userWith("ADMIN");
    expect(isVolunteer(mod)).toBe(true);
    expect(isVolunteer(admin)).toBe(true);
    expect(isModerator(admin)).toBe(true);
  });

  it("a volunteer is never a moderator or admin", () => {
    const vol = userWith("VOLUNTEER");
    expect(isModerator(vol)).toBe(false);
    expect(isAdmin(vol)).toBe(false);
  });

  it("an unknown role is treated as unprivileged", () => {
    const stranger: AuthedUser = { id: "x", role: "WHATEVER", isAnonymous: false };
    expect(isVolunteer(stranger)).toBe(false);
    expect(isModerator(stranger)).toBe(false);
    expect(isAdmin(stranger)).toBe(false);
  });
});
