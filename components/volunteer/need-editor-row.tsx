"use client";

import { useState } from "react";

import type { ManagedNeed } from "@/lib/api/schemas/needs-admin.schema";
import { updateNeed } from "@/lib/api/needs-admin.client";
import { URGENCY, type Urgency } from "@/lib/domain/airdrop.constants";
import { formatQuantity } from "@/lib/domain/format.util";

const URGENCY_ORDER: readonly Urgency[] = [
  URGENCY.NORMAL,
  URGENCY.HIGH,
  URGENCY.URGENT,
];

interface NeedEditorRowProps {
  need: ManagedNeed;
  onChanged: (need: ManagedNeed) => void;
}

/**
 * One editable board row for a volunteer: adjust quantity/urgency, or STOP the
 * item (drops it off the board and halts inbound supply — the oversupply brake).
 * Counters shown are read-only; a volunteer sets the target, never what has
 * already been delivered.
 */
export function NeedEditorRow({ need, onChanged }: NeedEditorRowProps) {
  const [qty, setQty] = useState<number>(need.qtyRequested);
  const [urgency, setUrgency] = useState<Urgency>(need.urgency);
  const [busy, setBusy] = useState(false);

  const dirty = qty !== need.qtyRequested || urgency !== need.urgency;

  async function run(patch: Parameters<typeof updateNeed>[1]): Promise<void> {
    setBusy(true);
    try {
      onChanged(await updateNeed(need.id, patch));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className={`border-border-structure bg-surface flex flex-col gap-3 border-2 p-4 shadow-poster ${
        need.isActive ? "" : "opacity-70"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-fg font-display text-base uppercase">
          {need.itemName}
          {!need.isActive && (
            <span className="text-fg-muted ml-2 text-xs font-semibold normal-case">
              (stopped)
            </span>
          )}
        </h2>
        <span className="text-fg-muted text-xs font-semibold whitespace-nowrap">
          {formatQuantity(need.qtyFulfilled)}/{formatQuantity(need.qtyRequested)}{" "}
          {need.unit}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-[0.625rem] font-semibold uppercase">
            Target
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={qty}
            onChange={(event) => setQty(Math.max(0, Number(event.target.value)))}
            className="border-border-strong bg-surface text-fg w-24 border-2 px-2 py-1.5 font-mono text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-[0.625rem] font-semibold uppercase">
            Urgency
          </span>
          <select
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as Urgency)}
            className="border-border-strong bg-surface text-fg border-2 px-2 py-1.5 text-sm"
          >
            {URGENCY_ORDER.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => run({ qtyRequested: qty, urgency })}
          className="border-border-strong bg-primary text-brand-ink border-2 px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ isActive: !need.isActive })}
          className={`border-border-strong border-2 bg-surface px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
            need.isActive ? "text-danger" : "text-fg"
          }`}
        >
          {need.isActive ? "We have enough — STOP" : "Re-open"}
        </button>
      </div>
    </li>
  );
}
