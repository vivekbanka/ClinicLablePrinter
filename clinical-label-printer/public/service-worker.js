// vCare Services Lab PWA - Service Worker
const CACHE_NAME = 'vcarelab-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) return;

  // Skip print server requests (always network)
  if (event.request.url.includes('/print')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background sync for queued print jobs
self.addEventListener('sync', (event) => {
  if (event.tag === 'print-queue') {
    event.waitUntil(processPrintQueue());
  }
});

async function processPrintQueue() {
  // In production, read queued ZPL jobs from IndexedDB and retry sending
  console.log('[SW] Processing queued print jobs...');
}
