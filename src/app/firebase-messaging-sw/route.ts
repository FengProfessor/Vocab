import { firebaseWebConfig, FIREBASE_SW_COMPAT_VERSION } from '@/lib/firebase-public-config';

const FIREBASE_COMPAT_VERSION = FIREBASE_SW_COMPAT_VERSION;

export async function GET(): Promise<Response> {
  const script = `
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(firebaseWebConfig)});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Chrome PWA: cần fetch handler mới đủ điều kiện beforeinstallprompt / cài app
self.addEventListener('fetch', () => {
  // Pass-through — không cache, chỉ để trang installable
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message', payload);

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

self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
`.trim();

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
