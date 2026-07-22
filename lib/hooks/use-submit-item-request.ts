"use client";

import { useMutation } from "@tanstack/react-query";

import { submitItemRequest } from "@/lib/api/item-request.client";
import { useInvalidateBoard } from "@/lib/hooks/use-board-query";

/**
 * Submits a proposed item, then invalidates the board.
 *
 * The invalidation matters even though a proposal starts as PENDING_REVIEW: a
 * moderator may approve or merge it within seconds, and a contributor staring
 * at a board that still lacks their item will submit it again. Refetching is
 * far cheaper than de-duplicating afterwards.
 */
export function useSubmitItemRequest() {
  const invalidateBoard = useInvalidateBoard();

  return useMutation({
    mutationFn: submitItemRequest,
    onSuccess: () => invalidateBoard(),
  });
}
