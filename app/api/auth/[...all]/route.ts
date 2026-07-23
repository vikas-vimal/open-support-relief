import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";

/**
 * Catch-all better-auth handler: sign-in, sign-out, session, OAuth callbacks
 * (/api/auth/callback/google), and anonymous sign-in all route through here.
 */
export const { GET, POST } = toNextJsHandler(auth.handler);
