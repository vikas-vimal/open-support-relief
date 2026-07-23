"use client";

import { useEffect, useState } from "react";

import {
  fetchPendingContributions,
  ModerationError,
  reviewContribution,
} from "@/lib/api/moderation.client";
import type { PendingContribution } from "@/lib/api/schemas/moderation.schema";
import { formatQuantity } from "@/lib/domain/format.util";

type LoadState = "loading" | "ready" | "denied" | "error";

/**
 * Moderator queue for pending contribution claims.
 *
 * Its own page (not the public board), gated server-side — a non-moderator gets
 * 403 and sees the denied state. Verifying keeps the count; rejecting restores
 * it, so the visible shortfall the moderator is shown after a reject already
 * reflects the reversal.
 */
export function ModerationQueue() {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<PendingContribution[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function review(id: string, action: "VERIFY" | "REJECT"): Promise<void> {
    setBusyId(id);
    try {
      await reviewContribution(id, action);
      // Drop the reviewed row; the counter change is already committed server-side.
      setItems((current) => current.filter((row) => row.id !== id));
    } catch {
      // Refetch to resync on any conflict (e.g. someone else reviewed it).
      setItems(await fetchPendingContributions());
    } finally {
      setBusyId(null);
    }
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
    return <p className="p-6 text-sm text-urgent">Could not load the queue.</p>;
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
        <li
          key={item.id}
          className="border-border-structure bg-surface flex flex-col gap-3 border-2 p-4 shadow-poster"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base text-fg uppercase">
              {formatQuantity(item.qtyClaimed)} {item.unit} · {item.itemName}
            </h2>
            <span className="text-xs font-semibold text-fg-muted">
              {item.platformOther ?? item.platform}
            </span>
          </div>

          {item.proofUrls.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto">
              {item.proofUrls.map((url, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived, external URL
                <img
                  key={index}
                  src={url}
                  alt={`Proof ${index + 1} for ${item.itemName}`}
                  className="border-border-soft h-40 w-auto border-2 object-contain"
                />
              ))}
            </div>
          ) : (
            <p className="border-border-soft bg-surface-2 border-2 border-dashed px-3 py-2 text-xs text-fg-muted">
              No proof attached — verify only if you can confirm another way.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => review(item.id, "REJECT")}
              className="border-border-strong text-urgent flex-1 border-2 bg-surface px-3 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Reject (restores count)
            </button>
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => review(item.id, "VERIFY")}
              className="border-border-strong bg-primary text-brand-ink flex-1 border-2 px-3 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Verify
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
