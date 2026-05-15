// public/sw.js — Service Worker Imperio Público — Estrategia Cache optimizada
// Versión del caché — incrementar cuando cambie el SW para invalidar el caché viejo
const CACHE_VERSION = 'v3';
const CACHE_PAGES   = `imperiopublico-pages-${CACHE_VERSION}`;
const CACHE_ASSETS  = `imperiopublico-assets-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  console.log('[SW] Instalado - Imperio Público', CACHE_VERSION);
  // Pre-caché del shell (página offline de emergencia)
  event.waitUntil(
    caches.open(CACHE_ASSETS).then(cache => {
      return cache.addAll([
        '/icon.png',
        '/logo.png',
        '/manifest.json',
      ]).catch(() => {}); // Fallar silenciosamente si alguno no existe
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activado - Imperio Público', CACHE_VERSION);
  // Limpiar cachés viejos
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('imperiopublico-') && !key.endsWith(CACHE_VERSION))
          .map(key => { console.log('[SW] Eliminando caché viejo:', key); return caches.delete(key); })
      )
    ).then(() => clients.claim())
  );
});

// Manejar notificaciones push recibidas del servidor
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Imperio Público', body: event.data ? event.data.text() : 'Nueva noticia disponible' };
  }

  const options = {
    body: data.body || 'Lee la última noticia en Imperio Público',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    image: data.image || null,
    tag: data.tag || 'imperiopublico-news',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || 'https://imperiopublico.com',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: '\uD83D\uDCF0 Leer noticia', icon: '/icon.png' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '\uD83D\uDEA8 Nueva noticia — Imperio Público', options)
  );
});

// Manejar click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || 'https://imperiopublico.com';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── Estrategia de Caché Dual ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar GET del mismo origen
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // No cachear llamadas API — siempre frescas
  if (url.pathname.startsWith('/api/')) return;

  // Cache-First para assets estáticos (_next/static, iconos, imágenes públicas)
  const isStaticAsset = url.pathname.startsWith('/_next/static/') ||
                        url.pathname.startsWith('/_next/image') ||
                        /\.(png|jpg|jpeg|webp|avif|ico|svg|woff2?|css|js)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_ASSETS).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // Network-First para páginas HTML (noticias siempre frescas)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_PAGES).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Fallback offline: intentar servir desde caché
          caches.match(request).then(cached => cached || caches.match('/'))
        )
    );
  }
});
