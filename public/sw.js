/* Service worker mínimo — instalable + offline básico.
   Estrategia: navegaciones network-first (para tomar siempre el último
   deploy) con fallback al index cacheado; assets con hash cache-first. */
const CACHE = 'inc-v1';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // no interferir con Supabase/CDN

  // Navegaciones: red primero, cae al index cacheado sin conexión
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put('/', res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || caches.match('/index.html'))),
    );
    return;
  }

  // Assets con hash (inmutables): cache primero
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          caches.open(CACHE).then((c) => c.put(req, res.clone())).catch(() => {});
          return res;
        }),
      ),
    );
  }
});
