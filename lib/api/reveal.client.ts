import {
  revealResponseSchema,
  type RevealResponse,
} from "@/lib/api/schemas/reveal.schema";

export class RevealError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RevealError";
  }
}

/**
 * Calls the login-gated reveal endpoint for one drop point.
 *
 * The returned address is deliberately NOT run through React Query or any cache
 * — callers hold it in transient component state only, so it never touches disk.
 */
export async function revealDropPoint(
  dropPointId: string,
): Promise<RevealResponse> {
  const response = await fetch(
    `/api/drop-points/${encodeURIComponent(dropPointId)}/reveal`,
    { method: "POST", headers: { accept: "application/json" } },
  );

  if (!response.ok) {
    const message =
      response.status === 401
        ? "Sign in to see the drop point"
        : response.status === 429
          ? "Too many reveals — please wait a while"
          : response.status === 403
            ? "This site is temporarily locked"
            : "Could not load the drop point";
    throw new RevealError(message, response.status);
  }

  const parsed = revealResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new RevealError("Unexpected drop-point response", 500);
  }
  return parsed.data;
}
