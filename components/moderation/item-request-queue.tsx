"use client";

import { useEffect, useState } from "react";

import { ModerationError } from "@/lib/api/moderation.client";
import {
  fetchPendingItemRequests,
  reviewItemRequest,
} from "@/lib/api/item-request-moderation.client";
import type {
  ItemRequestDecision,
  PendingItemRequest,
} from "@/lib/api/schemas/item-request-moderation.schema";
import { AIRDROP_CATEGORY_LABEL } from "@/lib/domain/airdrop.constants";
import type { AirdropCategory } from "@/lib/domain/airdrop.constants";
import { formatQuantity } from "@/lib/domain/format.util";
import { formatRelativeTime } from "@/lib/domain/needs.util";

type LoadState = "loading" | "ready" | "denied" | "error";

function categoryLabel(category: string): string {
  return (
    AIRDROP_CATEGORY_LABEL[category as AirdropCategory] ?? category
  );
}

/**
 * Moderator queue for publicly proposed items.
 *
 * Approve promotes a proposal to a new board need; merge folds its quantity into
 * an existing need (the buttons come pre-populated with the near-duplicates the
 * server matched); reject discards it. Nothing here has been public — a proposal
 * only reaches the board once approved or merged.
 */
export function ItemRequestQueue() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<PendingItemRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPendingItemRequests()
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

  async function decide(
    id: string,
    decision: ItemRequestDecision,
  ): Promise<void> {
    setBusyId(id);
    try {
      await reviewItemRequest(id, decision);
      // Drop the reviewed row; the board change is already committed server-side.
      setItems((current) => current.filter((row) => row.id !== id));
    } catch {
      // Resync on any conflict (e.g. someone else reviewed it first).
      setItems(await fetchPendingItemRequests());
    } finally {
      setBusyId(null);
    }
  }

  if (state === "loading") {
    return <p className="text-fg-muted p-6 text-sm">Loading requests…</p>;
  }
  if (state === "denied") {
    return (
      <p className="text-fg p-6 text-sm font-semibold">
        This page is for moderators only.
      </p>
    );
  }
  if (state === "error") {
    return <p className="text-danger p-6 text-sm">Could not load requests.</p>;
  }
  if (items.length === 0) {
    return (
      <p className="text-fg-muted p-6 text-sm">
        No pending item requests — all caught up.
      </p>
    );
  }

  return (
    <ul className="mx-auto flex max-w-3xl list-none flex-col gap-3 p-4">
      {items.map((item) => {
        const busy = busyId === item.id;
        return (
          <li
            key={item.id}
            className="border-border-structure bg-surface shadow-poster flex flex-col gap-3 border-2 p-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-fg font-display text-base uppercase">
                {formatQuantity(item.qtyRequested)} {item.unit} ·{" "}
                {item.proposedName}
              </h2>
              <span className="text-fg-muted text-xs font-semibold whitespace-nowrap">
                {categoryLabel(item.category)}
              </span>
            </div>

            <p className="text-fg-muted text-xs">
              Proposed {formatRelativeTime(item.createdAt, new Date())}
              {item.requesterIsAnonymous ? " · anonymous supporter" : ""}
            </p>

            {item.note ? (
              <p className="border-border-soft bg-surface-2 border-2 border-dashed px-3 py-2 text-xs text-fg">
                “{item.note}”
              </p>
            ) : null}

            {item.mergeCandidates.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-fg-muted text-xs font-semibold">
                  Looks like it could be:
                </p>
                {item.mergeCandidates.map((candidate) => (
                  <button
                    key={candidate.needId}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      decide(item.id, {
                        decision: "MERGE",
                        targetNeedId: candidate.needId,
                      })
                    }
                    className="border-border-strong text-fg border-2 bg-surface px-3 py-2 text-left text-xs font-semibold disabled:opacity-50"
                  >
                    Merge into {candidate.itemName} (
                    {formatQuantity(candidate.qtyRequested)} {candidate.unit})
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(item.id, { decision: "REJECT" })}
                className="border-border-strong text-danger flex-1 border-2 bg-surface px-3 py-3 text-sm font-semibold disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(item.id, { decision: "APPROVE" })}
                className="border-border-strong bg-primary text-brand-ink flex-1 border-2 px-3 py-3 text-sm font-semibold disabled:opacity-50"
              >
                Approve as new
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
