"use client";

import { formatQuantity } from "@/lib/domain/format.util";

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (next: number) => void;
  unit: string;
}

const STEP = 5;
const PRESETS: readonly number[] = [5, 10, 25];

/**
 * Large-target quantity control. Presets carry most of the traffic — stepping
 * from 1 to 25 one tap at a time on a phone at a protest is not a real flow.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  unit,
}: QuantityStepperProps) {
  const clamp = (next: number): number => Math.min(max, Math.max(1, next));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - STEP))}
          disabled={value <= 1}
          aria-label={`Decrease quantity by ${STEP}`}
          className="poster-press size-14 shrink-0 rounded-card border-2 border-border-strong bg-surface text-2xl leading-none text-fg shadow-poster-sm disabled:opacity-40 disabled:shadow-none"
        >
          −
        </button>

        <label className="flex flex-1 flex-col items-center justify-center rounded-card border-2 border-border-strong bg-surface-2">
          <span className="sr-only">Quantity to send</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={value}
            onChange={(event) => onChange(clamp(Number(event.target.value)))}
            className="w-full bg-transparent text-center font-mono text-2xl font-bold text-fg tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="label-track pb-1 text-[0.625rem] text-fg-muted">
            {unit}
          </span>
        </label>

        <button
          type="button"
          onClick={() => onChange(clamp(value + STEP))}
          disabled={value >= max}
          aria-label={`Increase quantity by ${STEP}`}
          className="poster-press size-14 shrink-0 rounded-card border-2 border-border-strong bg-primary text-2xl leading-none text-brand-ink shadow-poster-sm disabled:opacity-40 disabled:shadow-none"
        >
          +
        </button>
      </div>

      <div className="flex gap-2">
        {PRESETS.filter((preset) => preset <= max).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-pressed={value === preset}
            className={`label-track flex-1 rounded-pill border-2 border-border-strong px-3 py-2 text-xs ${
              value === preset ? "bg-fg text-canvas" : "bg-surface text-fg"
            }`}
          >
            {preset}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(max)}
          aria-pressed={value === max}
          className={`label-track flex-1 rounded-pill border-2 border-border-strong px-3 py-2 text-xs ${
            value === max ? "bg-fg text-canvas" : "bg-surface text-fg"
          }`}
        >
          All {formatQuantity(max)}
        </button>
      </div>
    </div>
  );
}
