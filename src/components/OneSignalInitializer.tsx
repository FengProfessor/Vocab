'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

let initialized = false;

export async function registerPushForUser(userId: string) {
  try {
    await OneSignal.login(userId);
    console.log('[Push] Linked user:', userId);
  } catch (err) {
    console.warn('[Push] login() failed:', err);
  }
}

export const setOneSignalExternalUserId = registerPushForUser;

export default function OneSignalInitializer() {
  useEffect(() => {
    if (initialized) return;

    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
          allowLocalhostAsSecureOrigin: true,
          // OneSignal dùng file riêng của nó - KHÔNG dùng sw.js
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
          notifyButton: { enable: false },
        });

        initialized = true;
        console.log('[OneSignal] Ready');

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
