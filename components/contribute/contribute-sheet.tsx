"use client";

import { useEffect, useRef, useState } from "react";

import { QuantityStepper } from "@/components/contribute/quantity-stepper";
import { PosterButton } from "@/components/ui/poster-button";
import { formatQuantity } from "@/lib/domain/format.util";
import {
  FULFILMENT_PLATFORM_LABEL,
  type FulfilmentPlatform,
} from "@/lib/domain/airdrop.constants";
import type { NeedSummary } from "@/lib/domain/airdrop.types";

interface ContributeSheetProps {
  need: NeedSummary | null;
  onDismiss: () => void;
}

const ORDER_STEPS: readonly string[] = [
  "Copy the drop address",
  "Order it in your delivery app",
  "Come back and confirm",
];

const PLATFORM_ORDER: readonly FulfilmentPlatform[] = [
  "BLINKIT",
  "ZEPTO",
  "SWIGGY",
  "ZOMATO",
];

/**
 * Bottom sheet for pledging a contribution.
 *
 * Built on the native <dialog> element: focus trapping, Escape-to-close, and
 * background inerting come from the platform, which is both correct and far
 * cheaper than a JS modal library on a 2G budget.
 */
export function ContributeSheet({ need, onDismiss }: ContributeSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (need && !dialog.open) {
      setQuantity(Math.min(10, need.shortfall));
      dialog.showModal();
    } else if (!need && dialog.open) {
      dialog.close();
    }
  }, [need]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      aria-labelledby="contribute-sheet-title"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-3xl rounded-t-card border-[3px] border-border-strong bg-surface p-0 text-fg backdrop:bg-fg/60 sm:mx-auto sm:mb-auto sm:rounded-card"
    >
      {need && (
        <div className="flex max-h-[92dvh] flex-col overflow-y-auto">
          <header className="sticky top-0 flex items-start justify-between gap-3 border-b-2 border-border-strong bg-header-bg px-4 py-3">
            <div>
              <p className="label-track text-[0.625rem] text-fg">
                You are sending
              </p>
              <h2
                id="contribute-sheet-title"
                className="font-display text-lg leading-tight text-fg uppercase"
              >
                {need.itemName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close"
              className="shrink-0 rounded-card border-2 border-border-strong bg-surface px-2.5 py-1 text-sm leading-none text-fg"
            >
              ✕
            </button>
          </header>

          <div className="flex flex-col gap-5 px-4 py-4">
            <section className="flex flex-col gap-2">
              <h3 className="label-track text-xs text-fg-muted">
                How many? ({formatQuantity(need.shortfall)} still needed)
              </h3>
              <QuantityStepper
                value={quantity}
                max={need.shortfall}
                onChange={setQuantity}
                unit={need.unit}
              />
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="label-track text-xs text-fg-muted">Where to send</h3>

              {/* Address stays sealed until the reveal endpoint authenticates
                  the user, rate-limits them, and writes a RevealLog row. */}
              <div className="rounded-card border-2 border-dashed border-border-soft bg-surface-2 px-4 py-5 text-center">
                <p className="mb-1 text-2xl" aria-hidden="true">
                  🔒
                </p>
                <p className="label-track text-xs text-fg-muted">
                  Drop point hidden
                </p>
                <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-fg-muted">
                  The address and volunteer contact are only shown to signed-in
                  supporters. This keeps volunteers safe.
                </p>
              </div>

              <PosterButton size="lg" disabled>
                Reveal drop point
              </PosterButton>
              <p className="text-center text-[0.6875rem] text-fg-muted">
                Sign-in lands in Phase 2 — one tap, no personal details needed.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="label-track text-xs text-fg-muted">How it works</h3>
              <ol className="flex flex-col gap-2">
                {ORDER_STEPS.map((step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-pill border-2 border-border-strong bg-surface font-mono text-xs font-bold"
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm text-fg-muted">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-fg-muted">
                Delivery apps cannot be handed an address by us, so you paste it
                in yourself. We never take your money — you pay the app directly.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="label-track text-xs text-fg-muted">Order through</h3>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORM_ORDER.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    disabled
                    className="label-track rounded-card border-2 border-border-strong bg-surface px-3 py-3 text-xs text-fg disabled:opacity-50"
                  >
                    {FULFILMENT_PLATFORM_LABEL[platform]}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </dialog>
  );
}
