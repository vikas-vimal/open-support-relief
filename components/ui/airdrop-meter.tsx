"use client";

import { formatQuantity } from "@/lib/domain/format.util";
import { useI18n } from "@/lib/i18n/use-i18n";

interface AirdropMeterProps {
  itemName: string;
  unit: string;
  qtyRequested: number;
  qtyFulfilled: number;
  qtyReserved: number;
}

/**
 * Two-segment progress meter.
 *
 * Solid blue = already delivered. Hatched = held by active intent locks
 * (someone is ordering it right now). Showing the reserved band is what stops
 * ten people independently ordering the same 150 raincoats.
 *
 * The track is WHITE, not grey, and that is not a style choice: #0099ff scores
 * 2.39:1 against a grey track — the fill level becomes unreadable — versus
 * 3.00:1 against white. The 2px border is what makes the bar's extent legible.
 */
export function AirdropMeter({
  itemName,
  unit,
  qtyRequested,
  qtyFulfilled,
  qtyReserved,
}: AirdropMeterProps) {
  const { t } = useI18n();
  const safeRequested = Math.max(1, qtyRequested);
  const fulfilledPercent = Math.min(100, (qtyFulfilled / safeRequested) * 100);
  const reservedPercent = Math.min(
    100 - fulfilledPercent,
    (qtyReserved / safeRequested) * 100,
  );

  const reservedNote =
    qtyReserved > 0
      ? t("meter.reservedNow", { count: formatQuantity(qtyReserved) })
      : "";

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-valuenow={Math.round(fulfilledPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${t("meter.received", {
          item: itemName,
          done: formatQuantity(qtyFulfilled),
          total: formatQuantity(qtyRequested),
          unit,
        })}${reservedNote}`}
        className="border-border-strong bg-meter-track flex h-5 w-full overflow-hidden rounded-card border-2"
      >
        <div
          className="h-full bg-meter"
          style={{ width: `${fulfilledPercent}%` }}
        />
        {/* Diagonal hatch, not just a lighter blue: the reserved band is only
            1.53:1 against the fill, so texture — not hue — is what makes it
            distinguishable, including for colour-blind users. */}
        <div
          className="bg-meter-soft h-full"
          style={{
            width: `${reservedPercent}%`,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent 0 4px, rgba(26,17,8,0.45) 4px 8px)",
          }}
        />
      </div>

      <p className="text-fg-muted font-mono text-xs tabular-nums">
        <span className="text-fg font-bold">{formatQuantity(qtyFulfilled)}</span>
        {" / "}
        {formatQuantity(qtyRequested)} {unit}
        {qtyReserved > 0 && (
          <span>
            {" · "}
            {t("meter.beingOrdered", { count: formatQuantity(qtyReserved) })}
          </span>
        )}
      </p>
    </div>
  );
}
