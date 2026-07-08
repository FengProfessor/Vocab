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

if (hasAnyFirebaseEnv && !hasFullFirebaseEnv) {
  console.warn('[FCM] Partial Firebase public env detected. Falling back to bundled config to avoid client/SW mismatch.');
}

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

export const firebaseConfigSource = hasFullFirebaseEnv ? 'env' : 'fallback';
