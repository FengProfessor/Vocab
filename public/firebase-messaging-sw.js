// LingoPro Firebase Messaging Service Worker
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

// Active SW mới ngay, không kẹt "waiting" (tránh getToken treo vì SW chưa active)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Chrome PWA: cần fetch handler mới đủ điều kiện beforeinstallprompt / cài app
self.addEventListener('fetch', () => {
  // Pass-through — không cache, chỉ để trang installable
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message ', payload);
  
  const notificationTitle = payload.notification.title || 'LingoPro Update';
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://lingopro.online/icons/icon-192.webp',
    badge: 'https://lingopro.online/icons/icon-192.webp',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bấm vào thông báo → focus tab đang mở đúng URL, hoặc mở tab mới
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
