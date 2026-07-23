"use client";

import { useCallback, useState } from "react";

import { revealDropPoint, RevealError } from "@/lib/api/reveal.client";
import type { RevealResponse } from "@/lib/api/schemas/reveal.schema";
import { authClient } from "@/lib/auth/auth-client";

type RevealStatus = "idle" | "working" | "revealed" | "error";

interface UseRevealResult {
  status: RevealStatus;
  data: RevealResponse | null;
  errorMessage: string | null;
  reveal: (dropPointId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Drives the reveal flow, including the anonymous sign-in step.
 *
 * Deliberately NOT a React Query mutation with a cache: the address lives only
 * in this hook's local state for the life of the open sheet, so it is never
 * persisted. If the first attempt 401s, we sign the user in anonymously (the
 * default, no-friction path) and retry once.
 */
export function useRevealDropPoint(): UseRevealResult {
  const [status, setStatus] = useState<RevealStatus>("idle");
  const [data, setData] = useState<RevealResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reveal = useCallback(async (dropPointId: string): Promise<void> => {
    setStatus("working");
    setErrorMessage(null);

    try {
      let result: RevealResponse;
      try {
        result = await revealDropPoint(dropPointId);
      } catch (error) {
        // No session yet → sign in anonymously and try once more.
        if (error instanceof RevealError && error.status === 401) {
          await authClient.signIn.anonymous();
          result = await revealDropPoint(dropPointId);
        } else {
          throw error;
        }
      }

      setData(result);
      setStatus("revealed");
    } catch (error) {
      setErrorMessage(
        error instanceof RevealError
          ? error.message
          : "Could not load the drop point",
      );
      setStatus("error");
    }
  }, []);

  const reset = useCallback((): void => {
    setStatus("idle");
    setData(null);
    setErrorMessage(null);
  }, []);

  return { status, data, errorMessage, reveal, reset };
}
