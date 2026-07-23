import { z } from "zod";

/**
 * An existing board need that looks like a duplicate of a pending proposal.
 *
 * Surfaced with the request so a moderator can fold the proposal's quantity into
 * a need that already exists rather than creating a second row for the same
 * thing — the common, and most useful, outcome for a near-duplicate.
 */
export const mergeCandidateSchema = z.object({
  needId: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  qtyRequested: z.number().int().nonnegative(),
});

export type MergeCandidate = z.infer<typeof mergeCandidateSchema>;

/** One public item proposal as the moderator queue shows it. */
export const pendingItemRequestSchema = z.object({
  id: z.string().min(1),
  proposedName: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  qtyRequested: z.number().int().positive(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
  requesterIsAnonymous: z.boolean(),
  mergeCandidates: z.array(mergeCandidateSchema),
});

export type PendingItemRequest = z.infer<typeof pendingItemRequestSchema>;

export const itemRequestQueueResponseSchema = z.object({
  requests: z.array(pendingItemRequestSchema),
});

/**
 * A moderator's decision on a proposal.
 *
 * APPROVE turns it into a new board need; MERGE folds its quantity into an
 * existing need (`targetNeedId` required); REJECT discards it. Discriminated so
 * `targetNeedId` is only ever present — and required — for a merge.
 */
export const itemRequestDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE") }),
  z.object({ decision: z.literal("REJECT") }),
  z.object({
    decision: z.literal("MERGE"),
    targetNeedId: z.string().min(1),
  }),
]);

export type ItemRequestDecision = z.infer<typeof itemRequestDecisionSchema>;

export const itemRequestReviewResultSchema = z.object({
  id: z.string().min(1),
  state: z.enum(["APPROVED", "REJECTED", "MERGED"]),
  /** The need created (APPROVE) or folded into (MERGE); null for REJECT. */
  needId: z.string().min(1).nullable(),
});

export type ItemRequestReviewResult = z.infer<
  typeof itemRequestReviewResultSchema
>;
