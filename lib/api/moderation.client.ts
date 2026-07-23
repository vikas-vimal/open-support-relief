import {
  moderationQueueResponseSchema,
  reviewResultSchema,
  type PendingContribution,
  type ReviewResult,
} from "@/lib/api/schemas/moderation.schema";

export class ModerationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ModerationError";
  }
}

export async function fetchPendingContributions(): Promise<PendingContribution[]> {
  const response = await fetch("/api/moderation/contributions", {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ModerationError(
      response.status === 403 ? "Moderators only" : "Could not load the queue",
      response.status,
    );
  }
  const parsed = moderationQueueResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new ModerationError("Unexpected response", 500);
  return parsed.data.contributions;
}

export async function reviewContribution(
  id: string,
  action: "VERIFY" | "REJECT",
): Promise<ReviewResult> {
  const response = await fetch(`/api/moderation/contributions/${id}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    throw new ModerationError(
      response.status === 409 ? "Already reviewed" : "Review failed",
      response.status,
    );
  }
  const parsed = reviewResultSchema.safeParse(await response.json());
  if (!parsed.success) throw new ModerationError("Unexpected response", 500);
  return parsed.data;
}
