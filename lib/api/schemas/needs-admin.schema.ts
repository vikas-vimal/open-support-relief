import { z } from "zod";

import { AIRDROP_CATEGORY, URGENCY } from "@/lib/domain/airdrop.constants";

/** One board need as the volunteer console edits it — includes inactive ones. */
export const managedNeedSchema = z.object({
  id: z.string().min(1),
  itemName: z.string().min(1),
  unit: z.string().min(1),
  category: z.string().min(1),
  qtyRequested: z.number().int().nonnegative(),
  qtyFulfilled: z.number().int().nonnegative(),
  qtyReserved: z.number().int().nonnegative(),
  urgency: z.enum(URGENCY),
  isActive: z.boolean(),
});

export type ManagedNeed = z.infer<typeof managedNeedSchema>;

/** A catalogue item, surfaced most-requested-first as an add suggestion. */
export const catalogueItemSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  category: z.string().min(1),
  requestCount: z.number().int().nonnegative(),
});

export const manageNeedsResponseSchema = z.object({
  siteName: z.string().min(1),
  needs: z.array(managedNeedSchema),
  catalogue: z.array(catalogueItemSchema),
});

/** Post a new need (or re-open a matching one) from a catalogue item. */
export const needCreateSchema = z.object({
  itemName: z.string().trim().min(2).max(80),
  unit: z.string().trim().min(1).max(20),
  category: z.enum(AIRDROP_CATEGORY),
  qtyRequested: z.number().int().positive().max(1_000_000),
  urgency: z.enum(URGENCY),
});

export type NeedCreateInput = z.infer<typeof needCreateSchema>;

/**
 * Edit a need: quantity, urgency, or active state. `isActive: false` is the
 * "we have enough — STOP" brake — it drops the item off the board and stops
 * inbound supply. At least one field must be present.
 */
export const needUpdateSchema = z
  .object({
    qtyRequested: z.number().int().nonnegative().max(1_000_000).optional(),
    urgency: z.enum(URGENCY).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (patch) =>
      patch.qtyRequested !== undefined ||
      patch.urgency !== undefined ||
      patch.isActive !== undefined,
    { message: "No fields to update" },
  );

export type NeedUpdateInput = z.infer<typeof needUpdateSchema>;
