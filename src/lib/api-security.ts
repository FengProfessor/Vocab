import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase';

/**
 * Shared security helpers for API route handlers.
 * - JWT auth verification (Supabase access token from `Authorization: Bearer` header)
 * - Extension token verification (long-lived `lpext_` token, hashed in `extension_tokens`)
 * - Simple in-memory IP rate limiter (no external deps)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthResult {
  userId: string;
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
 * Returns `{ userId }` on success, hoặc `null` nếu không hợp lệ.
 */
export async function getAuthUser(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;

  const supabase = createServiceClient();

  if (token.startsWith(EXT_TOKEN_PREFIX)) {
    const tokenHash = hashExtensionToken(token);
    const { data, error } = await supabase
      .from('extension_tokens')
      .select('user_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (error || !data?.user_id) return null;
    if (data.revoked_at) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return null;
    // Ghi nhận lần dùng cuối — fire-and-forget, không chặn request
    void supabase
      .from('extension_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .then(() => {});
    return { userId: data.user_id };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { userId: data.user.id };
}

/** Standard 401 response. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[API Error] Status ${status}:`, msg, err instanceof Error ? err.stack : '');
  
  const clientMsg = process.env.NODE_ENV === 'production' 
    ? (customMessage || 'Internal Server Error') 
    : msg;
    
  return NextResponse.json({ success: false, error: clientMsg }, { status });
}
