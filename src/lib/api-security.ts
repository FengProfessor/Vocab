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
export function checkRateLimit(scope: string, ip: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();

  // Dọn dẹp định kỳ các bucket đã hết hạn để tránh rò rỉ bộ nhớ
  if (now - lastCleanup > windowMs) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    lastCleanup = now;
  }

  const key = `${scope}:${ip}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count++;
  return true;
}

/** Standard 429 response. */
export function tooManyRequests(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}
