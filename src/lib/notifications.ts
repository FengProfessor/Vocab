import admin from 'firebase-admin';
import { createServiceClient } from './supabase';

// CHỈ khởi tạo trên SERVER
if (typeof window === 'undefined' && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[FirebaseAdmin] Initialized on Server');
  } catch (error: any) {
    console.error('[FirebaseAdmin] Init Error:', error.message);
  }
}

export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  message: string,
  url: string = '/student'
) {
  if (typeof window !== 'undefined') return { error: 'running on client' };

  try {
    const supabase = createServiceClient();
    const { data: profile, error: dbError } = await supabase.from('profiles').select('fcm_token').eq('id', userId).single();

    if (dbError) return { error: `DB query failed: ${dbError.message}` };
    if (!profile?.fcm_token) return { error: `No token for user ${userId}` };

    const payload = {
      notification: { title, body: message },
      data: { url: `https://vocab-taupe.vercel.app${url}` },
      token: profile.fcm_token,
      webpush: {
        fcm_options: { link: `https://vocab-taupe.vercel.app${url}` },
        notification: { icon: '/icons/icon-192x192.png' }
      },
    };

    const result = await admin.messaging().send(payload);
    return { messageId: result };
  } catch (err: any) {
    return { error: `Firebase error: ${err.message || err.code || 'unknown'}` };
  }
}

export const sendPushNotification = async (title: string, message: string, url: string = '/') => {
  if (typeof window !== 'undefined') return null;
  // ... broadcast logic ...
};
