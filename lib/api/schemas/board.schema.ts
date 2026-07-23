import { z } from "zod";

import { AIRDROP_CATEGORY, URGENCY } from "@/lib/domain/airdrop.constants";
import type { BoardSnapshot } from "@/lib/domain/airdrop.types";

/**
 * Zod contracts for the board API.
 *
 * These validate the RESPONSE the route handler emits, not just its input:
 * a schema drift between Prisma and the client is exactly the kind of bug that
 * ships silently, so the handler parses its own output before returning it.
 *
 * `satisfies z.ZodType<...>` ties each schema to the hand-written domain type,
 * so the two cannot diverge without a compile error.
 */

// Passing the `as const` objects (not a widened array) makes Zod infer the exact
// literal unions — so `category` resolves to AirdropCategory, not string, and the
// `satisfies z.ZodType<BoardSnapshot>` below actually bites.
export const needSummarySchema = z.object({
  id: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  category: z.enum(AIRDROP_CATEGORY),
  qtyRequested: z.number().int().nonnegative(),
  qtyFulfilled: z.number().int().nonnegative(),
  qtyReserved: z.number().int().nonnegative(),
  shortfall: z.number().int().nonnegative(),
  urgency: z.enum(URGENCY),
  activeContributorCount: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime(),
});

export const dropPointPublicSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const siteSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  areaLabel: z.string().min(1),
  isFrozen: z.boolean(),
  dropPoints: z.array(dropPointPublicSchema),
});

export const boardSnapshotSchema = z.object({
  site: siteSummarySchema,
  needs: z.array(needSummarySchema),
}) satisfies z.ZodType<BoardSnapshot>;

export type BoardSnapshotResponse = z.infer<typeof boardSnapshotSchema>;

/** Query params for `GET /api/needs`. */
export const boardQuerySchema = z.object({
  siteId: z.string().min(1).optional(),
});
