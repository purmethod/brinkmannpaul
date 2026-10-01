// atelier service worker: installable pwa + android share target (files → /share)
const SHARE_CACHE = 'atelier-share';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(
      (async () => {
        const form = await event.request.formData();
        const files = form.getAll('media').filter((f) => typeof f !== 'string');
        const cache = await caches.open(SHARE_CACHE);
        await Promise.all((await cache.keys()).map((k) => cache.delete(k)));
        await Promise.all(
          files.map((f, i) =>
            cache.put(`/shared/${i}`, new Response(f, { headers: { 'content-type': f.type, 'x-filename': encodeURIComponent(f.name) } })),
          ),
        );
        const text = form.get('text') || form.get('title') || '';
        return Response.redirect(`/share?n=${files.length}&text=${encodeURIComponent(text)}`, 303);
      })(),
    );
  }
});
