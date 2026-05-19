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
  if (typeof window !== 'undefined') return null; // Tuyệt đối không chạy ở Client

  try {
    const supabase = createServiceClient();
    const { data: profile } = await supabase.from('profiles').select('fcm_token').eq('id', userId).single();

    if (!profile?.fcm_token) {
      console.error(`[FCM] No token for user ${userId}`);
      return null;
    }

    const payload = {
      notification: { title, body: message },
      data: { url: `https://vocab-taupe.vercel.app${url}` },
      token: profile.fcm_token,
      webpush: {
        fcm_options: { link: `https://vocab-taupe.vercel.app${url}` },
        notification: { icon: '/icons/icon-192x192.png' }
      },
    };

    console.log(`[FCM] Sending to ${userId} with token ${profile.fcm_token.substring(0, 20)}...`);
    const result = await admin.messaging().send(payload);
    console.log(`[FCM] Sent successfully, messageId: ${result}`);
    return result;
  } catch (err: any) {
    console.error(`[FCM] Error sending to ${userId}:`, err.message, err.code);
    return null;
  }
}

export const sendPushNotification = async (title: string, message: string, url: string = '/') => {
  if (typeof window !== 'undefined') return null;
  // ... broadcast logic ...
};
