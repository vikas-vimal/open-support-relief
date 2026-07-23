import { z } from "zod";

/**
 * The list of active sites, for the multi-site picker.
 *
 * Coarse public fields ONLY — `areaLabel` is the same neighbourhood-level string
 * the board exposes, never a drop-point address. The picker is the one place the
 * app admits more than one site exists; until a second one does, it stays hidden.
 */
export const siteListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  areaLabel: z.string().min(1),
});

export type SiteListItem = z.infer<typeof siteListItemSchema>;

export const siteListResponseSchema = z.object({
  sites: z.array(siteListItemSchema),
});
