// Solo recursos públicos del cascarón. Jamás se guardan respuestas de API, sesión o datos de clientes.
const CACHE = 'inherent-public-v1';
const PRECACHE = ['/offline.html', '/brand/icon-192.png'];
const STATIC = /^\/(?:js\/|brand\/|app\.css$|primitives\.css$|tablas\.css$|manifest\.webmanifest$|offline\.html$)/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('inherent-public-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(async () => (await caches.open(CACHE)).match('/offline.html')));
    return;
  }
  if (!STATIC.test(url.pathname)) return;
  e.respondWith(fetch(req).then(async (res) => {
    if (res.ok && res.type === 'basic') {
      try { const cache = await caches.open(CACHE); await cache.put(req, res.clone()); }
      catch { /* el recurso de red sí sirve aunque el dispositivo no tenga espacio */ }
    }
    return res;
  }).catch(async () => (await caches.open(CACHE)).match(req) || Response.error()));
});
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Inherent OS', { body: d.body || '', icon: '/brand/icon-192.png', badge: '/brand/icon-192.png', tag: d.tag || undefined, data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  let url = self.location.origin + '/';
  try {
    const requested = new URL(e.notification.data?.url || '/', self.location.origin);
    if (requested.origin === self.location.origin) url = requested.href;
  } catch { /* un aviso malformado abre el inicio seguro */ }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    const w = ws.find((x) => x.url.startsWith(self.location.origin));
    if (w) { w.navigate(url); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
