const CACHE = 'alfalead-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/tailwindcss@^3/dist/tailwind.min.css',
  '/src/main.js'
];

// Install: cache shell
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve cache, then network fallback
self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(cached =>
      cached ||
      fetch(evt.request).then(resp => {
        // cache new resources
        return caches.open(CACHE).then(cache => {
          cache.put(evt.request, resp.clone());
          return resp;
        });
      })
    ).catch(() => cached)
  );
});
