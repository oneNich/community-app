// Service worker disabled to prevent caching issues
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    caches.keys().then(names => names.forEach(name => caches.delete(name)));
});

self.addEventListener('fetch', (event) => {
    // Don't cache, just pass through
    event.respondWith(fetch(event.request));
});
