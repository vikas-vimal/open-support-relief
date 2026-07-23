import type {
  ManagedNeed,
  NeedCreateInput,
  NeedUpdateInput,
} from "@/lib/api/schemas/needs-admin.schema";
import type { Urgency } from "@/lib/domain/airdrop.constants";
import { normalizeItemName } from "@/lib/domain/item-match.util";
import { prisma } from "@/lib/db/prisma";

export class NoActiveSiteError extends Error {
  constructor() {
    super("No active site is configured");
    this.name = "NoActiveSiteError";
  }
}

export class NeedNotFoundError extends Error {
  constructor() {
    super("Need not found for the active site");
    this.name = "NeedNotFoundError";
  }
}

const CATALOGUE_LIMIT = 60;

interface NeedRow {
  id: string;
  qtyRequested: number;
  qtyFulfilled: number;
  qtyReserved: number;
  urgency: string;
  isActive: boolean;
  item: { name: string; unit: string; category: string };
}

function toManaged(need: NeedRow): ManagedNeed {
  return {
    id: need.id,
    itemName: need.item.name,
    unit: need.item.unit,
    category: need.item.category,
    qtyRequested: need.qtyRequested,
    qtyFulfilled: need.qtyFulfilled,
    qtyReserved: need.qtyReserved,
    urgency: need.urgency as Urgency,
    isActive: need.isActive,
  };
}

async function activeSiteOrThrow(): Promise<{ id: string; name: string }> {
  const site = await prisma.site.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  if (!site) throw new NoActiveSiteError();
  return site;
}

interface ManagedNeedsList {
  siteName: string;
  needs: ManagedNeed[];
  catalogue: {
    name: string;
    unit: string;
    category: string;
    requestCount: number;
  }[];
}

/**
 * The active site's needs (active AND inactive, so a stopped item can be
 * re-opened) plus the catalogue most-requested-first, for the add picker.
 */
export async function listManagedNeeds(): Promise<ManagedNeedsList> {
  const site = await activeSiteOrThrow();
  const [needs, catalogue] = await Promise.all([
    prisma.need.findMany({
      where: { siteId: site.id },
      include: { item: true },
      orderBy: [{ isActive: "desc" }, { urgency: "desc" }, { createdAt: "asc" }],
    }),
    prisma.supplyItem.findMany({
      orderBy: { requestCount: "desc" },
      take: CATALOGUE_LIMIT,
      select: { name: true, unit: true, category: true, requestCount: true },
    }),
  ]);

  return { siteName: site.name, needs: needs.map(toManaged), catalogue };
}

/**
 * Posts a new need for the active site, or re-opens the matching one.
 *
 * Upserts the catalogue `SupplyItem` on its normalized name (so the board never
 * fragments "water"/"Water bottles"), then either creates the `(site,item)` need
 * or, if one already exists — including a stopped one — updates its quantity and
 * urgency and re-activates it, rather than breaking the uniqueness constraint.
 */
export async function createNeed(
  actorId: string,
  input: NeedCreateInput,
): Promise<ManagedNeed> {
  const site = await activeSiteOrThrow();

  return prisma.$transaction(async (tx) => {
    const normalized = normalizeItemName(input.itemName);
    const item = await tx.supplyItem.upsert({
      where: { normalized },
      create: {
        name: input.itemName,
        normalized,
        unit: input.unit,
        category: input.category,
        requestCount: 1,
      },
      update: { requestCount: { increment: 1 } },
    });

    const existing = await tx.need.findUnique({
      where: { siteId_itemId: { siteId: site.id, itemId: item.id } },
    });
    const need = existing
      ? await tx.need.update({
          where: { id: existing.id },
          data: {
            qtyRequested: input.qtyRequested,
            urgency: input.urgency,
            isActive: true,
          },
          include: { item: true },
        })
      : await tx.need.create({
          data: {
            siteId: site.id,
            itemId: item.id,
            qtyRequested: input.qtyRequested,
            urgency: input.urgency,
          },
          include: { item: true },
        });

    await tx.needEvent.create({
      data: {
        needId: need.id,
        actorId,
        delta: input.qtyRequested,
        reason: existing ? "NEED_REOPENED" : "NEED_CREATED",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: existing ? "NEED_REOPENED" : "NEED_CREATED",
        targetType: "Need",
        targetId: need.id,
      },
    });

    return toManaged(need);
  });
}

/**
 * Edits a need on the active site — quantity, urgency, and the STOP/re-open flag.
 *
 * Site-scoped so a stale id cannot touch another site's board. Counters
 * (`qtyFulfilled`/`qtyReserved`) are never modified here — only what volunteers
 * own — so changing the target can't corrupt what has already been delivered.
 */
export async function updateNeed(
  actorId: string,
  needId: string,
  patch: NeedUpdateInput,
): Promise<ManagedNeed> {
  const site = await activeSiteOrThrow();

  return prisma.$transaction(async (tx) => {
    const current = await tx.need.findFirst({
      where: { id: needId, siteId: site.id },
    });
    if (!current) throw new NeedNotFoundError();

    const need = await tx.need.update({
      where: { id: needId },
      data: {
        ...(patch.qtyRequested !== undefined
          ? { qtyRequested: patch.qtyRequested }
          : {}),
        ...(patch.urgency !== undefined ? { urgency: patch.urgency } : {}),
        ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      },
      include: { item: true },
    });

    if (
      patch.qtyRequested !== undefined &&
      patch.qtyRequested !== current.qtyRequested
    ) {
      await tx.needEvent.create({
        data: {
          needId,
          actorId,
          delta: patch.qtyRequested - current.qtyRequested,
          reason: "NEED_QTY_ADJUSTED",
        },
      });
    }
    if (patch.isActive !== undefined && patch.isActive !== current.isActive) {
      await tx.needEvent.create({
        data: {
          needId,
          actorId,
          delta: 0,
          reason: patch.isActive ? "NEED_REOPENED" : "NEED_STOPPED",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId,
        action: "NEED_UPDATED",
        targetType: "Need",
        targetId: needId,
      },
    });

    return toManaged(need);
  });
}
