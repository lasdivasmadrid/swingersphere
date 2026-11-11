// www/sw.js — SwingerSphere Service Worker for PWA installation & offline shell caching
const CACHE_NAME = 'swingersphere-v1.1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/apple-touch-icon.png',
  './img/icon-maskable-512.png',
  './img/splash_logo.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('SW Precache error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Exclude API calls from service worker cache (network-only)
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback to app shell if html navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./app.html');
          }
        });
      })
  );
});
