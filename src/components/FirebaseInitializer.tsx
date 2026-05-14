'use client';

import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

export default function FirebaseInitializer() {
  useEffect(() => {
    const setupFCM = async () => {
      try {
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

      // Lắng nghe thông báo khi app đang mở (Foreground)
      onMessageListener().then((payload: any) => {
        console.log('[FCM] Foreground message:', payload);
        // Có thể dùng toast hoặc alert để báo tin nếu muốn
      });
    }
  }, []);

  return null;
}
