"use client";

import { useEffect } from "react";

/**
 * Registers the service worker after mount. Renders nothing.
 *
 * PRODUCTION ONLY, and that is a correctness requirement rather than an
 * optimisation. The worker caches `/_next/static/*` cache-first, which is safe
 * in production because those URLs are content-hashed — but Turbopack's dev
 * chunks reuse stable filenames, so a cached dev bundle is served forever and
 * every subsequent CSS or JS edit silently fails to appear. (It cost a real
 * debugging session: a new Tailwind utility looked like it was not generating
 * when in fact the browser was replaying a stale stylesheet.)
 *
 * Registration is also deferred to the load event so it never competes with
 * first paint — on the 2G connections this app targets, a service worker fetch
 * during initial render is exactly the wrong trade.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
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
