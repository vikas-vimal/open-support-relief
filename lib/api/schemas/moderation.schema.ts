import { z } from "zod";

import { DISPUTE_REASON } from "@/lib/domain/airdrop.constants";

/** One claim as the moderator sees it — in the queue or a search result. */
export const pendingContributionSchema = z.object({
  id: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  qtyClaimed: z.number().int().positive(),
  platform: z.string().min(1),
  platformOther: z.string().nullable(),
  /** Parcel matching code — the moderator's search + reconciliation key. */
  receiverCode: z.string().nullable(),
  state: z.enum(["PENDING", "VERIFIED", "REJECTED", "DISPUTED"]),
  reviewReason: z.string().nullable(),
  qtyReceived: z.number().int().nonnegative().nullable(),
  createdAt: z.iso.datetime(),
  /** When the current decision was taken — drives the undo window. */
  reviewedAt: z.iso.datetime().nullable(),
  contributorIsAnonymous: z.boolean(),
  /** Short-lived signed URLs for the proof screenshots (may be empty). */
  proofUrls: z.array(z.string().url()),
});

export const moderationQueueResponseSchema = z.object({
  contributions: z.array(pendingContributionSchema),
});

export type PendingContribution = z.infer<typeof pendingContributionSchema>;

/**
 * A moderator decision. VERIFY keeps the count; REJECT restores it fully;
 * DISPUTE restores it (minus what actually arrived, for Missing-qty) and records
 * a reason shown to the supporter; UNDO reverts a recent decision to pending.
 */
export const reviewActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("VERIFY") }),
  z.object({ action: z.literal("REJECT") }),
  z
    .object({
      action: z.literal("DISPUTE"),
      reason: z.enum(DISPUTE_REASON),
      qtyReceived: z.number().int().nonnegative().optional(),
      note: z.string().trim().max(280).optional(),
    })
    .refine(
      (d) =>
        d.reason === "MISSING_QTY"
          ? d.qtyReceived !== undefined
          : d.qtyReceived === undefined,
      { path: ["qtyReceived"], message: "Received quantity applies only to Missing quantity" },
    ),
  z.object({ action: z.literal("UNDO") }),
]);

export type ReviewAction = z.infer<typeof reviewActionSchema>;

export const reviewResultSchema = z.object({
  contributionId: z.string().min(1),
  state: z.enum(["PENDING", "VERIFIED", "REJECTED", "DISPUTED"]),
  needId: z.string().min(1),
  qtyFulfilled: z.number().int().nonnegative(),
  shortfall: z.number().int().nonnegative(),
  /** When this decision was taken (null after an undo) — drives the undo window. */
  reviewedAt: z.iso.datetime().nullable(),
});

export type ReviewResult = z.infer<typeof reviewResultSchema>;
