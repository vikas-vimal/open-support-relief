import Link from "next/link";

import { ContributorWall } from "@/components/wall/contributor-wall";

/**
 * Public contributors wall. Static shell like every other page — the wall loads
 * client-side from the public `/api/contributors` endpoint.
 */
export default function WallPage() {
  return (
    <>
      <header className="bg-header-bg border-border-structure border-b-2">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-fg font-display text-base leading-tight uppercase sm:text-lg">
              Wall of supporters
            </h1>
            <p className="text-fg-muted text-xs">
              Verified airdrops, ranked. Thank you.
            </p>
          </div>
          <Link
            href="/"
            className="border-border-strong bg-surface text-fg shrink-0 border-2 px-3 py-2 text-xs font-semibold"
          >
            ← Board
          </Link>
        </div>
      </header>
      <main id="airdrop-board" className="flex-1">
        <ContributorWall />
      </main>
    </>
  );
}
