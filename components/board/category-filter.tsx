"use client";

import {
  CATEGORY_FILTER_ALL,
  CATEGORY_FILTER_ALL_EMOJI,
  AIRDROP_CATEGORY_EMOJI,
  AIRDROP_CATEGORY_LABEL,
  AIRDROP_CATEGORY_ORDER,
  type CategoryFilter,
} from "@/lib/domain/airdrop.constants";

interface CategoryFilterBarProps {
  selected: CategoryFilter;
  onSelect: (filter: CategoryFilter) => void;
  /** Item counts per filter, so empty categories can be visibly disabled. */
  counts: Readonly<Record<CategoryFilter, number>>;
}

const FILTERS: readonly CategoryFilter[] = [
  CATEGORY_FILTER_ALL,
  ...AIRDROP_CATEGORY_ORDER,
];

function filterLabel(filter: CategoryFilter): string {
  return filter === CATEGORY_FILTER_ALL ? "All" : AIRDROP_CATEGORY_LABEL[filter];
}

function filterEmoji(filter: CategoryFilter): string {
  return filter === CATEGORY_FILTER_ALL
    ? CATEGORY_FILTER_ALL_EMOJI
    : AIRDROP_CATEGORY_EMOJI[filter];
}

/**
 * Horizontally scrolling chip row.
 *
 * Uses a radiogroup rather than tabs: these filter one list in place, they do
 * not swap panels, so arrow-key semantics should be "pick one of a set".
 *
 * Deliberately NOT using `label-track` — the house .18em tracking made these
 * hard to read at chip size. Emoji carry recognition instead.
 */
export function CategoryFilterBar({
  selected,
  onSelect,
  counts,
}: CategoryFilterBarProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Filter airdrops by category"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {FILTERS.map((filter) => {
        const isSelected = filter === selected;
        const count = counts[filter] ?? 0;
        const isEmpty = count === 0;

        return (
          <button
            key={filter}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isEmpty && !isSelected}
            onClick={() => onSelect(filter)}
            className={[
              "border-border-strong flex shrink-0 items-center gap-1.5 rounded-pill border-2 px-3.5 py-2",
              // 14px, up from 12px — the chips were the smallest tap-and-read
              // target on the board.
              "text-sm font-semibold whitespace-nowrap",
              "disabled:cursor-not-allowed disabled:opacity-40",
              isSelected
                ? "bg-fg text-canvas"
                : "bg-surface text-fg hover:bg-surface-2",
            ].join(" ")}
          >
            <span aria-hidden="true">{filterEmoji(filter)}</span>
            {filterLabel(filter)}
            <span className="font-mono text-xs tabular-nums opacity-70">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
