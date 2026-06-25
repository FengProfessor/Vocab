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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FirebaseAdmin] Init Error:', msg);
  }
}

const DEAD_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  message: string,
  url: string = '/student'
) {
  if (typeof window !== 'undefined') return { error: 'running on client' };

  try {
    const supabase = createServiceClient();

    // Gom token đa thiết bị: bảng fcm_tokens + legacy profiles.fcm_token
    const tokens = new Set<string>();
    const { data: rows } = await supabase.from('fcm_tokens').select('token').eq('user_id', userId);
    rows?.forEach((r: { token: string | null }) => { if (r.token) tokens.add(r.token); });

    const { data: profile } = await supabase.from('profiles').select('fcm_token').eq('id', userId).single();
    if (profile?.fcm_token) tokens.add(profile.fcm_token);

    if (tokens.size === 0) return { error: `No token for user ${userId}` };

    const link = `https://lingopro.online${url}`;
    const tokenArr = Array.from(tokens);
    const deadTokens: string[] = [];

    // Gửi 1 lần tới TẤT CẢ thiết bị của user (sendEachForMulticast: tối đa 500 token/call,
    // 1 round-trip thay vì N — tránh nghẽn khi cron bắn hàng loạt user).
    const resp = await admin.messaging().sendEachForMulticast({
      tokens: tokenArr,
      notification: { title, body: message },
      data: { url: link },
      webpush: {
        fcmOptions: { link },
        notification: { icon: '/icons/icon-192.webp', badge: '/icons/icon-192.webp' },
      },
    });

    let lastId = '';
    resp.responses.forEach((r, i) => {
      if (r.success) {
        lastId = r.messageId || lastId;
      } else {
        const code = (r.error as { code?: string } | undefined)?.code || '';
        if (DEAD_TOKEN_CODES.includes(code)) deadTokens.push(tokenArr[i]);
      }
    });
    const sentCount = resp.successCount;

    // Dọn token chết khỏi cả 2 nơi
    if (deadTokens.length) {
      await supabase.from('fcm_tokens').delete().in('token', deadTokens);
      if (profile?.fcm_token && deadTokens.includes(profile.fcm_token)) {
        await supabase.from('profiles').update({ fcm_token: null }).eq('id', userId);
      }
      console.log(`[FCM] Cleared ${deadTokens.length} dead token(s) for user ${userId}`);
    }

    if (sentCount > 0) return { messageId: lastId, sentCount };
    return { error: `All ${tokens.size} token(s) failed for user ${userId}` };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string } | undefined;
    return { error: `Firebase error: ${e?.message || e?.code || 'unknown'}` };
  }
}

export const sendPushNotification = async (title: string, message: string, _url: string = '/') => {
  if (typeof window !== 'undefined') return null;
  // ... broadcast logic ...
};
