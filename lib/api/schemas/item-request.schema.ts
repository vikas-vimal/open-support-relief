import { z } from "zod";

import { AIRDROP_CATEGORY } from "@/lib/domain/airdrop.constants";

/**
 * A publicly proposed item, held for moderator review.
 *
 * Free text from the public, so it is validated tightly and never rendered on
 * the public board until a moderator approves it.
 */
export const itemRequestSchema = z.object({
  proposedName: z.string().trim().min(2).max(80),
  category: z.enum(AIRDROP_CATEGORY),
  qtyRequested: z.number().int().positive().max(100_000),
  unit: z.string().trim().min(1).max(20),
  note: z.string().trim().max(280).optional(),
});

export type ItemRequestInput = z.infer<typeof itemRequestSchema>;

export const itemRequestResponseSchema = z.object({
  id: z.string().min(1),
  state: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "MERGED"]),
});

export type ItemRequestResponse = z.infer<typeof itemRequestResponseSchema>;
