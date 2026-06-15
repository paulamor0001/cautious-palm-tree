// service-worker.js
// Cache-first for the app shell. Bumping CACHE_VERSION invalidates old caches.
const CACHE_VERSION = 'dino-times-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/constants.js',
  './js/state.js',
  './js/facts.js',
  './js/audio.js',
  './js/views/home.js',
  './js/views/dig.js',
  './js/views/museum.js',
  './js/views/sanctuary.js',
  './data/species.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      const cache = await caches.open(CACHE_VERSION);
      cache.put(event.request, res.clone());
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});
