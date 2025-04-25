const CACHE = 'alfalead-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/promotor.html',
  '/executive.html',
  '/admin.html',
  '/css/styles.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/pages/promotor.js',
  '/js/pages/executive.js',
  '/js/pages/admin.js'
];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key===CACHE?null:caches.delete(key)))
    )
  );
  self.clients.claim();
});
self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(cached =>
      cached || fetch(evt.request).then(resp => {
        caches.open(CACHE).then(c=>c.put(evt.request, resp.clone()));
        return resp;
      })
    )
  );
});
