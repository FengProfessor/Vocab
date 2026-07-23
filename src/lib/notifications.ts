import admin from 'firebase-admin';
import { createServiceClient } from './supabase';

/** Vercel/PowerShell env hay dính literal \r\n → projectId hỏng → FCM 404 `/projects/xxx/r/n/messages`. */
function cleanEnv(value: string | undefined): string {
  return (value || '')
    .replace(/\\r\\n/g, '')
    .replace(/\\n/g, '')
    .replace(/\\r/g, '')
    .replace(/[\r\n]+/g, '')
    .trim();
}

// CHỈ khởi tạo trên SERVER
if (typeof window === 'undefined' && !admin.apps.length) {
  try {
    const projectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        `Missing Firebase Admin env (projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey})`
      );
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[FirebaseAdmin] Initialized on Server projectId=', projectId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[FirebaseAdmin] Init Error:', msg);
  }
}

const DEAD_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

type TokenRow = { token: string; lastUsedAt: number };

/**
 * Gửi push tới ĐÚNG 1 endpoint tươi nhất của user.
 * - Trước đây multicast mọi token → 1 máy cài 2 app / Chrome+PWA = N bubble cùng lúc.
 * - Giờ: sort last_used_at DESC → thử token #1; chết thì dọn + thử #2… đến khi 1 cái success.
 * → Dù DT hay MT, mỗi lần nhắc chỉ 1 thông báo (trên thiết bị dùng gần nhất).
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  message: string,
  url: string = '/student'
) {
  if (typeof window !== 'undefined') return { error: 'running on client' };

  try {
    const supabase = createServiceClient();

    // Token đa thiết bị + thời điểm dùng gần nhất (ưu tiên endpoint tươi).
    const { data: rows } = await supabase
      .from('fcm_tokens')
      .select('token, last_used_at')
      .eq('user_id', userId);

    const byToken = new Map<string, TokenRow>();
    rows?.forEach((r: { token: string | null; last_used_at: string | null }) => {
      if (!r.token) return;
      const ts = r.last_used_at ? new Date(r.last_used_at).getTime() : 0;
      const prev = byToken.get(r.token);
      if (!prev || ts > prev.lastUsedAt) {
        byToken.set(r.token, { token: r.token, lastUsedAt: ts });
      }
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    // Legacy: chỉ thêm nếu chưa có trong fcm_tokens (ưu tiên thấp hơn token có last_used).
    if (profile?.fcm_token && !byToken.has(profile.fcm_token)) {
      byToken.set(profile.fcm_token, { token: profile.fcm_token, lastUsedAt: 0 });
    }

    if (byToken.size === 0) return { error: `No token for user ${userId}` };

    // Mới dùng trước → 1 notif trên máy/app đang active.
    const ordered = Array.from(byToken.values()).sort((a, b) => b.lastUsedAt - a.lastUsedAt);

    const link = `https://lingopro.online${url}`;
    const payload = {
      notification: { title, body: message },
      data: { url: link },
      webpush: {
        fcmOptions: { link },
        notification: {
          icon: '/icons/icon-192.webp',
          badge: '/icons/icon-192.webp',
          // Tag cố định: nếu cùng browser còn bubble cũ, thay thế thay vì xếp chồng (web).
          tag: 'lingopro-due',
          renotify: true,
        },
      },
      // Android/Capacitor: collapse cùng key → 1 slot notif thay vì chồng.
      android: {
        collapseKey: 'lingopro-due',
        notification: { tag: 'lingopro-due' },
      },
    };

    const deadTokens: string[] = [];
    let lastError = '';

    for (const { token } of ordered) {
      try {
        const messageId = await admin.messaging().send({
          token,
          ...payload,
        });

        // Dọn token chết đã gặp trước khi gửi thành công.
        if (deadTokens.length) {
          await supabase.from('fcm_tokens').delete().in('token', deadTokens);
          if (profile?.fcm_token && deadTokens.includes(profile.fcm_token)) {
            await supabase.from('profiles').update({ fcm_token: null }).eq('id', userId);
          }
          console.log(`[FCM] Cleared ${deadTokens.length} dead token(s) for user ${userId}`);
        }

        // Đồng bộ legacy = token vừa gửi OK (thiết bị đang active).
        if (profile && profile.fcm_token !== token) {
          await supabase.from('profiles').update({ fcm_token: token }).eq('id', userId);
        }

        console.log(
          `[FCM] Sent 1/1 (primary of ${ordered.length} token(s)) user=${userId.slice(0, 8)} id=${messageId}`
        );
        return { messageId, sentCount: 1, tried: ordered.length, skipped: ordered.length - 1 };
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string } | undefined;
        const code = e?.code || '';
        lastError = e?.message || code || 'unknown';
        if (DEAD_TOKEN_CODES.includes(code)) {
          deadTokens.push(token);
          continue;
        }
        // Lỗi khác (quota, network…) → không đốt hết token; dừng.
        console.warn(`[FCM] Send failed non-dead for user ${userId.slice(0, 8)}:`, lastError);
        break;
      }
    }

    if (deadTokens.length) {
      await supabase.from('fcm_tokens').delete().in('token', deadTokens);
      if (profile?.fcm_token && deadTokens.includes(profile.fcm_token)) {
        await supabase.from('profiles').update({ fcm_token: null }).eq('id', userId);
      }
      console.log(`[FCM] Cleared ${deadTokens.length} dead token(s) for user ${userId}`);
    }

    return {
      error: `All ${ordered.length} token(s) failed for user ${userId}: ${lastError || 'unknown'}`,
    };
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string } | undefined;
    return { error: `Firebase error: ${e?.message || e?.code || 'unknown'}` };
  }
}

export const sendPushNotification = async (title: string, message: string, _url: string = '/') => {
  if (typeof window !== 'undefined') return null;
  // ... broadcast logic ...
};
