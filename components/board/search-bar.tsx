"use client";

import { appConfig } from "@/config/app.config";

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  resultCount: number;
}

/**
 * Sticky search over the already-loaded board.
 *
 * Filters client-side against the current snapshot, so it costs no network,
 * returns instantly, and keeps working offline. It is pinned rather than tucked
 * behind an icon because it doubles as the duplicate guard: someone who cannot
 * find an item is the same person about to propose one.
 */
export function SearchBar({ value, onChange, resultCount }: SearchBarProps) {
  const hasQuery = value.trim().length > 0;

  return (
    <div className="bg-canvas border-border-soft border-b">
      <div className="mx-auto max-w-3xl px-4 py-2.5">
        <div className="border-border-strong bg-surface flex items-center gap-2 rounded-pill border-2 px-3.5 py-2">
          <span aria-hidden="true" className="text-sm">
            🔎
          </span>

          <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={appConfig.copy.searchPlaceholder}
            aria-label="Search airdrops"
            aria-describedby={hasQuery ? "search-result-count" : undefined}
            className="text-fg placeholder:text-fg-muted min-w-0 flex-1 bg-transparent text-sm focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />

          {hasQuery && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="text-fg-muted hover:text-fg shrink-0 px-1 text-sm leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {hasQuery && (
          <p
            id="search-result-count"
            role="status"
            className="text-fg-muted mt-1.5 px-1 text-[0.6875rem]"
          >
            {resultCount === 0
              ? "No matching airdrops"
              : `${resultCount} matching ${resultCount === 1 ? "item" : "items"}`}
          </p>
        )}
      </div>
    </div>
  );
}
