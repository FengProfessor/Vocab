'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

// Gọi hàm này sau khi user đăng nhập để gắn OneSignal với user thật
export async function setOneSignalExternalUserId(userId: string) {
  try {
    await OneSignal.login(userId);
    console.log('[OneSignal] External User ID set:', userId);
  } catch (err) {
    console.warn('[OneSignal] Failed to set external user ID:', err);
  }
}

export default function OneSignalInitializer() {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          notifyButton: {
            enable: false, // Tắt button nổi, dùng prompt tự động
          },
        });

        // Yêu cầu quyền thông báo ngay (iOS cần PWA Add to Home Screen)
        const permission = await OneSignal.Notifications.requestPermission();
        if (permission) {
          console.log('[OneSignal] Notifications permission granted');
        }

        console.log('[OneSignal] Initialized');
      } catch (err) {
        console.error('[OneSignal] Init Error:', err);
      }
    };

    if (typeof window !== 'undefined') {
      initOneSignal();
    }
  }, []);

  return null;
}
