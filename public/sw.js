// Service worker for a Next.js app on Netlify. Generated from D:\Code\_play-tools\sw-template.js.
// Pages: network first, falling back to cache when offline (so updates always show).
// Build assets (/_next/static, hashed): cache first. Other same-origin + listed origins: stale-while-revalidate.
const CACHE = 'ayahecho-v2';
const EXTRA_ORIGINS = ["https://fonts.googleapis.com","https://fonts.gstatic.com","https://api.alquran.cloud"];
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Files the page loaded before this worker took control (sent by sw-register) would
// otherwise never be cached, leaving a blank app on the first offline launch.
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'CACHE_URLS') return;
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(
    event.data.urls
      .filter((u) => { const o = new URL(u).origin; return o === self.location.origin || EXTRA_ORIGINS.includes(o); })
      .map((u) => cache.match(u).then((hit) => hit || fetch(u).then((res) => put(u, res)).catch(() => {})))
  )));
});

const put = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !EXTRA_ORIGINS.includes(url.origin)) return;
  if (req.headers.has('range')) return; // audio/video streaming
  if (sameOrigin && url.pathname.startsWith('/.well-known/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => put(req, res))
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req).then((res) => put(req, res)).catch(() => caches.match(req)));
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => put(req, res))));
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => put(req, res)).catch(() => cached);
      return cached || network;
    })
  );
});
