"use client";

import { formatCompactQuantity } from "@/lib/domain/format.util";
import { usePulse } from "@/lib/hooks/use-pulse";

/**
 * Slim momentum line above the board — "N items delivered, M in the last 24h".
 *
 * Renders nothing until there is something to celebrate: a "0 delivered" ticker
 * on a fresh deployment reads as broken, not as a fresh start. Verified airdrops
 * only, so the number is real.
 */
export function PulseTicker() {
  const { data } = usePulse();

  if (!data || data.itemsAllTime === 0) return null;

  return (
    <p
      role="status"
      className="text-fg-muted border-border-soft mx-auto max-w-3xl border-b-2 px-4 py-2 text-center text-xs"
    >
      <span aria-hidden="true">🪂 </span>
      <span className="text-fg font-semibold">
        {formatCompactQuantity(data.itemsAllTime)}
      </span>{" "}
      items delivered
      {data.itemsLast24h > 0 && (
        <>
          {" · "}
          <span className="text-fg font-semibold">
            {formatCompactQuantity(data.itemsLast24h)}
          </span>{" "}
          in the last 24h
        </>
      )}
    </p>
  );
}
