"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PosterButton } from "@/components/ui/poster-button";
import { findLikelyDuplicates } from "@/lib/domain/item-match.util";
import { formatQuantity } from "@/lib/domain/format.util";
import {
  AIRDROP_CATEGORY,
  AIRDROP_CATEGORY_EMOJI,
  AIRDROP_CATEGORY_LABEL,
  AIRDROP_CATEGORY_ORDER,
  type AirdropCategory,
} from "@/lib/domain/airdrop.constants";
import type { NeedSummary } from "@/lib/domain/airdrop.types";
import { useSubmitItemRequest } from "@/lib/hooks/use-submit-item-request";

interface RequestItemSheetProps {
  isOpen: boolean;
  /** Seeded from the search box, so an empty search flows straight into a proposal. */
  initialName: string;
  needs: readonly NeedSummary[];
  onDismiss: () => void;
  onViewExisting: (need: NeedSummary) => void;
}

const UNIT_OPTIONS: readonly string[] = [
  "piece",
  "bottle",
  "packet",
  "sachet",
  "roll",
  "sheet",
  "box",
  "kg",
  "litre",
];

const DEFAULT_QUANTITY = 25;

export function RequestItemSheet({
  isOpen,
  initialName,
  needs,
  onDismiss,
  onViewExisting,
}: RequestItemSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitRequest = useSubmitItemRequest();

  const [itemName, setItemName] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(DEFAULT_QUANTITY);
  const [unit, setUnit] = useState<string>(UNIT_OPTIONS[0]);
  const [category, setCategory] = useState<AirdropCategory>(
    AIRDROP_CATEGORY.FOOD,
  );
  const [note, setNote] = useState<string>("");
  const [wasSubmitted, setWasSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setItemName(initialName);
      setQuantity(DEFAULT_QUANTITY);
      setNote("");
      setWasSubmitted(false);
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, initialName]);

  /* The same matcher the search bar uses. If these ever diverge, someone can
     search, see nothing, and then propose an item that already exists. */
  const duplicates = useMemo(
    () => findLikelyDuplicates(itemName, needs),
    [itemName, needs],
  );

  const canSubmit = itemName.trim().length >= 2 && quantity > 0;

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      aria-labelledby="request-item-title"
      className="bg-surface text-fg border-border-structure backdrop:bg-fg/60 m-0 mt-auto max-h-[92dvh] w-full max-w-3xl rounded-t-card border-[3px] p-0 sm:mx-auto sm:mb-auto sm:rounded-card"
    >
      <div className="flex max-h-[92dvh] flex-col overflow-y-auto">
        <header className="bg-header-bg border-border-structure sticky top-0 flex items-start justify-between gap-3 border-b-2 px-4 py-3">
          <div>
            <p className="label-track text-fg text-[0.625rem]">Not on the list?</p>
            <h2
              id="request-item-title"
              className="text-fg font-display text-lg leading-tight uppercase"
            >
              Request an item
            </h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="border-border-strong bg-surface text-fg flex size-8 shrink-0 items-center justify-center rounded-icon border-2 text-sm leading-none"
          >
            ✕
          </button>
        </header>

        {wasSubmitted ? (
          <div className="flex flex-col gap-3 px-4 py-8 text-center">
            <p className="text-3xl" aria-hidden="true">
              📋
            </p>
            <p className="label-track text-fg text-sm">Sent for review</p>
            <p className="text-fg-muted mx-auto max-w-xs text-xs leading-relaxed">
              A volunteer at the site will check this and add it to the board.
              New items are reviewed before they appear publicly.
            </p>
            <PosterButton onClick={onDismiss}>Done</PosterButton>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-4 py-4">
            <section className="flex flex-col gap-2">
              <label
                htmlFor="request-item-name"
                className="label-track text-fg-muted text-xs"
              >
                What is needed?
              </label>
              <input
                id="request-item-name"
                type="text"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                placeholder="e.g. Gumboots"
                autoComplete="off"
                className="border-border-strong bg-surface text-fg placeholder:text-fg-muted rounded-card border-2 px-3 py-3 text-base focus:outline-none"
              />

              {/* Shown before submission, not after: a duplicate should become a
                  redirect, never a rejected form. */}
              {duplicates.length > 0 && (
                <div className="border-accent bg-meter-soft/15 flex flex-col gap-2 rounded-card border-2 p-3">
                  <p className="label-track text-accent text-[0.625rem]">
                    Already on the board
                  </p>
                  <ul className="flex list-none flex-col gap-1.5">
                    {duplicates.map(({ need }) => (
                      <li key={need.id}>
                        <button
                          type="button"
                          onClick={() => onViewExisting(need)}
                          /* Explicit label: the visible text is split across
                             two spans, so screen readers otherwise announce a
                             concatenation that reads as one run-on string. */
                          aria-label={`View ${need.itemName}, ${formatQuantity(need.shortfall)} still needed`}
                          className="border-border-soft bg-surface text-fg hover:bg-surface-2 flex w-full items-center justify-between gap-2 rounded-card border px-3 py-2 text-left text-sm"
                        >
                          <span className="truncate font-semibold">
                            {need.itemName}
                          </span>
                          <span className="text-fg-muted shrink-0 font-mono text-xs tabular-nums">
                            {formatQuantity(need.shortfall)} short →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-fg-muted text-[0.6875rem] leading-relaxed">
                    Send one of these instead of adding a duplicate — it keeps
                    the counts accurate.
                  </p>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <span className="label-track text-fg-muted text-xs">Category</span>
              <div className="grid grid-cols-3 gap-2">
                {AIRDROP_CATEGORY_ORDER.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategory(option)}
                    aria-pressed={category === option}
                    className={`border-border-strong flex items-center justify-center gap-1.5 rounded-card border-2 px-2 py-2.5 text-xs font-semibold ${
                      category === option
                        ? "bg-fg text-canvas"
                        : "bg-surface text-fg"
                    }`}
                  >
                    <span aria-hidden="true">
                      {AIRDROP_CATEGORY_EMOJI[option]}
                    </span>
                    {AIRDROP_CATEGORY_LABEL[option]}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <label
                  htmlFor="request-item-qty"
                  className="label-track text-fg-muted text-xs"
                >
                  How many?
                </label>
                <input
                  id="request-item-qty"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Number(event.target.value)))
                  }
                  className="border-border-strong bg-surface text-fg rounded-card border-2 px-3 py-3 font-mono text-base tabular-nums focus:outline-none"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label
                  htmlFor="request-item-unit"
                  className="label-track text-fg-muted text-xs"
                >
                  Unit
                </label>
                <select
                  id="request-item-unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  className="border-border-strong bg-surface text-fg rounded-card border-2 px-3 py-3 text-base focus:outline-none"
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <label
                htmlFor="request-item-note"
                className="label-track text-fg-muted text-xs"
              >
                Why is it needed? (optional)
              </label>
              <textarea
                id="request-item-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Helps the volunteer decide quickly"
                className="border-border-strong bg-surface text-fg placeholder:text-fg-muted resize-none rounded-card border-2 px-3 py-2.5 text-sm focus:outline-none"
              />
            </section>

            <div className="flex flex-col gap-2">
              <PosterButton
                size="lg"
                disabled={!canSubmit || submitRequest.isPending}
                onClick={() =>
                  submitRequest.mutate(
                    {
                      proposedName: itemName.trim(),
                      category,
                      qtyRequested: quantity,
                      unit,
                      note: note.trim(),
                    },
                    { onSuccess: () => setWasSubmitted(true) },
                  )
                }
              >
                {submitRequest.isPending ? "Sending…" : "Send request"}
              </PosterButton>

              {submitRequest.isError && (
                <p
                  role="alert"
                  className="border-danger text-danger rounded-card border-2 px-3 py-2 text-center text-xs font-semibold"
                >
                  Could not send. It will retry — check your connection.
                </p>
              )}
              <p className="text-fg-muted text-center text-[0.6875rem] leading-relaxed">
                Goes to a volunteer for review before it appears on the board.
                Never post personal details here.
              </p>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
