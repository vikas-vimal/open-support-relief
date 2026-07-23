"use client";

import { useId, useState } from "react";

import type {
  DropPointCreateInput,
  ManagedDropPoint,
} from "@/lib/api/schemas/drop-point-admin.schema";

interface DropPointFormProps {
  /** Present when editing; omit to render a blank create form. */
  initial?: ManagedDropPoint;
  submitLabel: string;
  onSubmit: (values: DropPointFormValues) => Promise<void>;
}

export interface DropPointFormValues extends DropPointCreateInput {
  isActive: boolean;
}

const FIELD_CLASS =
  "border-border bg-surface text-fg w-full border-2 px-3 py-2 text-sm";
const LABEL_CLASS = "text-fg-muted text-xs font-semibold";

/**
 * Edit/create form for a single drop point.
 *
 * Owns its own field state, seeded from `initial`. Every field carries the
 * gated address detail, so the form only ever posts to the VOLUNTEER-gated
 * endpoints — it is never rendered for the public.
 */
export function DropPointForm({
  initial,
  submitLabel,
  onSubmit,
}: DropPointFormProps) {
  const baseId = useId();
  const [label, setLabel] = useState(initial?.label ?? "");
  const [fullAddress, setFullAddress] = useState(initial?.fullAddress ?? "");
  const [recipientName, setRecipientName] = useState(
    initial?.recipientName ?? "",
  );
  const [recipientPhone, setRecipientPhone] = useState(
    initial?.recipientPhone ?? "",
  );
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setStatus("saving");
    try {
      await onSubmit({
        label: label.trim(),
        fullAddress: fullAddress.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        instructions: instructions.trim() || null,
        isActive,
      });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  const id = (field: string): string => `${baseId}-${field}`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={id("label")} className={LABEL_CLASS}>
          Public label (shown on the board)
        </label>
        <input
          id={id("label")}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
          maxLength={120}
          className={FIELD_CLASS}
          placeholder="Gate 3 medical tent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={id("address")} className={LABEL_CLASS}>
          Full address (gated — revealed only after sign-in)
        </label>
        <textarea
          id={id("address")}
          value={fullAddress}
          onChange={(event) => setFullAddress(event.target.value)}
          required
          maxLength={500}
          rows={2}
          className={FIELD_CLASS}
          placeholder="Building, street, landmark, city, PIN"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={id("recipient")} className={LABEL_CLASS}>
          Recipient name (gated)
        </label>
        <input
          id={id("recipient")}
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          required
          maxLength={120}
          className={FIELD_CLASS}
          placeholder="Volunteer coordinator"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={id("phone")} className={LABEL_CLASS}>
          Recipient phone (gated)
        </label>
        <input
          id={id("phone")}
          type="tel"
          value={recipientPhone}
          onChange={(event) => setRecipientPhone(event.target.value)}
          required
          maxLength={30}
          className={FIELD_CLASS}
          placeholder="+91…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={id("instructions")} className={LABEL_CLASS}>
          Instructions (optional)
        </label>
        <textarea
          id={id("instructions")}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          maxLength={500}
          rows={2}
          className={FIELD_CLASS}
          placeholder="Ask for the volunteer coordinator."
        />
      </div>

      <label className="text-fg flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="border-border h-4 w-4 border-2"
        />
        Active (uncheck to hide this drop point)
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="border-border-strong bg-primary text-brand-ink border-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : submitLabel}
        </button>
        {status === "saved" && (
          <span className="text-success text-xs font-semibold" role="status">
            Saved
          </span>
        )}
        {status === "error" && (
          <span className="text-danger text-xs font-semibold" role="status">
            Could not save — try again
          </span>
        )}
      </div>
    </form>
  );
}
