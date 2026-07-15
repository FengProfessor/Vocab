/**
 * In-memory TTL cache (per serverless instance).
 * Mục tiêu: stampede 50–100 HS cùng lúc — gộp auth/summary/classroom trùng trong 15–60s.
 * Không thay Redis; instance warm = hit; cold = miss (vẫn đúng).
 */

interface Entry<T> {
  value: T;
  exp: number;
}

const store = new Map<string, Entry<unknown>>();
let lastSweep = Date.now();

function sweep(now: number): void {
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  for (const [k, e] of store) {
    if (e.exp <= now) store.delete(k);
  }
  // Guard RAM: hard cap
  if (store.size > 5000) {
    const drop = store.size - 4000;
    let i = 0;
    for (const k of store.keys()) {
      store.delete(k);
      if (++i >= drop) break;
    }
  }
}

export function cacheGet<T>(key: string): T | undefined {
  const now = Date.now();
  sweep(now);
  const e = store.get(key);
  if (!e) return undefined;
  if (e.exp <= now) {
    store.delete(key);
    return undefined;
  }
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  const now = Date.now();
  sweep(now);
  store.set(key, { value, exp: now + Math.max(0, ttlMs) });
}

/** get-or-set: nếu miss thì chạy factory, cache kết quả (kể cả null). */
export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await factory();
  cacheSet(key, value, ttlMs);
  return value;
}

export function cacheDelete(key: string): void {
  store.delete(key);
}
