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

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
]);

type TokenRow = { token: string; lastUsedAt: number };

function isDeadTokenError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code || '';
  if (DEAD_TOKEN_CODES.has(code)) return true;
  const msg = (err as { message?: string } | undefined)?.message || '';
  return /not.?registered|invalid.?registration|registration-token/i.test(msg);
}

/**
 * Gửi push tới ĐÚNG 1 endpoint (token tươi nhất).
 * - Token chết / lỗi → thử token kế (fallback), dọn dead.
 * - fcm-register prune còn 1 token/user → thường chỉ 1 vòng.
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

    if (profile?.fcm_token && !byToken.has(profile.fcm_token)) {
      byToken.set(profile.fcm_token, { token: profile.fcm_token, lastUsedAt: 0 });
    }

    if (byToken.size === 0) return { error: `No token for user ${userId}` };

    const ordered = Array.from(byToken.values()).sort((a, b) => b.lastUsedAt - a.lastUsedAt);

    const link = `https://lingopro.online${url}`;
    // Payload tối giản — tránh field platform lạ làm FCM reject một số token web/Capacitor.
    const baseMessage = {
      notification: { title, body: message },
      data: { url: link },
      webpush: {
        fcmOptions: { link },
        notification: {
          icon: 'https://lingopro.online/icons/icon-192.webp',
          badge: 'https://lingopro.online/icons/icon-192.webp',
          tag: 'lingopro-due',
          renotify: true,
        },
      },
      android: {
        collapseKey: 'lingopro-due',
        priority: 'high' as const,
        notification: { tag: 'lingopro-due' },
      },
    };

    const tokenStrings = ordered.map(t => t.token);
    let response;
    try {
      response = await admin.messaging().sendEachForMulticast({
        tokens: tokenStrings,
        ...baseMessage,
      });
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string } | undefined;
      return { error: `Multicast error: ${e?.message || e?.code || 'unknown'}` };
    }

    const deadTokens: string[] = [];
    const errors: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        errors.push(resp.error.message || resp.error.code || 'unknown');
        if (isDeadTokenError(resp.error)) {
          deadTokens.push(tokenStrings[idx]);
        }
      }
    });

    if (deadTokens.length > 0) {
      await supabase.from('fcm_tokens').delete().in('token', deadTokens);
      if (profile?.fcm_token && deadTokens.includes(profile.fcm_token)) {
        await supabase.from('profiles').update({ fcm_token: null }).eq('id', userId);
      }
      console.log(`[FCM] Cleared ${deadTokens.length} dead token(s) for user ${userId.slice(0, 8)}`);
    }

    if (response.successCount > 0) {
      // Update profile.fcm_token to the freshest successful token if it's not already
      const firstSuccessIdx = response.responses.findIndex(r => r.success);
      const successfulToken = tokenStrings[firstSuccessIdx];
      if (profile && profile.fcm_token !== successfulToken) {
        await supabase.from('profiles').update({ fcm_token: successfulToken }).eq('id', userId);
      }

      console.log(`[FCM] Sent to ${response.successCount}/${tokenStrings.length} tokens for user=${userId.slice(0, 8)}`);
      return {
        messageId: response.responses[firstSuccessIdx].messageId,
        sentCount: response.successCount,
        tried: tokenStrings.length,
        tokenCount: tokenStrings.length,
      };
    }

    return {
      error: `All ${tokenStrings.length} token(s) failed for user ${userId}: ${errors.slice(0, 3).join(' | ')}`,
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
