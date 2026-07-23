import { z } from "zod";

/**
 * Intent lock — a soft, expiring reservation of quantity.
 *
 * Created when a supporter commits to sending an item, it holds that quantity
 * off the board's shortfall for 15 minutes so ten people don't each order the
 * same 150 raincoats. It is advisory: it never blocks anyone, it just makes the
 * "X ordering now" count real and dampens oversupply.
 */
export const intentRequestSchema = z.object({
  needId: z.string().min(1),
  qty: z.number().int().positive().max(100_000),
});

export type IntentRequest = z.infer<typeof intentRequestSchema>;

export const intentResponseSchema = z.object({
  needId: z.string().min(1),
  qtyReserved: z.number().int().nonnegative(),
  shortfall: z.number().int().nonnegative(),
  expiresAt: z.iso.datetime(),
});

export type IntentResponse = z.infer<typeof intentResponseSchema>;
