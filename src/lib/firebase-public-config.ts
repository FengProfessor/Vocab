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
  vapidKey: 'BJIDyqCnEsAEl3Po7fjq1OR1ypWeJ8j7stMleUo9k5NEkcYa9elG1X41lH5yShiDITrDiOR8fr6cGGxCw3XMbVU',
};

function readEnv(value: string | undefined): string {
  return value?.trim() ?? '';
}

const envFirebasePublicConfig: FirebasePublicConfig = {
  apiKey: readEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: readEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: readEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: readEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: readEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  vapidKey: readEnv(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
};

const envValues = Object.values(envFirebasePublicConfig);
const hasAnyFirebaseEnv = envValues.some(Boolean);
const hasFullFirebaseEnv = envValues.every(Boolean);

/** Env khớp fallback từng field — mới tin env (tránh Vercel set lệch 1 field → token-subscribe-failed). */
const envMatchesFallback = hasFullFirebaseEnv && (
  Object.keys(FALLBACK_FIREBASE_PUBLIC_CONFIG) as (keyof FirebasePublicConfig)[]
).every((k) => envFirebasePublicConfig[k] === FALLBACK_FIREBASE_PUBLIC_CONFIG[k]);

if (hasAnyFirebaseEnv && !hasFullFirebaseEnv) {
  console.warn('[FCM] Partial Firebase env on server/build — using bundled config.');
}

export const firebasePublicConfig: FirebasePublicConfig = envMatchesFallback
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

export const firebaseConfigSource = envMatchesFallback ? 'env' : 'bundled';

/** Phiên bản Firebase compat CDN dùng trong service worker — giữ gần SDK client. */
export const FIREBASE_SW_COMPAT_VERSION = '11.9.1';
