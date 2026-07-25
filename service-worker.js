// Zunexa — service worker
// Only job: (1) satisfy Chrome/Android's "installable PWA" requirement
// (a manifest alone isn't enough, a registered SW with a fetch handler
// is required too), and (2) let the app shell open when offline.
// It deliberately does NOT try to cache API/Supabase calls — those
// must always hit the network, offline caching them would mean
// showing stale chat data or broken AI answers.

const CACHE_NAME = 'zunexa-shell-v1';
const SHELL_FILES = [
  './ai.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never intercept anything but same-origin GET page/asset requests —
  // Supabase, APIs, and any cross-origin call always go straight to
  // the network untouched.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./ai.html')))
  );
});
