import { prisma } from "@/lib/db/prisma";

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
}

/**
 * Fixed-window rate limiter backed by the RateLimit table — no extra infra.
 *
 * The window is bucketed to the hour so the row key is stable and the whole
 * check-and-increment is one atomic upsert. Not a sliding window, but for
 * "10 address reveals an hour" the fixed bucket is the right amount of machine.
 *
 * Deliberately fails OPEN: if the limiter query errors, the request proceeds.
 * A hard drop-point reveal being blocked by a transient DB hiccup is worse than
 * an occasional over-limit reveal — and reveals are already audited.
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowStart = new Date(
    Math.floor(Date.now() / windowMs) * windowMs,
  );

  try {
    const row = await prisma.rateLimit.upsert({
      where: { userId_action_windowStart: { userId, action, windowStart } },
      create: { userId, action, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });

    return {
      allowed: row.count <= limit,
      remaining: Math.max(0, limit - row.count),
    };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
