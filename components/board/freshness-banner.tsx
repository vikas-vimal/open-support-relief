"use client";

import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/lib/domain/needs.util";
import { useI18n } from "@/lib/i18n/use-i18n";

interface FreshnessBannerProps {
  isOnline: boolean;
  /** True when the board came from the IndexedDB cache rather than the network. */
  isStale: boolean;
  lastUpdatedAt: string;
}

/**
 * Shown whenever the board may be out of date — either the browser reports no
 * connection, or we are painting a cached snapshot.
 *
 * Both conditions matter independently: a request can fail while
 * `navigator.onLine` still reports true (captive portal, dead upstream), and
 * that is precisely the protest-site failure mode. An empty screen is never
 * acceptable here — a stale list clearly marked as old always beats nothing.
 */
export function FreshnessBanner({
  isOnline,
  isStale,
  lastUpdatedAt,
}: FreshnessBannerProps) {
  const { t } = useI18n();
  // Computed after mount so the prerendered HTML never bakes in a build-time clock.
  const [relativeTime, setRelativeTime] = useState<string | null>(null);

  useEffect(() => {
    const update = (): void =>
      setRelativeTime(formatRelativeTime(lastUpdatedAt, new Date()));

    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [lastUpdatedAt]);

  if (isOnline && !isStale) return null;

  return (
    <p
      role="status"
      className="border-border-structure bg-surface-2 text-fg rounded-card border-2 px-3 py-2.5 text-xs font-semibold"
    >
      {isOnline ? t("freshness.savedOnline") : t("freshness.savedOffline")}
      {relativeTime ? ` ${t("freshness.fromTime", { time: relativeTime })}` : ""}
      . {t("freshness.willRefresh")}
    </p>
  );
}
