"use client";

import { useMemo, useState } from "react";

import { BoardHeader } from "@/components/board/board-header";
import { BoardSkeleton } from "@/components/board/board-skeleton";
import { CategoryFilterBar } from "@/components/board/category-filter";
import { FreshnessBanner } from "@/components/board/freshness-banner";
import { NeedCard } from "@/components/board/need-card";
import { PulseTicker } from "@/components/board/pulse-ticker";
import { SearchBar } from "@/components/board/search-bar";
import { ContributeSheet } from "@/components/contribute/contribute-sheet";
import { RequestItemSheet } from "@/components/request-item/request-item-sheet";
import { PosterButton } from "@/components/ui/poster-button";
import {
  AIRDROP_PAGE_SIZE,
  CATEGORY_FILTER_ALL,
  type CategoryFilter,
} from "@/lib/domain/airdrop.constants";
import type { NeedSummary } from "@/lib/domain/airdrop.types";
import { formatQuantity } from "@/lib/domain/format.util";
import {
  countNeedsByFilter,
  countShortItems,
  selectVisibleNeeds,
} from "@/lib/domain/needs.util";
import { useBoardQuery } from "@/lib/hooks/use-board-query";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useI18n } from "@/lib/i18n/use-i18n";

const EMPTY_NEEDS: readonly NeedSummary[] = [];

export function AirdropBoard() {
  const { snapshot, isStale, lastUpdatedAt } = useBoardQuery();
  const isOnline = useOnlineStatus();
  const { t } = useI18n();

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>(CATEGORY_FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNeed, setSelectedNeed] = useState<NeedSummary | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(AIRDROP_PAGE_SIZE);

  const needs = snapshot?.needs ?? EMPTY_NEEDS;

  const filterCounts = useMemo(() => countNeedsByFilter(needs), [needs]);
  const matchingNeeds = useMemo(
    () => selectVisibleNeeds(needs, categoryFilter, searchQuery),
    [needs, categoryFilter, searchQuery],
  );

  /*
   * Reset the page window whenever the filter or query changes — otherwise
   * "load more" followed by a search leaves a stale window open on a completely
   * different list. Adjusted during render rather than in an effect: that is
   * React's documented pattern for derived state, avoids an extra paint, and
   * keeps clear of the set-state-in-effect lint rule.
   */
  const windowKey = `${categoryFilter}::${searchQuery.trim()}`;
  const [previousWindowKey, setPreviousWindowKey] = useState(windowKey);
  if (previousWindowKey !== windowKey) {
    setPreviousWindowKey(windowKey);
    setVisibleCount(AIRDROP_PAGE_SIZE);
  }

  const pagedNeeds = matchingNeeds.slice(0, visibleCount);
  const remainingCount = matchingNeeds.length - pagedNeeds.length;
  const trimmedQuery = searchQuery.trim();

  function viewExistingNeed(need: NeedSummary): void {
    // Close the proposal first; the contribute sheet opens on the next effect
    // pass because it is mounted after this one.
    setIsRequestOpen(false);
    setSearchQuery("");
    setSelectedNeed(need);
  }

  return (
    <>
      {/* Masthead and search pin together: search doubles as the duplicate
          guard, so it has to stay reachable without scrolling back up. */}
      <div className="sticky top-0 z-30">
        <BoardHeader
          shortItemCount={countShortItems(needs)}
          isOnline={isOnline}
        />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={matchingNeeds.length}
        />
      </div>

      <PulseTicker />

      <main
        id="airdrop-board"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4"
      >
        {snapshot && lastUpdatedAt && (
          <FreshnessBanner
            isOnline={isOnline}
            isStale={isStale}
            lastUpdatedAt={lastUpdatedAt}
          />
        )}

        <CategoryFilterBar
          selected={categoryFilter}
          onSelect={setCategoryFilter}
          counts={filterCounts}
        />

        {snapshot === null ? (
          <BoardSkeleton />
        ) : pagedNeeds.length === 0 ? (
          /* The empty search result is the intended route into a proposal:
             by this point every near-match has already been shown. */
          <div className="border-border-soft flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-4 py-8 text-center">
            <p className="text-fg-muted text-xs font-semibold">
              {trimmedQuery
                ? t("board.nothingMatches", { query: trimmedQuery })
                : t("board.nothingCategory")}
            </p>
            {trimmedQuery && (
              <div className="w-full max-w-xs">
                <PosterButton onClick={() => setIsRequestOpen(true)}>
                  {t("board.requestQuoted", { query: trimmedQuery })}
                </PosterButton>
              </div>
            )}
          </div>
        ) : (
          <ul className="flex list-none flex-col gap-3">
            {pagedNeeds.map((need) => (
              <li key={need.id}>
                <NeedCard need={need} onContribute={setSelectedNeed} />
              </li>
            ))}
          </ul>
        )}

        {snapshot !== null && pagedNeeds.length > 0 && (
          <div className="flex flex-col gap-2">
            {remainingCount > 0 && (
              <PosterButton
                onClick={() =>
                  setVisibleCount((current) => current + AIRDROP_PAGE_SIZE)
                }
              >
                {t("cta.loadMore", { count: formatQuantity(remainingCount) })}
              </PosterButton>
            )}
            <PosterButton
              variant="secondary"
              onClick={() => setIsRequestOpen(true)}
            >
              <span aria-hidden="true">＋</span>
              {t("cta.request")}
            </PosterButton>
          </div>
        )}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-8">
        <p className="border-border-soft text-fg-muted border-t pt-4 text-center text-[0.6875rem] leading-relaxed">
          {t("footer.note")}
        </p>
      </footer>

      <RequestItemSheet
        isOpen={isRequestOpen}
        initialName={trimmedQuery}
        needs={needs}
        onDismiss={() => setIsRequestOpen(false)}
        onViewExisting={viewExistingNeed}
      />

      <ContributeSheet
        need={selectedNeed}
        dropPoint={snapshot?.site.dropPoints[0] ?? null}
        onDismiss={() => setSelectedNeed(null)}
      />
    </>
  );
}
