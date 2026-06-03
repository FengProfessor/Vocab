// LingoPro Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message ', payload);
  
  const notificationTitle = payload.notification.title || 'LingoPro Update';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bấm vào thông báo → focus tab đang mở đúng URL, hoặc mở tab mới
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
