import Link from "next/link";

import { MyAirdrops } from "@/components/my-airdrops/my-airdrops";

/**
 * A supporter's own airdrop history. Static shell like every page; the list
 * loads client-side, scoped server-side to the caller's session.
 */
export default function MyAirdropsPage() {
  return (
    <>
      <header className="bg-header-bg border-border-structure border-b-2">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-fg font-display text-base leading-tight uppercase sm:text-lg">
              My airdrops
            </h1>
            <p className="text-fg-muted text-xs">
              What you&apos;ve sent and where it stands.
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
        <MyAirdrops />
      </main>
    </>
  );
}
