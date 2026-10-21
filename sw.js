const PREFIX = `lock-clock:${self.registration.scope}:`;
const CACHE = `${PREFIX}v1`;
const FILES = ['./','./index.html','./style.css','./app.js','./clock.js','./manifest.webmanifest','./assets/lock-background.png','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
// No skipWaiting: an update must not interrupt a performance already in progress.
self.addEventListener('activate', event => event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key); await self.clients.claim(); })()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => { const cache = await caches.open(CACHE); const saved = await cache.match(event.request, { ignoreSearch:true }); if (saved) return saved; try { return await fetch(event.request); } catch { if (event.request.mode === 'navigate') return await cache.match('./index.html'); return Response.error(); } })());
});
