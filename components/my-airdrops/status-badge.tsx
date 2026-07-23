"use client";

import type { MyContribution } from "@/lib/api/schemas/my-contributions.schema";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/use-i18n";

type ClaimState = MyContribution["state"];

/*
 * Supporter-facing wording. "Verified" is the received/confirmed state a
 * volunteer set after checking the proof; "Rejected" means it wasn't accepted
 * (e.g. proof didn't match) and the board count was given back.
 */
const BADGE: Readonly<Record<ClaimState, { key: MessageKey; className: string }>> =
  {
    PENDING: { key: "status.pending", className: "border-warn text-warn" },
    VERIFIED: { key: "status.verified", className: "border-success text-success" },
    REJECTED: { key: "status.rejected", className: "border-danger text-danger" },
    DISPUTED: { key: "status.disputed", className: "border-danger text-danger" },
  };

export function StatusBadge({ state }: { state: ClaimState }) {
  const { t } = useI18n();
  const { key, className } = BADGE[state];
  return (
    <span
      className={`label-track shrink-0 border-2 px-2 py-1 text-[0.625rem] ${className}`}
    >
      {t(key)}
    </span>
  );
}
