"use client";

import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

/**
 * Browser auth client. Same-origin, so no explicit baseURL is needed.
 *
 * `signIn.anonymous()` is the default path a supporter takes to reveal a drop
 * point; `signIn.social({ provider: "google" })` is the upgrade for anyone who
 * wants their name on the contributor wall.
 */
export const authClient = createAuthClient({
  plugins: [anonymousClient()],
});

export const { signIn, signOut, useSession } = authClient;
