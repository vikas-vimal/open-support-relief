"use client";

import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/lib/domain/needs.util";

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
      className="border-border-strong bg-surface-2 text-fg rounded-card border-2 px-3 py-2.5 text-xs font-semibold"
    >
      {isOnline ? "Showing saved list" : "Offline — showing saved list"}
      {relativeTime ? ` from ${relativeTime}` : ""}. Will refresh automatically.
    </p>
  );
}
