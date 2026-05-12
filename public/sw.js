// ============================================================
// LingoPro Service Worker - Handles both PWA caching and OneSignal Push
// iOS 16.4+ PWA Web Push: OneSignal MUST be in the same SW scope
// ============================================================

// Import OneSignal SDK - this MUST be first for push notifications to work
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// PWA install/activate lifecycle
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Minimal fetch handler (PWA requirement)
self.addEventListener('fetch', () => {
  // Pass-through: let network handle requests
});
