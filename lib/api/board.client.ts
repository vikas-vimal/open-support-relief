import { boardSnapshotSchema } from "@/lib/api/schemas/board.schema";
import type { BoardSnapshot } from "@/lib/domain/airdrop.types";

/** The board API failed or returned an unexpected shape. */
export class BoardFetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "BoardFetchError";
  }
}

/**
 * The board's only data-access function, and the single seam React Query calls.
 *
 * Validates the response against the same Zod schema the route handler emits, so
 * a contract drift surfaces as a caught error (→ stale-cache fallback) rather
 * than a malformed render. No mock import here — the seed fallback lives
 * server-side in the route handler, so it never ships to the client bundle.
 */
export async function fetchBoardSnapshot(
  signal?: AbortSignal,
): Promise<BoardSnapshot> {
  const response = await fetch("/api/needs", {
    signal,
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new BoardFetchError(
      `Board request failed with ${response.status}`,
      response.status,
    );
  }

  const parsed = boardSnapshotSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BoardFetchError("Board response did not match the expected shape");
  }

  return parsed.data;
}
