import { env } from '@/shared/config/env';

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type FirebasePublicConfig = FirebaseWebConfig & {
  vapidKey: string;
};

const FALLBACK_FIREBASE_PUBLIC_CONFIG: FirebasePublicConfig = {
  apiKey: 'AIzaSyATgTyGPzlmi0ADwBsMJxEhgqJsjEiRftc',
  authDomain: 'lingopro-9d2f8.firebaseapp.com',
  projectId: 'lingopro-9d2f8',
  storageBucket: 'lingopro-9d2f8.firebasestorage.app',
  messagingSenderId: '147138625371',
  appId: '1:147138625371:web:9d308e4337c9fe7399647e',
  // Firebase SDK default — khớp project khi không gửi applicationPubKey (custom BJID... gây 401).
  vapidKey: 'BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4',
};

function readEnv(value: string | undefined): string {
  // Vercel env set bằng PowerShell echo có thể dính \r\n — làm hỏng VAPID → 401 FCM.
  return value?.replace(/\r/g, '').replace(/\\n/g, '').replace(/\\r/g, '').trim() ?? '';
}

const envFirebasePublicConfig: FirebasePublicConfig = {
  apiKey: readEnv(env.firebase.apiKey),
  authDomain: readEnv(env.firebase.authDomain),
  projectId: readEnv(env.firebase.projectId),
  storageBucket: readEnv(env.firebase.storageBucket),
  messagingSenderId: readEnv(env.firebase.messagingSenderId),
  appId: readEnv(env.firebase.appId),
  vapidKey: readEnv(env.firebase.vapidKey),
};

const envValues = Object.values(envFirebasePublicConfig);
const hasAnyFirebaseEnv = envValues.some(Boolean);
const hasFullFirebaseEnv = envValues.every(Boolean);

if (hasAnyFirebaseEnv && !hasFullFirebaseEnv) {
  console.warn('[FCM] Partial Firebase env on server/build — using bundled config.');
}

// Luôn dùng env nếu có đủ các trường, nếu không dùng fallback
export const firebasePublicConfig: FirebasePublicConfig = hasFullFirebaseEnv
  ? envFirebasePublicConfig
  : FALLBACK_FIREBASE_PUBLIC_CONFIG;

export const firebaseWebConfig: FirebaseWebConfig = {
  apiKey: firebasePublicConfig.apiKey,
  authDomain: firebasePublicConfig.authDomain,
  projectId: firebasePublicConfig.projectId,
  storageBucket: firebasePublicConfig.storageBucket,
  messagingSenderId: firebasePublicConfig.messagingSenderId,
  appId: firebasePublicConfig.appId,
};

export const firebaseConfigSource = 'bundled';

/** Phiên bản Firebase compat CDN dùng trong service worker — giữ gần SDK client. */
export const FIREBASE_SW_COMPAT_VERSION = '12.13.0';
