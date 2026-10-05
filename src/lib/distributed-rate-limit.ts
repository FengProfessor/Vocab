export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/** A provider/configuration outage, distinct from an exhausted quota. */
export class RateLimitUnavailableError extends Error {
  constructor() {
    super('Rate limit service temporarily unavailable');
    this.name = 'RateLimitUnavailableError';
  }
}

// INCR + TTL cùng một script; sửa TTL thiếu từ counter legacy, không gia hạn cửa sổ đang chạy.
export const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if count == 1 or ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

/** Distributed fixed-window limiter. Missing/error configuration never permits a request. */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !/^https:\/\/[A-Za-z0-9-]+\.upstash\.io\/?$/.test(url) || !token ||
      !key || !Number.isSafeInteger(limit) || limit <= 0 ||
      !Number.isSafeInteger(windowMs) || windowMs <= 0) {
    if (process.env.NODE_ENV !== 'production') {
      return { allowed: true, remaining: limit, resetIn: windowMs };
    }
    throw new RateLimitUnavailableError();
  }
  try {
    const response = await fetch(url.replace(/\/$/, ''), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', RATE_LIMIT_SCRIPT, '1', `rl:${key}`, String(windowMs)]),
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    if (!response.ok) throw new RateLimitUnavailableError();
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || 'error' in body || !('result' in body)) {
      throw new RateLimitUnavailableError();
    }
    const result = body.result;
    if (!Array.isArray(result) || result.length !== 2) throw new RateLimitUnavailableError();
    const [count, ttl] = result as unknown[];
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 1 ||
        typeof ttl !== 'number' || !Number.isSafeInteger(ttl) || ttl <= 0 || ttl > windowMs) {
      throw new RateLimitUnavailableError();
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetIn: ttl };
  } catch {
    // Không log provider error: message có thể chứa endpoint hoặc credential.
    throw new RateLimitUnavailableError();
  }
}
