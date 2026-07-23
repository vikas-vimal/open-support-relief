"use client";

import { useState } from "react";

import type { ManagedNeed } from "@/lib/api/schemas/needs-admin.schema";
import { createNeed } from "@/lib/api/needs-admin.client";
import {
  AIRDROP_CATEGORY,
  AIRDROP_CATEGORY_LABEL,
  AIRDROP_CATEGORY_ORDER,
  URGENCY,
  type AirdropCategory,
  type Urgency,
} from "@/lib/domain/airdrop.constants";

interface CatalogueItem {
  name: string;
  unit: string;
  category: string;
  requestCount: number;
}

interface AddNeedFormProps {
  /** Most-requested items, offered as one-tap prefills. */
  catalogue: readonly CatalogueItem[];
  onAdded: (need: ManagedNeed) => void;
}

const FIELD = "border-border-strong bg-surface text-fg border-2 px-3 py-2 text-sm";

/** Post a new need. Picking a catalogue chip prefills the name/unit/category. */
export function AddNeedForm({ catalogue, onAdded }: AddNeedFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("piece");
  const [category, setCategory] = useState<AirdropCategory>(
    AIRDROP_CATEGORY.FOOD,
  );
  const [qty, setQty] = useState<number>(50);
  const [urgency, setUrgency] = useState<Urgency>(URGENCY.NORMAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const canSubmit = name.trim().length >= 2 && qty > 0;

  function prefill(item: CatalogueItem): void {
    setName(item.name);
    setUnit(item.unit);
    if (
      (AIRDROP_CATEGORY_ORDER as readonly string[]).includes(item.category)
    ) {
      setCategory(item.category as AirdropCategory);
    }
  }

  async function submit(): Promise<void> {
    setBusy(true);
    setError(false);
    try {
      const created = await createNeed({
        itemName: name.trim(),
        unit: unit.trim(),
        category,
        qtyRequested: qty,
        urgency,
      });
      onAdded(created);
      setName("");
      setQty(50);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-border-structure bg-surface-2 flex flex-col gap-3 border-2 p-4">
      <h2 className="text-fg font-display text-base uppercase">Add a need</h2>

      {catalogue.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {catalogue.slice(0, 12).map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => prefill(item)}
              className="border-border-soft bg-surface text-fg rounded-pill border px-2.5 py-1 text-xs"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-fg-muted text-[0.625rem] font-semibold uppercase">
            Item
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Raincoats"
            className={`${FIELD} min-w-40`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-[0.625rem] font-semibold uppercase">
            Unit
          </span>
          <input
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className={`${FIELD} w-24`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-[0.625rem] font-semibold uppercase">
            Category
          </span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as AirdropCategory)
            }
            className={FIELD}
          >
            {AIRDROP_CATEGORY_ORDER.map((option) => (
              <option key={option} value={option}>
                {AIRDROP_CATEGORY_LABEL[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-[0.625rem] font-semibold uppercase">
            Target
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={qty}
            onChange={(event) => setQty(Math.max(1, Number(event.target.value)))}
            className={`${FIELD} w-24 font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-fg-muted text-[0.625rem] font-semibold uppercase">
            Urgency
          </span>
          <select
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as Urgency)}
            className={FIELD}
          >
            {[URGENCY.NORMAL, URGENCY.HIGH, URGENCY.URGENT].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={() => void submit()}
          className="border-border-strong bg-primary text-brand-ink border-2 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add to board"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-danger text-xs font-semibold">
          Could not add — try again.
        </p>
      )}
    </section>
  );
}
