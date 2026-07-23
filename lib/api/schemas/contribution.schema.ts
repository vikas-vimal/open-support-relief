import { z } from "zod";

import { FULFILMENT_PLATFORM } from "@/lib/domain/airdrop.constants";

/**
 * Contribution claim — a supporter marking that they have ordered X of an item.
 *
 * The claim increments the board counter immediately (as PENDING), so its
 * integrity is the product. The `Idempotency-Key` header (not a body field) is
 * what makes an offline retry safe: replaying the same key is a no-op, never a
 * double count.
 */
export const contributionRequestSchema = z
  .object({
    needId: z.string().min(1),
    qty: z.number().int().positive().max(100_000),
    platform: z.enum(FULFILMENT_PLATFORM),
    /** Free-text vendor name, required when platform is OTHER, forbidden otherwise. */
    platformOther: z.string().trim().min(1).max(40).optional(),
    orderRef: z.string().max(120).optional(),
    /** Opt-in to appear on the contributor wall; default anonymous. */
    showName: z.boolean().default(false),
    /**
     * Storage key of an already-uploaded proof screenshot. Must sit under this
     * user's own prefix — the server rejects any other path so a claim cannot
     * attach someone else's (or an arbitrary) object.
     */
    proofStoragePath: z.string().min(1).max(256).optional(),
  })
  .refine(
    (data) => (data.platform === "OTHER" ? Boolean(data.platformOther) : true),
    { path: ["platformOther"], message: "Tell us which app or shop you used" },
  )
  .refine(
    (data) => (data.platform !== "OTHER" ? !data.platformOther : true),
    { path: ["platformOther"], message: "Custom name only applies to Other" },
  );

export type ContributionRequest = z.infer<typeof contributionRequestSchema>;

export const contributionResponseSchema = z.object({
  contributionId: z.string().min(1),
  needId: z.string().min(1),
  state: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
  /** Updated board figures so the client can reconcile without a refetch. */
  qtyFulfilled: z.number().int().nonnegative(),
  qtyReserved: z.number().int().nonnegative(),
  shortfall: z.number().int().nonnegative(),
  /** True when this was a replay of an already-recorded claim (no double count). */
  deduplicated: z.boolean(),
});

export type ContributionResponse = z.infer<typeof contributionResponseSchema>;
