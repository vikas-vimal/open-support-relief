import { z } from "zod";

/**
 * The momentum ticker — aggregate counts of VERIFIED airdrops.
 *
 * All-time and a rolling 24h window (not calendar "today", to sidestep timezone
 * ambiguity on a UTC database). Verified only, so the ticker reflects
 * moderator-confirmed delivery, never unverified claims.
 */
export const pulseSchema = z.object({
  itemsAllTime: z.number().int().nonnegative(),
  itemsLast24h: z.number().int().nonnegative(),
  airdropsAllTime: z.number().int().nonnegative(),
});

export type Pulse = z.infer<typeof pulseSchema>;
