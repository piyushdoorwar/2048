/* Simple cache-first service worker for Cloudflare Pages/static hosting */

const CACHE_NAME = '2048-static-v1';

const PRECACHE_URLS = [
  'index.html',
  'styles.css',
  'scripts.js',
  'logo.png',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)))
      ),
      self.clients.claim()
    ])
  );
});


