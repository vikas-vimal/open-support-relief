import { z } from "zod";

/**
 * The reveal response — the ONLY payload in the app that carries a drop point's
 * address and volunteer phone. Nothing here may ever appear in the public board
 * response (see board.schema.ts) or be cached to disk (see query-keys.ts, sw.js).
 */
export const revealResponseSchema = z.object({
  dropPointId: z.string().min(1),
  label: z.string().min(1),
  fullAddress: z.string().min(1),
  recipientName: z.string().min(1),
  recipientPhone: z.string().min(1),
  instructions: z.string().nullable(),
  /**
   * The parcel matching code the supporter sets as the delivery recipient NAME,
   * so a moderator can match the physical parcel to this airdrop. Issued fresh
   * per reveal; the contribution stores exactly this value.
   */
  receiverCode: z.string().min(1),
  /** Reveals left in the current window, so the UI can warn before the cap. */
  remaining: z.number().int().nonnegative(),
});

export type RevealResponse = z.infer<typeof revealResponseSchema>;
