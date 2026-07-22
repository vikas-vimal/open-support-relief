"use client";

import { useEffect, useState } from "react";

/**
 * Tracks browser connectivity for the freshness banner.
 *
 * Starts optimistically `true` so the server-prerendered HTML and the first
 * client render agree; the real value lands in the mount effect. `navigator.onLine`
 * only proves a link exists, not that requests succeed, so treat this as a hint —
 * the request layer's own failures are the authoritative staleness signal.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const syncStatus = (): void => setIsOnline(navigator.onLine);

    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);

    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  return isOnline;
}
