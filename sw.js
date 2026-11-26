'use strict';

const CACHE_NAME = 'hmc-offline-v11';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/base.css',
  './css/games.css',
  './js/storage.js',
  './js/data.js',
  './js/audio.js',
  './js/voice-pack.js',
  './js/svg-wardrobe.js',
  './js/svg-buddies.js',
  './js/svg.js',
  './js/effects.js',
  './js/classic-toys.js',
  './js/mode-classic.js',
  './js/mode-colors.js',
  './js/mode-math.js',
  './js/mode-shapes.js',
  './js/habit-bath.js',
  './js/habit-bedtime.js',
  './js/mode-play.js',
  './js/wardrobe.js',
  './js/parent.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (!req || req.method !== 'GET') return;

  let reqUrl;
  try {
    reqUrl = new URL(req.url);
  } catch (e) {
    return;
  }
  if (reqUrl.origin !== self.location.origin) return;

  // Network-first with offline cache fallback: always serves fresh edits when online,
  // and falls back seamlessly to cached assets when played offline as a PWA.
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(req, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(req, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
