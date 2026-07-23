"use client";

import { formatQuantity } from "@/lib/domain/format.util";
import { useContributorWall } from "@/lib/hooks/use-contributor-wall";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

/**
 * The public contributors wall — opt-in names ranked by verified quantity, with
 * everyone who stayed anonymous folded into one honest aggregate line.
 *
 * Every number here is verified: it reflects moderator-approved airdrops only,
 * so the ranking cannot be gamed with unverified proofs.
 */
export function ContributorWall() {
  const { data, isLoading, isError } = useContributorWall();

  if (isLoading) {
    return <p className="text-fg-muted p-6 text-sm">Loading the wall…</p>;
  }
  if (isError || !data) {
    return <p className="text-danger p-6 text-sm">Could not load the wall.</p>;
  }

  const isEmpty = data.leaders.length === 0 && data.anonymousSupporterCount === 0;
  if (isEmpty) {
    return (
      <div className="border-border-soft mx-auto mt-4 flex max-w-2xl flex-col items-center gap-2 border-2 border-dashed p-8 text-center">
        <p className="text-2xl" aria-hidden="true">
          🪂
        </p>
        <p className="text-fg text-sm font-semibold">No verified airdrops yet</p>
        <p className="text-fg-muted text-xs">
          Once airdrops are verified, top supporters show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 p-4">
      {data.leaders.length > 0 && (
        <ol className="flex list-none flex-col gap-2">
          {data.leaders.map((leader, index) => (
            <li
              key={`${leader.displayName}-${index}`}
              className="border-border-structure bg-surface flex items-center gap-3 border-2 px-4 py-3"
            >
              <span
                className="font-display text-fg-muted w-8 shrink-0 text-center text-sm"
                aria-hidden="true"
              >
                {MEDALS[index] ?? `#${index + 1}`}
              </span>
              <span className="text-fg min-w-0 flex-1 truncate text-sm font-semibold">
                {leader.displayName}
              </span>
              <span className="text-fg font-display shrink-0 text-base">
                {formatQuantity(leader.verifiedQty)}
                <span className="text-fg-muted ml-1 text-xs font-semibold">
                  sent
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {data.anonymousSupporterCount > 0 && (
        <p className="border-border-soft bg-surface-2 text-fg-muted border-2 border-dashed px-4 py-3 text-xs">
          + {data.anonymousSupporterCount} anonymous{" "}
          {data.anonymousSupporterCount === 1 ? "supporter" : "supporters"} sent{" "}
          <span className="text-fg font-semibold">
            {formatQuantity(data.anonymousQty)}
          </span>{" "}
          more.
        </p>
      )}
    </div>
  );
}
