/**
 * Rate limiter per-domain — giãn nhịp request + backoff khi bị chặn (429/403).
 * Trạng thái lưu trong bộ nhớ tiến trình; mỗi domain có nhịp riêng.
 */
const lastRequest: Record<string, number> = {};
const backoffUntil: Record<string, number> = {};

const MIN_DELAY = 1500;
const MAX_DELAY = 4000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Chờ trước khi gửi request tới domain — đảm bảo giãn nhịp + tôn trọng backoff. */
export async function throttle(url: string): Promise<void> {
  const domain = domainOf(url);

  // Đang trong thời gian backoff (do 429/403 trước đó)
  const until = backoffUntil[domain] || 0;
  const now = Date.now();
  if (now < until) await sleep(until - now);

  const last = lastRequest[domain] || 0;
  const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
  const wait = last + delay - Date.now();
  if (wait > 0) await sleep(wait);

  lastRequest[domain] = Date.now();
}

/** Kích hoạt backoff khi server trả 429/403. */
export function triggerBackoff(url: string, seconds = 45): void {
  const domain = domainOf(url);
  backoffUntil[domain] = Date.now() + seconds * 1000;
  console.warn(`[RateLimiter] Backoff ${seconds}s cho ${domain}`);
}
