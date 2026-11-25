/* Service worker — l'app funziona offline.
   È un template: in build vite.config.js sostituisce i segnaposto
   con l'hash della build e la lista dei file generati (JS/CSS con hash). */

const CACHE = 'rating-__VERSIONE__';
// i font hanno una cache a parte, che non si svuota a ogni nuova versione dell'app
const CACHE_FONT = 'rating-font';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  '__FILE_BUILD__'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== CACHE_FONT).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts (Bricolage Grotesque, Inter): cache-first, aggiornati in background.
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    const net = caches.open(CACHE_FONT).then((c) => fetch(req).then((res) => {
      // risposte opache (CSS e font cross-origin) hanno status 0: si tengono lo stesso
      if (res.ok || res.type === 'opaque') return c.put(req, res.clone()).then(() => res);
      return res;
    }));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(caches.match(req, { cacheName: CACHE_FONT }).then((hit) => hit || net));
    return;
  }

  if (url.origin !== location.origin) return;

  // App shell: prima la rete, così gli aggiornamenti arrivano; la cache serve offline.
  // Solo le risposte riuscite sostituiscono la copia offline; index.html fa da ripiego solo per le pagine.
  const net = fetch(req).then((res) => {
    if (!res.ok) return res;
    const copy = res.clone();
    return caches.open(CACHE).then((c) => c.put(req, copy)).then(() => res, () => res);
  });
  e.waitUntil(net.catch(() => {}));
  e.respondWith(net.catch(() => caches.match(req).then((hit) =>
    hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
