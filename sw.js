// Offline cache. Page loads network-first (so updates arrive), assets cache-first.
const C = 'events-v2';
const SHELL = [
  './', './index.html', './manifest.json', './icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {                       // the app page: try network, fall back to cache offline
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(C).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(h => h || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
