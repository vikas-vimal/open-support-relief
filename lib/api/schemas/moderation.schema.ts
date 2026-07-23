import { z } from "zod";

/** One pending claim as the moderator queue shows it. */
export const pendingContributionSchema = z.object({
  id: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  qtyClaimed: z.number().int().positive(),
  platform: z.string().min(1),
  platformOther: z.string().nullable(),
  createdAt: z.iso.datetime(),
  contributorIsAnonymous: z.boolean(),
  /** Short-lived signed URLs for the proof screenshots (may be empty). */
  proofUrls: z.array(z.string().url()),
});

export const moderationQueueResponseSchema = z.object({
  contributions: z.array(pendingContributionSchema),
});

export type PendingContribution = z.infer<typeof pendingContributionSchema>;

/** verify keeps the count; reject removes it and restores the counter. */
export const reviewActionSchema = z.object({
  action: z.enum(["VERIFY", "REJECT"]),
});

export const reviewResultSchema = z.object({
  contributionId: z.string().min(1),
  state: z.enum(["VERIFIED", "REJECTED"]),
  needId: z.string().min(1),
  qtyFulfilled: z.number().int().nonnegative(),
  shortfall: z.number().int().nonnegative(),
});

export type ReviewResult = z.infer<typeof reviewResultSchema>;
