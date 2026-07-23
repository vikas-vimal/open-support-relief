import { z } from "zod";

/** One of the caller's own past airdrops, with its verification status. */
export const myContributionSchema = z.object({
  id: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  qtyClaimed: z.number().int().positive(),
  platform: z.string().min(1),
  platformOther: z.string().nullable(),
  /** PENDING → awaiting; VERIFIED → confirmed; REJECTED → not accepted; DISPUTED → problem flagged. */
  state: z.enum(["PENDING", "VERIFIED", "REJECTED", "DISPUTED"]),
  createdAt: z.iso.datetime(),
  reviewedAt: z.iso.datetime().nullable(),
});

export const myContributionsResponseSchema = z.object({
  contributions: z.array(myContributionSchema),
});

export type MyContribution = z.infer<typeof myContributionSchema>;
