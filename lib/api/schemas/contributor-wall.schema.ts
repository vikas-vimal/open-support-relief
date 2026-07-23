import { z } from "zod";

/**
 * The public contributors wall.
 *
 * Only supporters who opted in (`showOnWall` + a display name) are named; every
 * other verified contributor is folded into the anonymous aggregate, so the wall
 * can never expose someone who did not choose to appear. Only VERIFIED airdrops
 * count — a pending or rejected claim never reaches the wall.
 */
export const contributorLeaderSchema = z.object({
  displayName: z.string().min(1),
  verifiedQty: z.number().int().positive(),
  verifiedCount: z.number().int().positive(),
});

export type ContributorLeader = z.infer<typeof contributorLeaderSchema>;

export const contributorWallSchema = z.object({
  leaders: z.array(contributorLeaderSchema),
  /** Verified contributors who did not opt in to being named. */
  anonymousSupporterCount: z.number().int().nonnegative(),
  /** Total verified quantity from those anonymous supporters. */
  anonymousQty: z.number().int().nonnegative(),
});

export type ContributorWall = z.infer<typeof contributorWallSchema>;
