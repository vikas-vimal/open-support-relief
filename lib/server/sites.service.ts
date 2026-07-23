import type { SiteListItem } from "@/lib/api/schemas/sites.schema";
import { prisma } from "@/lib/db/prisma";

/**
 * Active sites, oldest first, with coarse public fields only.
 *
 * Never selects a drop-point address — this feeds the public picker, so it must
 * carry no more than the board already exposes.
 */
export async function listActiveSites(): Promise<SiteListItem[]> {
  const sites = await prisma.site.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, areaLabel: true },
  });
  return sites;
}
