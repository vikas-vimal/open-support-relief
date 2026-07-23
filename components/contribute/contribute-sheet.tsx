"use client";

import { useEffect, useRef, useState } from "react";

import { CopyField } from "@/components/contribute/copy-field";
import { ProofUpload } from "@/components/contribute/proof-upload";
import { QuantityStepper } from "@/components/contribute/quantity-stepper";
import { PosterButton } from "@/components/ui/poster-button";
import { formatCompactQuantity, formatQuantity } from "@/lib/domain/format.util";
import {
  FULFILMENT_PLATFORM_LABEL,
  type FulfilmentPlatform,
} from "@/lib/domain/airdrop.constants";
import type { DropPointPublic, NeedSummary } from "@/lib/domain/airdrop.types";
import { useRevealDropPoint } from "@/lib/hooks/use-reveal-drop-point";
import { useSubmitContribution } from "@/lib/hooks/use-submit-contribution";

interface ContributeSheetProps {
  need: NeedSummary | null;
  /** Public drop point to reveal; null if the site has none configured. */
  dropPoint: DropPointPublic | null;
  onDismiss: () => void;
}

function whatsappHref(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
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
export function ContributeSheet({
  need,
  dropPoint,
  onDismiss,
}: ContributeSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [platform, setPlatform] = useState<FulfilmentPlatform>("BLINKIT");
  const [showName, setShowName] = useState<boolean>(false);
  const [proofStoragePath, setProofStoragePath] = useState<string | null>(null);
  const {
    status: revealStatus,
    data: reveal,
    errorMessage: revealError,
    reveal: doReveal,
    reset: resetReveal,
  } = useRevealDropPoint();
  const {
    status: submitStatus,
    result: submitResult,
    errorMessage: submitError,
    submit: doSubmit,
    reset: resetSubmit,
  } = useSubmitContribution();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (need && !dialog.open) {
      setQuantity(Math.min(10, need.shortfall));
      setPlatform("BLINKIT");
      setShowName(false);
      setProofStoragePath(null);
      resetReveal(); // never carry a revealed address across items
      resetSubmit();
      dialog.showModal();
    } else if (!need && dialog.open) {
      dialog.close();
    }
  }, [need, resetReveal, resetSubmit]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      aria-labelledby="contribute-sheet-title"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-3xl rounded-t-card border-[3px] border-border-structure bg-surface p-0 text-fg backdrop:bg-fg/60 sm:mx-auto sm:mb-auto sm:rounded-card"
    >
      {need && (
        <div className="flex max-h-[92dvh] flex-col overflow-y-auto">
          <header className="sticky top-0 flex items-start justify-between gap-3 border-b-2 border-border-structure bg-header-bg px-4 py-3">
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
              className="flex size-8 shrink-0 items-center justify-center rounded-icon border-2 border-border-strong bg-surface text-sm leading-none text-fg"
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

              {revealStatus === "revealed" && reveal ? (
                <div className="flex flex-col gap-2">
                  <CopyField label="Drop point" value={reveal.label} />
                  <CopyField label="Address" value={reveal.fullAddress} />
                  <CopyField label="Recipient" value={reveal.recipientName} />
                  <CopyField
                    label="Phone"
                    value={reveal.recipientPhone}
                    action={{
                      href: whatsappHref(reveal.recipientPhone),
                      label: "WhatsApp",
                    }}
                  />
                  {reveal.instructions && (
                    <p className="border-2 border-border-structure bg-surface-2 p-3 text-xs leading-relaxed text-fg-muted">
                      {reveal.instructions}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Sealed until the reveal endpoint authenticates the user,
                      checks the kill switch, rate-limits, and audits. */}
                  <div className="border-2 border-dashed border-border-soft bg-surface-2 px-4 py-5 text-center">
                    <p className="mb-1 text-2xl" aria-hidden="true">
                      🔒
                    </p>
                    <p className="label-track text-xs text-fg-muted">
                      {dropPoint ? "Drop point hidden" : "No drop point yet"}
                    </p>
                    <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-fg-muted">
                      {dropPoint
                        ? "The address and volunteer contact are only shown to signed-in supporters. This keeps volunteers safe."
                        : "A volunteer hasn't published a drop point for this site yet."}
                    </p>
                  </div>

                  <PosterButton
                    size="lg"
                    disabled={!dropPoint || revealStatus === "working"}
                    onClick={() => dropPoint && doReveal(dropPoint.id)}
                  >
                    {revealStatus === "working"
                      ? "Revealing…"
                      : "Reveal drop point"}
                  </PosterButton>

                  {revealStatus === "error" && revealError ? (
                    <p
                      role="alert"
                      className="border-2 border-urgent px-3 py-2 text-center text-xs font-semibold text-urgent"
                    >
                      {revealError}
                    </p>
                  ) : (
                    <p className="text-center text-[0.6875rem] text-fg-muted">
                      One tap, no personal details needed.
                    </p>
                  )}
                </>
              )}
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

            <section className="flex flex-col gap-3 border-t-2 border-border-soft pt-4">
              {submitStatus === "done" && submitResult ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-3xl" aria-hidden="true">
                    📦
                  </p>
                  <p className="label-track text-sm text-fg">
                    {submitResult.deduplicated
                      ? "Already counted — thank you"
                      : "Airdrop counted — thank you"}
                  </p>
                  <p className="text-xs leading-relaxed text-fg-muted">
                    {formatCompactQuantity(submitResult.shortfall)} of{" "}
                    {need.itemName} still needed. A volunteer verifies proof
                    before it is final.
                  </p>
                  <div className="w-full max-w-xs pt-1">
                    <PosterButton onClick={onDismiss}>Done</PosterButton>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="label-track text-xs text-fg-muted">
                    Confirm you&apos;ve sent it
                  </h3>

                  <div>
                    <p className="mb-1.5 text-[0.6875rem] font-semibold text-fg-muted">
                      Which app did you order through?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORM_ORDER.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPlatform(option)}
                          aria-pressed={platform === option}
                          className={`rounded-card border-2 border-border-strong px-3 py-3 text-xs font-semibold ${
                            platform === option
                              ? "bg-fg text-canvas"
                              : "bg-surface text-fg"
                          }`}
                        >
                          {FULFILMENT_PLATFORM_LABEL[option]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ProofUpload onUploaded={setProofStoragePath} />

                  <label className="flex items-center gap-2.5 text-sm text-fg">
                    <input
                      type="checkbox"
                      checked={showName}
                      onChange={(event) => setShowName(event.target.checked)}
                      className="size-5 shrink-0 accent-[var(--brand-live)]"
                    />
                    Show my name on the supporters wall
                  </label>

                  <PosterButton
                    size="lg"
                    disabled={submitStatus === "working"}
                    onClick={() =>
                      doSubmit({
                        needId: need.id,
                        qty: quantity,
                        platform,
                        showName,
                        proofStoragePath: proofStoragePath ?? undefined,
                      })
                    }
                  >
                    {submitStatus === "working"
                      ? "Sending…"
                      : `Mark ${formatQuantity(quantity)} sent`}
                  </PosterButton>

                  {submitStatus === "error" && submitError ? (
                    <p
                      role="alert"
                      className="border-2 border-urgent px-3 py-2 text-center text-xs font-semibold text-urgent"
                    >
                      {submitError}
                    </p>
                  ) : (
                    <p className="text-center text-[0.6875rem] leading-relaxed text-fg-muted">
                      Proof-screenshot upload lands next. For now this counts as
                      pending until a volunteer verifies it.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </dialog>
  );
}
