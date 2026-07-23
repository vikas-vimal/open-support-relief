import type {
  DropPointCreateInput,
  DropPointUpdateInput,
  ManagedDropPoint,
} from "@/lib/api/schemas/drop-point-admin.schema";
import { prisma } from "@/lib/db/prisma";

export class NoActiveSiteError extends Error {
  constructor() {
    super("No active site is configured");
    this.name = "NoActiveSiteError";
  }
}

export class DropPointNotFoundError extends Error {
  constructor() {
    super("Drop point not found for the active site");
    this.name = "DropPointNotFoundError";
  }
}

interface ManagedDropPointList {
  siteName: string;
  dropPoints: ManagedDropPoint[];
}

function toManaged(row: {
  id: string;
  label: string;
  fullAddress: string;
  recipientName: string;
  recipientPhone: string;
  instructions: string | null;
  isActive: boolean;
}): ManagedDropPoint {
  return {
    id: row.id,
    label: row.label,
    fullAddress: row.fullAddress,
    recipientName: row.recipientName,
    recipientPhone: row.recipientPhone,
    instructions: row.instructions,
    isActive: row.isActive,
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

/**
 * Every drop point for the active site — including inactive ones, so the editor
 * can re-enable them — with full gated detail for prefill. The caller MUST have
 * gated this to a volunteer and MUST send it `no-store`: this is address data.
 */
export async function listManagedDropPoints(): Promise<ManagedDropPointList> {
  const site = await activeSiteOrThrow();
  const dropPoints = await prisma.dropPoint.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "asc" },
  });
  return { siteName: site.name, dropPoints: dropPoints.map(toManaged) };
}

function normalizeInstructions(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/**
 * Updates a drop point on the active site.
 *
 * Scoped to the active site so a stale or cross-site id cannot edit an address
 * elsewhere. The audit row records who changed which drop point — never the
 * address itself, exactly as the reveal audit never stores it.
 */
export async function updateDropPoint(
  actorId: string,
  dropPointId: string,
  input: DropPointUpdateInput,
): Promise<ManagedDropPoint> {
  const site = await activeSiteOrThrow();

  const existing = await prisma.dropPoint.findFirst({
    where: { id: dropPointId, siteId: site.id },
    select: { id: true },
  });
  if (!existing) throw new DropPointNotFoundError();

  const updated = await prisma.dropPoint.update({
    where: { id: dropPointId },
    data: {
      label: input.label,
      fullAddress: input.fullAddress,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      instructions: normalizeInstructions(input.instructions),
      isActive: input.isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "DROP_POINT_UPDATED",
      targetType: "DropPoint",
      targetId: dropPointId,
    },
  });

  return toManaged(updated);
}

/** Creates a drop point on the active site. Audit-logged; address never stored in meta. */
export async function createDropPoint(
  actorId: string,
  input: DropPointCreateInput,
): Promise<ManagedDropPoint> {
  const site = await activeSiteOrThrow();

  const created = await prisma.dropPoint.create({
    data: {
      siteId: site.id,
      label: input.label,
      fullAddress: input.fullAddress,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      instructions: normalizeInstructions(input.instructions),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "DROP_POINT_CREATED",
      targetType: "DropPoint",
      targetId: created.id,
    },
  });

  return toManaged(created);
}
