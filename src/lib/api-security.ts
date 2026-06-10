import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * Shared security helpers for API route handlers.
 * - JWT auth verification (Supabase access token from `Authorization: Bearer` header)
 * - Simple in-memory IP rate limiter (no external deps)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthResult {
  userId: string;
}

/**
 * Extract & verify the Supabase JWT from the request `Authorization` header.
 * Returns `{ userId }` on success, hoặc `null` nếu không hợp lệ.
 */
export async function getAuthUser(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;

  const supabase = createServiceClient();
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
 * Kiểm tra rate limit cho một key định danh (ví dụ: `scope:ip`).
 * Trả về thông tin chi tiết về số lượng request còn lại và reset time.
 *
 * @param key      key định danh cho request (ví dụ: `ai:${ip}`)
 * @param limit    số request tối đa trong cửa sổ
 * @param windowMs độ dài cửa sổ (mặc định 60s)
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
