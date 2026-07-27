'use client';

import { useEffect } from 'react';

/**
 * FCM init — lazy + idle.
 * Không import firebase SDK vào bundle layout; chỉ tải khi:
 * - đã có Notification.permission === 'granted'
 * - browser rảnh (requestIdleCallback / setTimeout)
 */
export default function FirebaseInitializer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Trang test tự gọi requestForToken — tránh race 2 luồng getToken → 401 FCM
    if (window.location.pathname.startsWith('/test-fcm')) return;
    // iOS: không auto-prompt — chỉ lấy token nếu user đã cấp quyền từ trước
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      try {
        // Dynamic import: firebase + messaging không vào initial JS
        const [{ requestForToken, onMessageListener }, { supabase }] = await Promise.all([
          import('@/lib/firebase'),
          import('@/lib/supabase'),
        ]);

        if (cancelled) return;

        const token = await requestForToken();
        if (!token || cancelled) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) return;

        const res = await fetch('/api/push/fcm-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fcmToken: token }),
        });

        const result = (await res.json()) as {
          success?: boolean;
          error?: string;
          forceGen?: number;
        };
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Không lưu được FCM token lên server.');
        }

        // Ack force-gen nền (user đã có permission → auto re-bind token)
        if (typeof result.forceGen === 'number') {
          try {
            const { PUSH_FORCE_GEN_STORAGE_KEY } = await import('@/lib/push-force-gen');
            localStorage.setItem(PUSH_FORCE_GEN_STORAGE_KEY, String(result.forceGen));
            const { markPushDeviceRegistered } = await import('@/lib/push-device-state');
            markPushDeviceRegistered();
          } catch {
            // ignore
          }
        }

        console.log('[FCM] Token registered successfully');

        const { toast } = await import('sonner');
        onMessageListener((payload) => {
          console.log('[FCM] Foreground message:', payload);
          const title = payload.notification?.title || 'Thông báo mới';
          const body = payload.notification?.body || '';
          
          toast(title, {
            description: body,
            duration: 5000,
            icon: '🔔',
          });
        });
      } catch (err) {
        console.error('[FCM] Setup error:', err);
      }
    };

    // Chạy khi browser rảnh — không cạnh tranh LCP/TTI
    const ric = window.requestIdleCallback?.bind(window);
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (ric) {
      idleId = ric(() => { void run(); }, { timeout: 4000 });
    } else {
      timeoutId = setTimeout(() => { void run(); }, 2500);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
