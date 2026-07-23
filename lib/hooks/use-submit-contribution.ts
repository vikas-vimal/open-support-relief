"use client";

import { useCallback, useRef, useState } from "react";

import {
  submitContribution,
  ContributionError,
  type ContributionDraft,
} from "@/lib/api/contribution.client";
import type { ContributionResponse } from "@/lib/api/schemas/contribution.schema";
import { useInvalidateBoard } from "@/lib/hooks/use-board-query";

type SubmitStatus = "idle" | "working" | "done" | "error";

interface UseSubmitContributionResult {
  status: SubmitStatus;
  result: ContributionResponse | null;
  errorMessage: string | null;
  submit: (draft: ContributionDraft) => Promise<void>;
  reset: () => void;
}

/**
 * Submits a contribution and refreshes the board so the counter reflects it.
 *
 * The idempotency key is minted once per attempt and held in a ref, so a retry
 * after a dropped connection reuses the SAME key — the server-side no-op is
 * what prevents a double count. `reset()` clears the key for the next claim.
 */
export function useSubmitContribution(): UseSubmitContributionResult {
  const invalidateBoard = useInvalidateBoard();
  const idempotencyKey = useRef<string | null>(null);

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [result, setResult] = useState<ContributionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useCallback(
    async (draft: ContributionDraft): Promise<void> => {
      idempotencyKey.current ??= crypto.randomUUID();
      setStatus("working");
      setErrorMessage(null);

      try {
        const response = await submitContribution(draft, idempotencyKey.current);
        setResult(response);
        setStatus("done");
        await invalidateBoard();
      } catch (error) {
        setErrorMessage(
          error instanceof ContributionError
            ? error.message
            : "Could not record your airdrop",
        );
        setStatus("error");
      }
    },
    [invalidateBoard],
  );

  const reset = useCallback((): void => {
    idempotencyKey.current = null;
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }, []);

  return { status, result, errorMessage, submit, reset };
}
