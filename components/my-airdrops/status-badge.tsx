import type { MyContribution } from "@/lib/api/schemas/my-contributions.schema";

type ClaimState = MyContribution["state"];

/*
 * Supporter-facing wording. "Verified" is the received/confirmed state a
 * volunteer set after checking the proof; "Rejected" means it wasn't accepted
 * (e.g. proof didn't match) and the board count was given back.
 */
const BADGE: Readonly<Record<ClaimState, { label: string; className: string }>> =
  {
    PENDING: { label: "Awaiting check", className: "border-warn text-warn" },
    VERIFIED: { label: "Verified", className: "border-success text-success" },
    REJECTED: { label: "Not accepted", className: "border-danger text-danger" },
  };

export function StatusBadge({ state }: { state: ClaimState }) {
  const { label, className } = BADGE[state];
  return (
    <span
      className={`label-track shrink-0 border-2 px-2 py-1 text-[0.625rem] ${className}`}
    >
      {label}
    </span>
  );
}
