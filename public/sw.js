// public/sw.js — Service Worker para Web Push Notifications
// Este archivo DEBE estar en /public/ para que sea accesible desde la raíz del sitio

self.addEventListener('install', (event) => {
  console.log('[SW] Instalado - Imperio Público');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activado - Imperio Público');
  event.waitUntil(clients.claim());
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
      { action: 'open', title: '📰 Leer noticia', icon: '/icon.png' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🚨 Nueva noticia — Imperio Público', options)
  );
});

// Manejar click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || 'https://imperiopublico.com';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si el sitio ya está abierto, hacer focus
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierto, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Estrategia de caché: Network First para artículos, Cache First para assets
self.addEventListener('fetch', (event) => {
  // Solo interceptar requests del mismo origen
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Ignorar API calls (no cachear)
  if (event.request.url.includes('/api/')) return;

  // Ignorar POST requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear respuestas válidas de páginas HTML
        if (response.ok && event.request.mode === 'navigate') {
          const responseClone = response.clone();
          caches.open('imperiopublico-pages-v1').then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: intentar servir desde caché
        return caches.match(event.request);
      })
  );
});
