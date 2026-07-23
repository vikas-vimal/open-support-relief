import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { appConfig } from "@/config/app.config";

interface BoardHeaderProps {
  shortItemCount: number;
  isOnline: boolean;
}

/**
 * Masthead. Carries no location data at all — the coarse area label moved out
 * with the rebrand, and the full address lives behind the login-gated reveal
 * endpoint, so nothing here can leak a drop point.
 *
 * All copy comes from config/app.config.ts; stickiness is owned by the parent,
 * which pins this together with the search bar as one block.
 */
export function BoardHeader({ shortItemCount, isOnline }: BoardHeaderProps) {
  const { brand, copy } = appConfig;

  return (
    <div className="bg-header-bg border-border-structure border-b-2">
      <div className="mx-auto flex max-w-3xl flex-col gap-0.5 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* The brand name is long and Bowlby One is a wide face — it needs the
              smaller mobile step and room to wrap, rather than shoving the
              toggle and badge off the row. */}
          {/* Wordmark only — no glyph. Bowlby One is a wide face and the name
              is long, so the emoji was costing a line break at 375px. */}
          <h1 className="text-fg font-display min-w-0 text-sm leading-tight uppercase sm:text-lg">
            {brand.name}
          </h1>

          <div className="flex shrink-0 items-center gap-2">
            {/* Supporter's own history — the standard top-right "my stuff" slot. */}
            <Link
              href="/my-airdrops"
              aria-label="My airdrops"
              title="My airdrops"
              className="border-border-strong bg-surface text-fg flex size-8 shrink-0 items-center justify-center rounded-icon border-2 text-sm leading-none"
            >
              <span aria-hidden="true">🧾</span>
            </Link>
            <ThemeToggle />

            {/* Both fills carry white text and are checked against 4.5:1 by
                lib/theme/contrast.spec.ts. The dot only blips when genuinely
                live — a pulsing "offline" would read as still-connected. */}
            <span
              role="status"
              className={`flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.14em] text-white uppercase ${
                isOnline ? "bg-live" : "bg-offline"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block size-1.5 rounded-full bg-white ${
                  isOnline ? "animate-blip" : ""
                }`}
              />
              {isOnline ? copy.liveLabel : copy.offlineLabel}
            </span>
          </div>
        </div>

        {/* Sentence case, no tracking: caps plus .18em pushed this onto two
            rows at 375px, which is exactly the space we were trying to save. */}
        <p className="text-fg truncate text-xs font-semibold">
          {brand.tagline}
          {shortItemCount > 0 &&
            ` · ${shortItemCount} ${copy.itemsShortSuffix}`}
        </p>
      </div>
    </div>
  );
}
