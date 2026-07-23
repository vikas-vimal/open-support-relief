"use client";

import { useEffect, useState } from "react";

import { reviewContribution } from "@/lib/api/moderation.client";
import type {
  PendingContribution,
  ReviewAction,
} from "@/lib/api/schemas/moderation.schema";
import {
  DISPUTE_REASON,
  DISPUTE_REASON_LABEL,
  UNDO_WINDOW_MINUTES,
  type DisputeReason,
} from "@/lib/domain/airdrop.constants";
import { formatQuantity } from "@/lib/domain/format.util";

const REASON_ORDER: readonly DisputeReason[] = [
  DISPUTE_REASON.MISSING_QTY,
  DISPUTE_REASON.NOT_RECEIVED,
  DISPUTE_REASON.QUALITY,
  DISPUTE_REASON.FRAUD,
  DISPUTE_REASON.OTHER,
];

interface ContributionReviewCardProps {
  item: PendingContribution;
  /** Called after a successful review so the parent can update its list. */
  onReviewed: (item: PendingContribution) => void;
}

/**
 * One contribution as the moderator acts on it — in the queue or in search.
 *
 * The receiver code is the reconciliation key: read it off the parcel, confirm
 * the expected item/qty, then Verify, or Flag a problem with a reason. A
 * Missing-qty flag asks how many actually arrived; only the shortfall is given
 * back to the board.
 */
export function ContributionReviewCard({
  item,
  onReviewed,
}: ContributionReviewCardProps) {
  const [busy, setBusy] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [received, setReceived] = useState(0);
  const [error, setError] = useState(false);
  // Clock lives in state (set after mount, refreshed) so render stays pure and
  // the Undo affordance disappears once the window passes.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = (): void => setNowMs(Date.now());
    // Deferred + interval, so no setState fires synchronously in the effect body.
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  async function act(action: ReviewAction): Promise<void> {
    setBusy(true);
    setError(false);
    try {
      const result = await reviewContribution(item.id, action);
      // Keep the dispute detail on the row so the decision line stays accurate,
      // and reset it on undo (back to pending).
      const detail =
        action.action === "DISPUTE"
          ? { reviewReason: action.reason, qtyReceived: action.qtyReceived ?? null }
          : { reviewReason: null, qtyReceived: null };
      setDisputing(false);
      setReason(null);
      onReviewed({
        ...item,
        state: result.state,
        reviewedAt: result.reviewedAt,
        ...detail,
      });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function submitDispute(): void {
    if (!reason) return;
    const isMissing = reason === DISPUTE_REASON.MISSING_QTY;
    void act({
      action: "DISPUTE",
      reason,
      qtyReceived: isMissing ? received : undefined,
    });
  }

  const isPending = item.state === "PENDING";
  const canUndo =
    !isPending &&
    item.reviewedAt !== null &&
    nowMs !== null &&
    nowMs - Date.parse(item.reviewedAt) < UNDO_WINDOW_MINUTES * 60_000;

  return (
    <li className="border-border-structure bg-surface shadow-poster flex flex-col gap-3 border-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-fg font-display text-base uppercase">
          {formatQuantity(item.qtyClaimed)} {item.unit} · {item.itemName}
        </h2>
        <span className="text-fg-muted text-xs font-semibold whitespace-nowrap">
          {item.platformOther ?? item.platform}
        </span>
      </div>

      {item.receiverCode && (
        <p className="border-border-strong text-fg font-mono text-sm font-bold border-2 px-3 py-1.5">
          {item.receiverCode}
        </p>
      )}

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

      {!isPending && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-fg-muted text-xs font-semibold">
            Decision: {item.state}
            {item.reviewReason
              ? ` · ${DISPUTE_REASON_LABEL[item.reviewReason as DisputeReason] ?? item.reviewReason}`
              : ""}
            {item.qtyReceived !== null
              ? ` · ${formatQuantity(item.qtyReceived)} received`
              : ""}
          </p>
          {canUndo && (
            <button
              type="button"
              disabled={busy}
              onClick={() => act({ action: "UNDO" })}
              className="border-border-strong text-fg shrink-0 border-2 bg-surface px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {isPending && !disputing && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setDisputing(true)}
            className="border-border-strong text-danger flex-1 border-2 bg-surface px-3 py-3 text-sm font-semibold disabled:opacity-50"
          >
            Flag a problem
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act({ action: "VERIFY" })}
            className="border-border-strong bg-primary text-brand-ink flex-1 border-2 px-3 py-3 text-sm font-semibold disabled:opacity-50"
          >
            Verify
          </button>
        </div>
      )}

      {isPending && disputing && (
        <div className="border-border-soft flex flex-col gap-2 border-2 border-dashed p-3">
          <p className="text-fg-muted text-xs font-semibold">What was wrong?</p>
          <div className="flex flex-wrap gap-1.5">
            {REASON_ORDER.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={reason === option}
                onClick={() => setReason(option)}
                className={`border-border-strong rounded-pill border-2 px-3 py-1.5 text-xs font-semibold ${
                  reason === option ? "bg-fg text-canvas" : "bg-surface text-fg"
                }`}
              >
                {DISPUTE_REASON_LABEL[option]}
              </button>
            ))}
          </div>

          {reason === DISPUTE_REASON.MISSING_QTY && (
            <label className="text-fg flex items-center gap-2 text-xs">
              How many actually arrived?
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={item.qtyClaimed - 1}
                value={received}
                onChange={(event) =>
                  setReceived(
                    Math.max(
                      0,
                      Math.min(item.qtyClaimed - 1, Number(event.target.value)),
                    ),
                  )
                }
                className="border-border-strong bg-surface text-fg w-20 border-2 px-2 py-1 font-mono"
              />
              <span className="text-fg-muted">of {item.qtyClaimed}</span>
            </label>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setDisputing(false);
                setReason(null);
              }}
              className="border-border-strong text-fg flex-1 border-2 bg-surface px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !reason}
              onClick={submitDispute}
              className="border-border-strong bg-primary text-brand-ink flex-1 border-2 px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-danger text-xs font-semibold">
          Could not save — it may have already been reviewed.
        </p>
      )}
    </li>
  );
}
