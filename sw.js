const PREFIX = `lock-clock:${self.registration.scope}:`;
const CACHE = `${PREFIX}v4`;
const FILES = ['./','./index.html','./update.html','./style.css','./lock-screen.css','./app.js','./clock.js','./clock-display.js','./local-assets.js','./local-font.js','./manifest.webmanifest','./assets/reference-lock.jpg','./assets/lock-background.png','./assets/clock-repair-mask.svg','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('message', event => { if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting(); });
// No skipWaiting: an update must not interrupt a performance already in progress.
self.addEventListener('activate', event => event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key); await self.clients.claim(); })()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => { const cache = await caches.open(CACHE); const saved = await cache.match(event.request, { ignoreSearch:true }); if (saved) return saved; try { return await fetch(event.request); } catch { if (event.request.mode === 'navigate') return await cache.match('./index.html'); return Response.error(); } })());
});
