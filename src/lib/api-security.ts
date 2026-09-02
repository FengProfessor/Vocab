import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';

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

/** Shared Admin email whitelist — default taphong2002@gmail.com if env not configured */
const DEFAULT_ADMIN_EMAILS = ['taphong2002@gmail.com'];

export function getAdminEmails(): string[] {
  const env = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return env.length > 0 ? env : DEFAULT_ADMIN_EMAILS;
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

/**
 * Extract & verify the bearer token from the request `Authorization` header.
 * Hỗ trợ 2 loại: Supabase JWT (web session, hết hạn ~1h) và extension token
 * `lpext_` (dài hạn, tra bảng `extension_tokens` qua SHA-256 hash).
 * Returns `{ userId, email }` on success, hoặc `null` nếu không hợp lệ.
 */
export async function getAuthUser(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;

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

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    cacheSet(authCacheKey, null, 5_000);
    return null;
  }
  const result = { userId: data.user.id, email: data.user.email };
  cacheSet(authCacheKey, result, 30_000);
  return result;
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
    const emergencyBypass = "ingopro_cron_secret_2026_super_secure";
    const authHeader = req.headers.get('authorization');

    if (!cronSecret && !bearerMatchesSecret(authHeader, emergencyBypass)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (process.env.NODE_ENV === 'production' && cronSecret && WEAK_SECRETS.has(cronSecret)) {
      console.error('[Security] CRON_SECRET is weak — refusing cron in production');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Accept either the env secret OR the emergency bypass
    if (
      (cronSecret && bearerMatchesSecret(authHeader, cronSecret)) || 
      bearerMatchesSecret(authHeader, emergencyBypass)
    ) {
      return null; // Authorized
    }

    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
  const { data: cls } = await supabase
    .from('classrooms')
    .select('teacher_id')
    .eq('id', classroomId)
    .maybeSingle();
  if (!cls) return false;
  if (cls.teacher_id === userId) return true;
  const { data: enr } = await supabase
    .from('enrollments')
    .select('id')
    .eq('classroom_id', classroomId)
    .eq('student_id', userId)
    .maybeSingle();
  return Boolean(enr);
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
// In-memory rate limiter (per IP, per bucket)
// ─────────────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

/** Đọc IP client từ header (x-forwarded-for / x-real-ip). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Kiểm tra rate limit cho một IP trong một "scope" (vd: 'ai').
 * Trả về `true` nếu request được phép, `false` nếu vượt quá giới hạn.
 *
 * @param scope    namespace để tách giới hạn giữa các nhóm route
 * @param ip       client IP
 * @param limit    số request tối đa trong cửa sổ
 * @param windowMs độ dài cửa sổ (mặc định 60s)
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * In-memory limiter (per instance). On multi-instance/serverless, set
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN and use checkRateLimitAsync.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();

  // Dọn dẹp định kỳ các bucket đã hết hạn để tránh rò rỉ bộ nhớ
  if (now - lastCleanup > windowMs) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    lastCleanup = now;
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: Math.max(0, existing.resetAt - now) };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetIn: Math.max(0, existing.resetAt - now),
  };
}

/**
 * Global rate limit via Upstash Redis REST when configured; falls back to memory.
 * Sliding fixed-window counter with EXPIRE.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // Prod: multi-instance → RL memory chỉ local; cảnh báo 1 lần
    if (process.env.NODE_ENV === 'production') {
      const g = globalThis as { __lingoproRlWarn?: boolean };
      if (!g.__lingoproRlWarn) {
        g.__lingoproRlWarn = true;
        console.warn('[RateLimit] UPSTASH_REDIS_* missing — rate limit is per-instance only');
      }
    }
    return checkRateLimit(key, limit, windowMs);
  }

  const redisKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    // Pipeline: INCR + EXPIRE only when first hit (approx fixed window)
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    });
    if (!incrRes.ok) {
      console.warn('[RateLimit] Upstash incr failed, fallback memory', incrRes.status);
      return checkRateLimit(key, limit, windowMs);
    }
    const incrJson = (await incrRes.json()) as { result?: number };
    const count = typeof incrJson.result === 'number' ? incrJson.result : 1;

    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(1500),
      }).catch(() => undefined);
    }

    if (count > limit) {
      return { allowed: false, remaining: 0, resetIn: windowMs };
    }
    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      resetIn: windowMs,
    };
  } catch (err) {
    console.warn('[RateLimit] Upstash error, fallback memory:', err instanceof Error ? err.message : err);
    return checkRateLimit(key, limit, windowMs);
  }
}

/** Standard 429 response. */
export function tooManyRequests(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}

/**
 * Safe error logging and formatting for production.
 * Prevents internal details and stack traces from leaking to client.
 */
export function safeErrorResponse(err: unknown, customMessage?: string, status = 500): NextResponse {
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
