import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase-server';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';
import { isCronAuthorizationValid } from '@/lib/cron-auth';
import { RateLimitUnavailableError } from '@/lib/distributed-rate-limit';
import { getWebUser, sessionCookieName } from '@/lib/server-auth-session';
import { sessionErrorResponse } from '@/lib/session-response';
export { checkRateLimitAsync, RateLimitUnavailableError } from '@/lib/distributed-rate-limit';
export type { RateLimitResult } from '@/lib/distributed-rate-limit';

/** Secret bot yếu / mẫu — từ chối ở production. */
const WEAK_SECRETS = new Set([
  '',
  'lingopro-secret-key-123',
  'changeme',
  'secret',
  'password',
  'test',
  'bot-secret',
]);

/** Shared Admin email whitelist; thiếu cấu hình thì fail closed. */
export function getAdminEmails(): string[] {
  return [...new Set((process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean))];
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthResult {
  userId: string;
  email?: string;
}

/** Prefix nhận diện extension token (mint tại /api/extension-token). */
export const EXT_TOKEN_PREFIX = 'lpext_';

/** SHA-256 hex — extension token chỉ lưu hash trong DB. */
export function hashExtensionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Cookie web identity and separate hashed extension credential; browser JWTs are retired. */
export async function getAuthUser(req: Request): Promise<AuthResult | null> {
  const hasCookie = (req.headers.get('cookie') ?? '').split(';')
    .some(value => value.trim().startsWith(`${sessionCookieName()}=`));
  if (hasCookie) {
    const { data: { user } } = await getWebUser(req);
    return user ? { userId: user.id, email: user.email } : null;
  }
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  // Existing external integration credential remains separate. Browser JWT is deliberately retired.
  if (!token || !token.startsWith(EXT_TOKEN_PREFIX)) return null;

  // Stampede 100 HS: 1 token → nhiều API trong vài giây — cache auth 30s/instance
  const authCacheKey = `auth:${createHash('sha256').update(token).digest('hex').slice(0, 32)}`;
  const cached = cacheGet<AuthResult | null>(authCacheKey);
  if (cached !== undefined) return cached;

  const supabase = createServiceClient();

  if (token.startsWith(EXT_TOKEN_PREFIX)) {
    const tokenHash = hashExtensionToken(token);
    const { data, error } = await supabase
      .from('extension_tokens')
      .select('user_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (error || !data?.user_id) {
      cacheSet(authCacheKey, null, 5_000);
      return null;
    }
    if (data.revoked_at) {
      cacheSet(authCacheKey, null, 5_000);
      return null;
    }
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
      cacheSet(authCacheKey, null, 5_000);
      return null;
    }
    // Ghi nhận lần dùng cuối — fire-and-forget, không chặn request
    void supabase
      .from('extension_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .then(() => {});
    const result = { userId: data.user_id as string };
    cacheSet(authCacheKey, result, 30_000);
    return result;
  }

  return null;
}

/** Standard 401 response. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

/** Standard 403. */
export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * So sánh secret constant-time (tránh timing leak).
 * `expected` = env secret; `provided` = token từ client (sau "Bearer ").
 */
export function timingSafeEqualString(expected: string, provided: string): boolean {
  if (!expected || !provided) return false;
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length) {
      // Vẫn so sánh dummy để thời gian tương đối đều
      timingSafeEqual(a, a);
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Bearer token khớp secret env (timing-safe). */
export function bearerMatchesSecret(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  return timingSafeEqualString(secret, token);
}

/**
 * Auth cho /api/bot/* và verify-image.
 * Fail-closed nếu thiếu BOT_SECRET; production từ chối secret yếu/mẫu.
 */
export function assertBotAuthorized(req: Request): NextResponse | null {
  const botSecret = process.env.BOT_SECRET;
  if (!botSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (process.env.NODE_ENV === 'production' && WEAK_SECRETS.has(botSecret)) {
    console.error('[Security] BOT_SECRET is weak/default — refusing bot requests in production');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!bearerMatchesSecret(req.headers.get('authorization'), botSecret)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Auth cho /api/cron/* — CHỈ Authorization: Bearer (không ?secret= — tránh log leak).
 */
export function assertCronAuthorized(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === 'production' && cronSecret && WEAK_SECRETS.has(cronSecret)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!isCronAuthorizationValid(req.headers.get('authorization'), cronSecret)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * User được GHI words vào classroom?
 * - teacher_id của classroom (gồm __personal__)
 * - hoặc đã enroll student
 */
export async function userCanWriteClassroom(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  classroomId: string,
): Promise<boolean> {
  const cacheKey = `user-can-write-cls:${userId}:${classroomId}`;
  const hit = cacheGet<boolean>(cacheKey);
  if (hit !== null && hit !== undefined) return hit;

  const { data: cls } = await supabase
    .from('classrooms')
    .select('teacher_id')
    .eq('id', classroomId)
    .maybeSingle();
  if (!cls) {
    cacheSet(cacheKey, false, 30_000);
    return false;
  }
  if (cls.teacher_id === userId) {
    cacheSet(cacheKey, true, 60_000);
    return true;
  }
  const { data: enr } = await supabase
    .from('enrollments')
    .select('id')
    .eq('classroom_id', classroomId)
    .eq('student_id', userId)
    .maybeSingle();
  const canWrite = Boolean(enr);
  cacheSet(cacheKey, canWrite, 60_000);
  return canWrite;
}

// ─────────────────────────────────────────────────────────────────────────────
// Input validation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** True nếu `v` là string không rỗng và độ dài <= max (sau trim). */
export function isValidString(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

/** True nếu `v` là số hữu hạn trong khoảng [min, max]. */
export function isNumberInRange(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

/**
 * Sanitize user input before embedding into AI prompts.
 * Strips control characters and special prompt-injection patterns.
 * Keeps letters (all scripts), digits, basic punctuation, and whitespace.
 */
export function sanitizeForPrompt(input: string, maxLen = 200): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')        // Strip control chars
    .replace(/```/g, '')                       // Strip markdown fences
    .replace(/\\/g, '')                        // Strip backslashes
    .trim()
    .slice(0, maxLen);
}

// ─────────────────────────────────────────────────────────────────────────────
// Distributed rate limiter (mọi caller đều dùng Redis; không fallback process memory)
// ─────────────────────────────────────────────────────────────────────────────

/** Đọc IP client từ header (x-forwarded-for / x-real-ip). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

// Lỗi hạ tầng khác quota hết: không trả paywall hoặc cho chạy side effect.
export function rateLimitUnavailableResponse(err: unknown): NextResponse | null {
  if (!(err instanceof RateLimitUnavailableError)) return null;
  return NextResponse.json(
    { success: false, error: 'RATE_LIMIT_UNAVAILABLE', message: 'Dịch vụ tạm thời không khả dụng. Thử lại sau.' },
    { status: 503, headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' } },
  );
}

/** Standard 429 response with Retry-After header. */
export function tooManyRequests(retryAfterSeconds = 60): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

/**
 * Safe error logging and formatting for production.
 * Prevents internal details and stack traces from leaking to client.
 */
export function safeErrorResponse(err: unknown, customMessage?: string, status = 500): NextResponse {
  const sessionFailure = sessionErrorResponse(err);
  if (sessionFailure) return sessionFailure;
  const unavailable = rateLimitUnavailableResponse(err);
  if (unavailable) return unavailable;
  // Supabase/Postgrest error = plain object { message, code, details } — không phải Error
  let msg: string;
  if (err instanceof Error) {
    msg = err.message;
  } else if (err && typeof err === 'object' && 'message' in err) {
    msg = String((err as { message?: unknown }).message ?? err);
  } else {
    msg = String(err);
  }
  console.error(`[API Error] Status ${status}:`, msg, err instanceof Error ? err.stack : err);

  const clientMsg = process.env.NODE_ENV === 'production'
    ? (customMessage || 'Internal Server Error')
    : msg;

  return NextResponse.json({ success: false, error: clientMsg }, { status });
}
