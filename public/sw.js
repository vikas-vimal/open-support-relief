/*
 * Service worker for Airdrops for Cockroaches.
 *
 * Hand-written rather than generated: Serwist requires Webpack, and Next 16
 * defaults to Turbopack. Our needs are small enough that the framework fight
 * is not worth it.
 *
 * ---------------------------------------------------------------------------
 * SAFETY — read before changing the routing below.
 *
 * This worker uses an ALLOW-LIST. Nothing is cached unless it matches one of
 * the rules in `isCacheable`. That is deliberate and must stay that way.
 *
 * A deny-list would eventually let an authenticated response through, and the
 * response that matters here is the drop-point reveal: caching it would write a
 * volunteer's street address and phone number to disk, where it survives sign
 * out AND the server-side `isFrozen` kill switch. No API response is ever
 * cached — not even a "harmless" one.
 * ---------------------------------------------------------------------------
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `airdrops-${CACHE_VERSION}`;

/** Precached so the very first offline navigation has a shell to render. */
const PRECACHE_URLS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // Individually, so one 404 cannot fail the whole install.
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("airdrops-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * The allow-list. Same-origin GETs only, and never the API.
 */
function isCacheable(request, url) {
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;

  // Hard stop. Covers the drop-point reveal and every future authenticated route.
  if (url.pathname.startsWith("/api/")) return false;

  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname === "/manifest.webmanifest") return true;
  if (/\.(?:png|svg|ico|webp|woff2?)$/.test(url.pathname)) return true;

  return request.mode === "navigate";
}

/** Content-hashed assets never change under a given URL, so cache wins. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Navigation: network wins when it can, so an online user never gets a stale
 * app shell. The cache is strictly a fallback for when the network cannot
 * answer — which at a protest site is often.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = (await caches.match(request)) ?? (await caches.match("/"));
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!isCacheable(event.request, url)) return;

  event.respondWith(
    event.request.mode === "navigate"
      ? networkFirst(event.request)
      : cacheFirst(event.request),
  );
});
