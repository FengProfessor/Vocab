// LingoPro Unified Service Worker (FCM Push Notifications & PWA App Shell Precache)
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyATgTyGPzlmi0ADwBsMJxEhgqJsjEiRftc",
  authDomain: "lingopro-9d2f8.firebaseapp.com",
  projectId: "lingopro-9d2f8",
  storageBucket: "lingopro-9d2f8.firebasestorage.app",
  messagingSenderId: "147138625371",
  appId: "1:147138625371:web:9d308e4337c9fe7399647e"
});

// Cache version constants
const SHELL_CACHE_NAME = 'lingopro-shell-v1';
const STATIC_CACHE_NAME = 'lingopro-static-v1';
const CURRENT_CACHES = [SHELL_CACHE_NAME, STATIC_CACHE_NAME];

// App Shell precached assets
const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.webp',
  '/icons/icon-512.webp',
];

// Precache App Shell assets on install and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.warn('[SW] Precache failed during install:', error);
        return self.skipWaiting();
      })
  );
});

// Clean up outdated cache versions on activate and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!CURRENT_CACHES.includes(cacheName)) {
            console.log('[SW] Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch routing strategies:
// 1. Non-GET or cross-origin: bypass
// 2. /api/: Network-Only bypass (zero interference with BFF Session Vault)
// 3. navigate: Network-First with cached page or /offline.html fallback
// 4. /_next/static/: Stale-While-Revalidate with lingopro-static-v1
// 5. /icons/ or static images / precached assets: Stale-While-Revalidate with lingopro-shell-v1
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // Cross-origin requests bypass SW caching
  if (url.origin !== self.location.origin) {
    return;
  }

  // Bypass API, Auth, and Admin routes completely to protect BFF Session Vault and Auth recovery integrity
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/admin')
  ) {
    return;
  }

  // Navigation requests: Network-First with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) {
            return cachedPage;
          }
          const offlineFallback = await caches.match('/offline.html');
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Next.js static bundles and chunks: Stale-While-Revalidate
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse);
              }
            })
            .catch(() => {});
          return cached;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Static icons, images, and precached assets: Stale-While-Revalidate
  const isStaticImage = url.pathname.startsWith('/icons/') || /\.(webp|png|jpg|jpeg|gif|svg|ico)$/i.test(url.pathname);
  const isPrecacheAsset = PRECACHE_ASSETS.includes(url.pathname);

  if (isStaticImage || isPrecacheAsset) {
    event.respondWith(
      caches.open(SHELL_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request, { ignoreSearch: true });
        if (cached) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse);
              }
            })
            .catch(() => {});
          return cached;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});

// Firebase Cloud Messaging background handler
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message', payload);

  const notification = payload.notification || {};
  const notificationTitle = notification.title || 'LingoPro Update';
  const notificationOptions = {
    body: notification.body || 'Bạn có từ đến hạn cần ôn.',
    icon: 'https://lingopro.online/icons/icon-192.webp',
    badge: 'https://lingopro.online/icons/icon-192.webp',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler: focus existing window or open target URL
self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  const data = event.notification.data || {};
  const rawUrl = data.url || (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || '/review';
  let targetUrl;
  try {
    targetUrl = new URL(rawUrl, self.location.origin).href;
  } catch {
    targetUrl = rawUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            if (clientUrl.pathname.startsWith('/review')) {
              matchingClient = client;
              break;
            }
            if (!matchingClient) {
              matchingClient = client;
            }
          }
        } catch {
          // ignore URL parsing error
        }
      }

      if (matchingClient) {
        if ('focus' in matchingClient) {
          matchingClient.focus();
        }
        if ('navigate' in matchingClient && matchingClient.url !== targetUrl) {
          return matchingClient.navigate(targetUrl);
        }
        return;
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
