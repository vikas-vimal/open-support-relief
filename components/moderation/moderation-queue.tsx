"use client";

import { useEffect, useState } from "react";

import { ContributionReviewCard } from "@/components/moderation/contribution-review-card";
import {
  fetchPendingContributions,
  ModerationError,
} from "@/lib/api/moderation.client";
import type { PendingContribution } from "@/lib/api/schemas/moderation.schema";

type LoadState = "loading" | "ready" | "denied" | "error";

/**
 * Moderator queue for pending contribution claims.
 *
 * Its own page (not the public board), gated server-side — a non-moderator gets
 * 403 and sees the denied state. A reviewed card stays in place showing its
 * decision + an Undo (within the window) rather than vanishing, so a mis-click is
 * immediately recoverable; it only clears on the next load, which returns pending
 * claims only.
 */
export function ModerationQueue() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<PendingContribution[]>([]);

  useEffect(() => {
    let alive = true;
    fetchPendingContributions()
      .then((rows) => {
        if (!alive) return;
        setItems(rows);
        setState("ready");
      })
      .catch((error) => {
        if (!alive) return;
        setState(
          error instanceof ModerationError && error.status === 403
            ? "denied"
            : "error",
        );
      });
    return () => {
      alive = false;
    };
  }, []);

  function replaceReviewed(reviewed: PendingContribution): void {
    setItems((current) =>
      current.map((row) => (row.id === reviewed.id ? reviewed : row)),
    );
  }

  if (state === "loading") {
    return <p className="p-6 text-sm text-fg-muted">Loading queue…</p>;
  }
  if (state === "denied") {
    return (
      <p className="p-6 text-sm font-semibold text-fg">
        This page is for moderators only.
      </p>
    );
  }
  if (state === "error") {
    return <p className="p-6 text-sm text-danger">Could not load the queue.</p>;
  }
  if (items.length === 0) {
    return (
      <p className="p-6 text-sm text-fg-muted">
        Nothing waiting — all caught up.
      </p>
    );
  }

  return (
    <ul className="mx-auto flex max-w-3xl list-none flex-col gap-3 p-4">
      {items.map((item) => (
        <ContributionReviewCard
          key={item.id}
          item={item}
          onReviewed={replaceReviewed}
        />
      ))}
    </ul>
  );
}
