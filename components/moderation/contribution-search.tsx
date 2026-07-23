"use client";

import { useState } from "react";

import { ContributionReviewCard } from "@/components/moderation/contribution-review-card";
import {
  ModerationError,
  searchContributions,
} from "@/lib/api/moderation.client";
import type { PendingContribution } from "@/lib/api/schemas/moderation.schema";
import {
  FULFILMENT_PLATFORM_LABEL,
  FULFILMENT_PLATFORM,
} from "@/lib/domain/airdrop.constants";

type SearchState = "idle" | "searching" | "done" | "denied" | "error";

const CLAIM_STATES = ["PENDING", "VERIFIED", "REJECTED", "DISPUTED"] as const;
const FIELD = "border-border-strong bg-surface text-fg border-2 px-3 py-2 text-sm";
const LABEL = "text-fg-muted text-[0.625rem] font-semibold uppercase";

/**
 * Advanced search over every contribution — the drop-point reconciliation tool.
 *
 * The most common use is a single field: type the receiver code off a parcel,
 * find the claim, confirm the expected items, then Verify or Flag a problem on
 * the same review card the queue uses.
 */
export function ContributionSearch() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [state, setState] = useState<SearchState>("idle");
  const [results, setResults] = useState<PendingContribution[]>([]);

  function set(field: string, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function run(): Promise<void> {
    setState("searching");
    try {
      setResults(await searchContributions(form));
      setState("done");
    } catch (error) {
      setState(
        error instanceof ModerationError && error.status === 403
          ? "denied"
          : "error",
      );
    }
  }

  function updateResult(next: PendingContribution): void {
    setResults((current) =>
      current.map((row) => (row.id === next.id ? next : row)),
    );
  }

  if (state === "denied") {
    return (
      <p className="text-fg p-6 text-sm font-semibold">
        This page is for moderators only.
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
        className="border-border-structure bg-surface-2 grid grid-cols-2 gap-3 border-2 p-4 sm:grid-cols-3"
      >
        <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <span className={LABEL}>Receiver code</span>
          <input
            value={form.receiverCode ?? ""}
            onChange={(e) => set("receiverCode", e.target.value)}
            placeholder="CJP-…"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Item</span>
          <input
            value={form.itemName ?? ""}
            onChange={(e) => set("itemName", e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Supporter name</span>
          <input
            value={form.supporterName ?? ""}
            onChange={(e) => set("supporterName", e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Quantity</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.qty ?? ""}
            onChange={(e) => set("qty", e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Platform</span>
          <select
            value={form.platform ?? ""}
            onChange={(e) => set("platform", e.target.value)}
            className={FIELD}
          >
            <option value="">Any</option>
            {Object.values(FULFILMENT_PLATFORM).map((p) => (
              <option key={p} value={p}>
                {FULFILMENT_PLATFORM_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Status</span>
          <select
            value={form.state ?? ""}
            onChange={(e) => set("state", e.target.value)}
            className={FIELD}
          >
            <option value="">Any</option>
            {CLAIM_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>From date</span>
          <input
            type="date"
            value={form.dateFrom ?? ""}
            onChange={(e) => set("dateFrom", e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>To date</span>
          <input
            type="date"
            value={form.dateTo ?? ""}
            onChange={(e) => set("dateTo", e.target.value)}
            className={FIELD}
          />
        </label>

        <button
          type="submit"
          disabled={state === "searching"}
          className="border-border-strong bg-primary text-brand-ink col-span-2 border-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-60 sm:col-span-1 sm:self-end"
        >
          {state === "searching" ? "Searching…" : "Search"}
        </button>
      </form>

      {state === "error" && (
        <p className="text-danger text-sm">Search failed — try again.</p>
      )}
      {state === "done" && results.length === 0 && (
        <p className="text-fg-muted text-sm">No matching airdrops.</p>
      )}
      {results.length > 0 && (
        <ul className="flex list-none flex-col gap-3">
          {results.map((item) => (
            <ContributionReviewCard
              key={item.id}
              item={item}
              onReviewed={updateResult}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
