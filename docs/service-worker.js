const CACHE_NAME = "alfalead-cache-v1";
const urlsToCache = [
  "/AlfaLead/",
  "/AlfaLead/index.html",
  "/AlfaLead/style.css",
  "/AlfaLead/script.js",
  "/AlfaLead/manifest.json",
  "/AlfaLead/image/icon-192.png",
  "/AlfaLead/image/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
