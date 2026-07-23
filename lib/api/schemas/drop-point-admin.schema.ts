import { z } from "zod";

/**
 * Drop-point management schemas.
 *
 * These carry the gated fields (address, recipient, phone) that the public board
 * never sees. Any response built from `managedDropPointSchema` MUST be
 * VOLUNTEER-gated and sent `no-store` — it is as sensitive as the reveal payload.
 */

const label = z.string().trim().min(1).max(120);
const fullAddress = z.string().trim().min(1).max(500);
const recipientName = z.string().trim().min(1).max(120);
const recipientPhone = z.string().trim().min(3).max(30);
const instructions = z.string().trim().max(500).nullable();

/** One drop point as the editor sees it — full gated detail, for prefill. */
export const managedDropPointSchema = z.object({
  id: z.string().min(1),
  label,
  fullAddress,
  recipientName,
  recipientPhone,
  instructions,
  isActive: z.boolean(),
});

export type ManagedDropPoint = z.infer<typeof managedDropPointSchema>;

export const managedDropPointsResponseSchema = z.object({
  siteName: z.string().min(1),
  dropPoints: z.array(managedDropPointSchema),
});

/** A full-replace edit of a drop point. */
export const dropPointUpdateSchema = z.object({
  label,
  fullAddress,
  recipientName,
  recipientPhone,
  instructions: z.string().trim().max(500).nullish(),
  isActive: z.boolean(),
});

export type DropPointUpdateInput = z.infer<typeof dropPointUpdateSchema>;

/** A new drop point for the active site. */
export const dropPointCreateSchema = z.object({
  label,
  fullAddress,
  recipientName,
  recipientPhone,
  instructions: z.string().trim().max(500).nullish(),
});

export type DropPointCreateInput = z.infer<typeof dropPointCreateSchema>;
