import {
  contributionResponseSchema,
  type ContributionResponse,
} from "@/lib/api/schemas/contribution.schema";
import type { FulfilmentPlatform } from "@/lib/domain/airdrop.constants";
import { signIn } from "@/lib/auth/auth-client";

export interface ContributionDraft {
  needId: string;
  qty: number;
  platform: FulfilmentPlatform;
  orderRef?: string;
  showName: boolean;
  /** Storage key of an uploaded proof screenshot, if any. */
  proofStoragePath?: string;
}

export class ContributionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ContributionError";
  }
}

async function postContribution(
  draft: ContributionDraft,
  idempotencyKey: string,
): Promise<Response> {
  return fetch("/api/contributions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Stable across retries — the server treats a replay as a no-op.
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(draft),
  });
}

/**
 * Records a contribution claim.
 *
 * `idempotencyKey` is generated once by the caller and reused on every retry,
 * so a flaky connection that resends the request cannot double-count the board.
 * Anonymous sign-in is transparently applied if there is no session yet.
 */
export async function submitContribution(
  draft: ContributionDraft,
  idempotencyKey: string,
): Promise<ContributionResponse> {
  let response = await postContribution(draft, idempotencyKey);

  if (response.status === 401) {
    await signIn.anonymous();
    response = await postContribution(draft, idempotencyKey);
  }

  if (!response.ok) {
    const message =
      response.status === 409
        ? "This item is already covered — please pick another"
        : "Could not record your airdrop — it will retry";
    throw new ContributionError(message, response.status);
  }

  const parsed = contributionResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ContributionError("Unexpected response", 500);
  }
  return parsed.data;
}
