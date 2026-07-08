'use client';

import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { markPushDeviceRegistered } from '@/lib/push-device-state';
import { supabase } from '@/lib/supabase';

export default function FirebaseInitializer() {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        // Trang test tự gọi requestForToken — tránh race 2 luồng getToken → 401 FCM
        if (window.location.pathname.startsWith('/test-fcm')) return;

        // iOS: không auto-prompt — chỉ lấy token nếu user đã cấp quyền từ trước
        // Nếu chưa có quyền, user phải bấm nút tại /test-fcm để trigger từ gesture
        if (Notification.permission !== 'granted') return;

        // 1. Lấy Token từ thiết bị
        const token = await requestForToken();
        
        if (token) {
          // 2. Lấy session hiện tại để có access_token
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // 3. Gửi Token lên server (auth qua JWT, không gửi userId trong body)
            const res = await fetch('/api/push/fcm-register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ fcmToken: token }),
            });

            const result = (await res.json()) as { success?: boolean; error?: string };
            if (!res.ok || !result.success) {
              throw new Error(result.error || 'Không lưu được FCM token lên server.');
            }

            markPushDeviceRegistered();
            console.log('[FCM] Token registered successfully');
          }
        }
      } catch (err) {
        console.error('[FCM] Setup error:', err);
      }
    };

    if (typeof window !== 'undefined') {
      setupFCM();

      onMessageListener()?.then((payload) => {
        console.log('[FCM] Foreground message:', payload);
      });
    }
  }, []);

  return null;
}
