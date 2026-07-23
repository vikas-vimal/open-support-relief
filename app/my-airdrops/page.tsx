"use client";

import Link from "next/link";

import { MyAirdrops } from "@/components/my-airdrops/my-airdrops";
import { useI18n } from "@/lib/i18n/use-i18n";

/**
 * A supporter's own airdrop history. Static client shell like every page; the
 * list loads client-side, scoped server-side to the caller's session.
 */
export default function MyAirdropsPage() {
  const { t } = useI18n();

  return (
    <>
      <header className="bg-header-bg border-border-structure border-b-2">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-fg font-display text-base leading-tight uppercase sm:text-lg">
              {t("mine.title")}
            </h1>
            <p className="text-fg-muted text-xs">{t("mine.subtitle")}</p>
          </div>
          <Link
            href="/"
            className="border-border-strong bg-surface text-fg shrink-0 border-2 px-3 py-2 text-xs font-semibold"
          >
            {t("nav.board")}
          </Link>
        </div>
      </header>
      <main id="airdrop-board" className="flex-1">
        <MyAirdrops />
      </main>
    </>
  );
}
