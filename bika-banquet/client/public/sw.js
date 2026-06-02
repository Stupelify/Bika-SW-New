/*
 * Bika Banquet service worker.
 *
 * Goal: make the phone app (Capacitor WebView) open fast on repeat launches by
 * keeping a local copy of the content-hashed JS/CSS/font assets, WITHOUT
 * changing the deploy model. HTML pages stay network-first, so a new website
 * deploy is picked up on the next launch. The API and live updates are never
 * cached.
 *
 * Registered only on the native app (see CapacitorNativeShell).
 */

const STATIC_CACHE = 'bika-static-v1';

self.addEventListener('install', () => {
  // Take over as soon as possible.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older versions of this worker.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Content-hashed, immutable assets are safe to serve cache-first.
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only; let cross-origin (CDN images, etc.) pass straight through.
  if (url.origin !== self.location.origin) return;

  // Never cache the API, health checks, or server-sent events.
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') return;

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML navigations: always try the network first so deploys go live, fall
  // back to the last cached page only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
