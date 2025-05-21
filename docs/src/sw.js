const CACHE = 'alfa-lead-static-v1';
const ASSETS = [
  '/index.html', '/user.html', '/admin.html',
  '/styles.output.css', '/src/login.js', '/src/user.js',
  '/src/admin.js', '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});