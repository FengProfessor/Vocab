import admin from 'firebase-admin';
import { createServiceClient } from './supabase';

// Khởi tạo Firebase Admin (chỉ chạy ở phía Server)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Xử lý xuống dòng cho Private Key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[FirebaseAdmin] Initialized');
  } catch (error: any) {
    console.error('[FirebaseAdmin] Init Error:', error.message);
  }
}

/**
 * Gửi push notification đến MỘT user cụ thể thông qua FCM Token lưu trong profiles
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  message: string,
  url: string = '/student'
) {
  try {
    const supabase = createServiceClient();
    
    // 1. Lấy fcm_token của user từ database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (error || !profile?.fcm_token) {
      console.warn(`[FCM] No token found for user ${userId}`);
      return null;
    }

    // 2. Tạo nội dung thông báo
    const payload = {
      notification: {
        title,
        body: message,
      },
      data: {
        url: `https://lingopro-nu.vercel.app${url}`,
      },
      token: profile.fcm_token,
      // Cấu hình riêng cho Web để hỗ trợ iOS PWA
      webpush: {
        fcm_options: {
          link: `https://lingopro-nu.vercel.app${url}`,
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
        }
      },
    };

    // 3. Gửi qua Firebase
    const response = await admin.messaging().send(payload);
    console.log(`[FCM] Successfully sent to ${userId}:`, response);
    return response;
  } catch (err: any) {
    console.error(`[FCM] Failed to send to ${userId}:`, err.message);
    return null;
  }
}

/**
 * Gửi thông báo đến TẤT CẢ user có token (Broadcast)
 */
export async function sendPushNotificationToAll(title: string, message: string, url: string = '/') {
  try {
    const supabase = createServiceClient();
    const { data: profiles } = await supabase
      .from('profiles')
      .select('fcm_token')
      .not('fcm_token', 'is', null);

    if (!profiles || profiles.length === 0) return null;

    const tokens = profiles.map(p => p.fcm_token);
    
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body: message },
      webpush: {
        fcm_options: { link: `https://lingopro-nu.vercel.app${url}` }
      }
    });

    console.log(`[FCM] Broadcast sent: ${response.successCount} success, ${response.failureCount} failure`);
    return response;
  } catch (err: any) {
    console.error('[FCM] Broadcast Error:', err.message);
    return null;
  }
}

export const sendPushNotification = sendPushNotificationToAll;
