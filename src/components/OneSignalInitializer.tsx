'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

let initialized = false;

/**
 * Gọi hàm này sau khi user đăng nhập để:
 * 1. Lấy OneSignal player_id của thiết bị này
 * 2. Gắn player_id với Supabase userId qua API
 */
export async function registerPushForUser(userId: string) {
  try {
    // Cách 1: Dùng OneSignal.login (SDK v16+)
    await OneSignal.login(userId);
    console.log('[Push] OneSignal.login set external_id:', userId);
  } catch (err) {
    console.warn('[Push] login() failed, trying manual register:', err);
  }

  try {
    // Cách 2: Lấy player_id và gọi API server để gắn external_user_id
    const playerId = await OneSignal.User.PushSubscription.id;
    if (playerId && userId) {
      await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, playerId }),
      });
      console.log('[Push] Registered player_id:', playerId, '→ user:', userId);
    }
  } catch (err) {
    console.warn('[Push] Manual registration failed:', err);
  }
}

// Backward compat alias
export const setOneSignalExternalUserId = registerPushForUser;

export default function OneSignalInitializer() {
  useEffect(() => {
    if (initialized) return;

    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          notifyButton: {
            enable: false,
          },
        });

        initialized = true;
        console.log('[OneSignal] Ready');

        // Yêu cầu quyền thông báo nếu chưa có
        const permission = OneSignal.Notifications.permissionNative;
        if (permission === 'default') {
          await OneSignal.Notifications.requestPermission();
        }
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
