import { z } from "zod";

import { FULFILMENT_PLATFORM } from "@/lib/domain/airdrop.constants";

/**
 * Advanced moderator search over ALL contributions (any state).
 *
 * Every field is optional and combined with AND. The receiver code is the
 * primary drop-point reconciliation key; the rest let a moderator find a claim
 * from whatever the situation gives them. Empty fields are dropped by the caller
 * before parsing, so coercion never sees a blank string.
 */
export const contributionSearchSchema = z.object({
  supporterName: z.string().trim().min(1).max(120).optional(),
  itemName: z.string().trim().min(1).max(120).optional(),
  receiverCode: z.string().trim().min(1).max(20).optional(),
  qty: z.coerce.number().int().positive().max(1_000_000).optional(),
  platform: z.enum(FULFILMENT_PLATFORM).optional(),
  state: z.enum(["PENDING", "VERIFIED", "REJECTED", "DISPUTED"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ContributionSearch = z.infer<typeof contributionSearchSchema>;
