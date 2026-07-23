import {
  managedDropPointSchema,
  managedDropPointsResponseSchema,
  type DropPointCreateInput,
  type DropPointUpdateInput,
  type ManagedDropPoint,
} from "@/lib/api/schemas/drop-point-admin.schema";

export class DropPointAdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DropPointAdminError";
  }
}

export interface ManagedDropPoints {
  siteName: string;
  dropPoints: ManagedDropPoint[];
}

export async function fetchManagedDropPoints(): Promise<ManagedDropPoints> {
  const response = await fetch("/api/drop-points", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new DropPointAdminError(
      response.status === 403 ? "Volunteers only" : "Could not load drop points",
      response.status,
    );
  }
  const parsed = managedDropPointsResponseSchema.safeParse(
    await response.json(),
  );
  if (!parsed.success) throw new DropPointAdminError("Unexpected response", 500);
  return parsed.data;
}

export async function updateDropPoint(
  id: string,
  input: DropPointUpdateInput,
): Promise<ManagedDropPoint> {
  const response = await fetch(`/api/drop-points/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new DropPointAdminError("Save failed", response.status);
  }
  const parsed = managedDropPointSchema.safeParse(await response.json());
  if (!parsed.success) throw new DropPointAdminError("Unexpected response", 500);
  return parsed.data;
}

export async function createDropPoint(
  input: DropPointCreateInput,
): Promise<ManagedDropPoint> {
  const response = await fetch("/api/drop-points", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new DropPointAdminError("Create failed", response.status);
  }
  const parsed = managedDropPointSchema.safeParse(await response.json());
  if (!parsed.success) throw new DropPointAdminError("Unexpected response", 500);
  return parsed.data;
}
