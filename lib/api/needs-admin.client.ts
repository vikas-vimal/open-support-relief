import {
  managedNeedSchema,
  manageNeedsResponseSchema,
  type ManagedNeed,
  type NeedCreateInput,
  type NeedUpdateInput,
} from "@/lib/api/schemas/needs-admin.schema";

export class NeedsAdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NeedsAdminError";
  }
}

export interface ManagedNeedsData {
  siteName: string;
  needs: ManagedNeed[];
  catalogue: {
    name: string;
    unit: string;
    category: string;
    requestCount: number;
  }[];
}

export async function fetchManagedNeeds(): Promise<ManagedNeedsData> {
  const response = await fetch("/api/needs/manage", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new NeedsAdminError(
      response.status === 403 || response.status === 401
        ? "Volunteers only"
        : "Could not load needs",
      response.status,
    );
  }
  const parsed = manageNeedsResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new NeedsAdminError("Unexpected response", 500);
  return parsed.data;
}

export async function createNeed(input: NeedCreateInput): Promise<ManagedNeed> {
  const response = await fetch("/api/needs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new NeedsAdminError("Create failed", response.status);
  const parsed = managedNeedSchema.safeParse(await response.json());
  if (!parsed.success) throw new NeedsAdminError("Unexpected response", 500);
  return parsed.data;
}

export async function updateNeed(
  id: string,
  patch: NeedUpdateInput,
): Promise<ManagedNeed> {
  const response = await fetch(`/api/needs/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new NeedsAdminError("Save failed", response.status);
  const parsed = managedNeedSchema.safeParse(await response.json());
  if (!parsed.success) throw new NeedsAdminError("Unexpected response", 500);
  return parsed.data;
}
