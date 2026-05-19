/**
 * HTTP client cho scraper — axios + rate-limit + retry exponential backoff.
 * Giả lập browser thật để vượt qua chặn cơ bản.
 */
import axios, { AxiosRequestConfig } from 'axios';
import { throttle, triggerBackoff } from './rate-limiter';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

const MAX_RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface FetchOptions {
  /** Kỳ vọng JSON response (mặc định nhận HTML/text) */
  json?: boolean;
  headers?: Record<string, string>;
}

/**
 * GET có rate-limit + retry. Trả HTML string hoặc JSON object.
 * Trả `null` nếu HTTP 404 (từ không tồn tại — không cần retry).
 */
export async function fetchUrl(url: string, opts: FetchOptions = {}): Promise<unknown> {
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await throttle(url);
    try {
      const config: AxiosRequestConfig = {
        timeout: 15000,
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          'Accept-Language': 'en-US,en;q=0.9',
          Accept: opts.json
            ? 'application/json,text/plain,*/*'
            : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...opts.headers,
        },
        responseType: opts.json ? 'json' : 'text',
        validateStatus: () => true,
      };
      const res = await axios.get(url, config);

      if (res.status === 429 || res.status === 403) {
        triggerBackoff(url, 45 * attempt);
        lastErr = new Error(`HTTP ${res.status}: ${url}`);
        continue;
      }
      if (res.status === 404) return null;
      if (res.status >= 400) {
        lastErr = new Error(`HTTP ${res.status}: ${url}`);
        await sleep(1000 * attempt);
        continue;
      }
      return res.data;
    } catch (e) {
      lastErr = e;
      await sleep(1000 * Math.pow(2, attempt)); // exponential backoff
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`Fetch failed: ${url}`);
}
