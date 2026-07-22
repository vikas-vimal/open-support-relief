"use client";

import { useEffect } from "react";

/**
 * Registers the service worker after mount.
 *
 * Renders nothing. Registration is deliberately deferred to the load event so
 * it never competes with the first paint — on the 2G connections this app is
 * built for, a service worker fetch during initial render is exactly the wrong
 * trade.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = (): void => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
