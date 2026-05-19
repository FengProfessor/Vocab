'use client';

import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

export default function FirebaseInitializer() {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        // iOS: không auto-prompt — chỉ lấy token nếu user đã cấp quyền từ trước
        // Nếu chưa có quyền, user phải bấm nút tại /test-fcm để trigger từ gesture
        if (Notification.permission !== 'granted') return;

        // 1. Lấy Token từ thiết bị
        const token = await requestForToken();
        
        if (token) {
          // 2. Lấy thông tin user hiện tại
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // 3. Gửi Token lên server để lưu
            await fetch('/api/push/fcm-register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, fcmToken: token }),
            });
            console.log('[FCM] Token registered successfully');
          }
        }
      } catch (err) {
        console.error('[FCM] Setup error:', err);
      }
    };

    if (typeof window !== 'undefined') {
      setupFCM();

      onMessageListener()?.then((payload: any) => {
        console.log('[FCM] Foreground message:', payload);
      });
    }
  }, []);

  return null;
}
