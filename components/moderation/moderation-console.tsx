"use client";

import { useState } from "react";

import { ContributionSearch } from "@/components/moderation/contribution-search";
import { ItemRequestQueue } from "@/components/moderation/item-request-queue";
import { ModerationQueue } from "@/components/moderation/moderation-queue";

const TAB = {
  CLAIMS: "CLAIMS",
  REQUESTS: "REQUESTS",
  SEARCH: "SEARCH",
} as const;

type Tab = (typeof TAB)[keyof typeof TAB];

const TABS: readonly { id: Tab; label: string; panelId: string }[] = [
  { id: TAB.CLAIMS, label: "Airdrop claims", panelId: "panel-claims" },
  { id: TAB.REQUESTS, label: "Item requests", panelId: "panel-requests" },
  { id: TAB.SEARCH, label: "Search", panelId: "panel-search" },
];

/**
 * Two moderator queues behind one tab strip: proof-backed airdrop claims, and
 * publicly proposed items awaiting a board decision. Both mount client-side and
 * are gated server-side, so an unauthorised visitor sees each queue's own denied
 * state rather than any data.
 */
export function ModerationConsole() {
  const [active, setActive] = useState<Tab>(TAB.CLAIMS);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Moderation queues"
        className="border-border-structure bg-header-bg flex border-b-2"
      >
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id.toLowerCase()}`}
              aria-selected={selected}
              aria-controls={tab.panelId}
              onClick={() => setActive(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-semibold ${
                selected
                  ? "text-fg border-primary border-b-2"
                  : "text-fg-muted border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="panel-claims"
        aria-labelledby="tab-claims"
        hidden={active !== TAB.CLAIMS}
      >
        {active === TAB.CLAIMS && <ModerationQueue />}
      </div>
      <div
        role="tabpanel"
        id="panel-requests"
        aria-labelledby="tab-requests"
        hidden={active !== TAB.REQUESTS}
      >
        {active === TAB.REQUESTS && <ItemRequestQueue />}
      </div>
      <div
        role="tabpanel"
        id="panel-search"
        aria-labelledby="tab-search"
        hidden={active !== TAB.SEARCH}
      >
        {active === TAB.SEARCH && <ContributionSearch />}
      </div>
    </div>
  );
}
