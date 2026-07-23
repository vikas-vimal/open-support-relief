import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous } from "better-auth/plugins";

import { prisma } from "@/lib/db/prisma";

/**
 * Server-side auth. Mounted at /api/auth (see app/api/auth/[...all]/route.ts).
 *
 * Anonymous is the DEFAULT path: a supporter can reveal a drop point and pledge
 * a contribution without ever attaching a real identity to a protest-supply app.
 * Google is offered for people who want their name on the contributor wall.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  plugins: [
    anonymous({
      /*
       * When an anonymous user later signs in with Google, carry their pledged
       * contributions and item requests over to the real account before the
       * anonymous row is deleted — otherwise their history vanishes on upgrade.
       */
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await prisma.$transaction([
          prisma.contribution.updateMany({
            where: { userId: anonymousUser.user.id },
            data: { userId: newUser.user.id },
          }),
          prisma.itemRequest.updateMany({
            where: { requestedById: anonymousUser.user.id },
            data: { requestedById: newUser.user.id },
          }),
        ]);
      },
    }),
  ],

  /*
   * DATA MINIMISATION — deliberate, and verified. better-auth logs the client
   * IP and user-agent to every session by default. For a tool that coordinates
   * protest supplies, a table of "who held a session, from which IP and device,
   * when" is precisely the participation dossier the whole app avoids.
   *
   * `disableIpTracking` blanks the IP, but user-agent is still captured — so the
   * session create hook below hard-blanks BOTH at write time. Confirmed against
   * the DB: Session.ipAddress and .userAgent are empty after sign-in.
   */
  advanced: {
    ipAddress: { disableIpTracking: true },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => ({
          data: { ...session, ipAddress: "", userAgent: "" },
        }),
      },
    },
  },

  // Extra columns already on our User model; better-auth must know about them
  // so they survive its create/update paths.
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "PUBLIC", input: false },
      displayName: { type: "string", required: false, input: true },
      showOnWall: { type: "boolean", required: false, defaultValue: false, input: true },
    },
  },
});
