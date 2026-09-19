/**
 * Resilient HTTP Client with User-Agent Pool & Rate Limiter Integration
 * File: scripts/speaking/core/http-client.ts
 *
 * Provides:
 * 1. Realistic browser User-Agent pool rotation.
 * 2. Automated rate limiting and per-domain sequential throttling.
 * 3. Exponential backoff on 429, 403, and 5xx errors.
 * 4. Circuit breaker protection preventing IP blacklisting.
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultRateLimiter, RateLimiter } from './rate-limiter';

/**
 * Modern realistic browser User-Agent pool.
 */
export const USER_AGENT_POOL: readonly string[] = [
  // Chrome on Windows 11
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  // Safari on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  // Firefox on Ubuntu Linux
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  // Edge on Windows 11
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
];

export interface HttpClientOptions {
  rateLimiter?: RateLimiter;
  maxRetries?: number;
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
  defaultHeaders?: Record<string, string>;
  userAgent?: string;
  defaultUserAgent?: string;
  offline?: boolean;
}

export interface HttpRequestConfig extends AxiosRequestConfig {
  offline?: boolean;
  mock?: boolean;
  customHeaders?: Record<string, string>;
}

export class CircuitBreakerOpenError extends Error {
  public readonly domain: string;
  constructor(domain: string) {
    super(`Circuit breaker is OPEN for domain "${domain}". Request aborted.`);
    this.name = 'CircuitBreakerOpenError';
    this.domain = domain;
  }
}

export class HttpClient {
  private readonly rateLimiter: RateLimiter;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private offline: boolean;
  private defaultHeaders: Record<string, string>;
  private defaultUserAgent?: string;
  private userAgentIndex = 0;

  constructor(options?: HttpClientOptions) {
    this.rateLimiter = options?.rateLimiter || defaultRateLimiter;
    this.maxRetries = options?.maxRetries ?? 3;
    this.timeoutMs = options?.timeoutMs ?? 15000;
    this.offline = options?.offline ?? false;
    this.defaultHeaders = options?.defaultHeaders ?? options?.customHeaders ?? {};
    this.defaultUserAgent = options?.defaultUserAgent ?? options?.userAgent;
  }

  /**
   * Get next rotating User-Agent string.
   */
  public getNextUserAgent(): string {
    const ua = USER_AGENT_POOL[this.userAgentIndex % USER_AGENT_POOL.length];
    this.userAgentIndex += 1;
    return ua;
  }

  /**
   * Extract domain hostname from a URL.
   */
  public extractDomain(targetUrl: string): string {
    try {
      const parsed = new URL(targetUrl);
      return parsed.hostname.toLowerCase();
    } catch {
      return 'unknown-host';
    }
  }

  /**
   * Execute request with rate limiting, circuit breaker, and retry logic.
   */
  public async request<T = unknown>(
    urlOrConfig: string | HttpRequestConfig,
    config: HttpRequestConfig = {},
    options: HttpClientOptions = {}
  ): Promise<AxiosResponse<T>> {
    let url: string;
    let effectiveConfig: HttpRequestConfig;

    if (typeof urlOrConfig === 'string') {
      url = urlOrConfig;
      effectiveConfig = config;
    } else {
      effectiveConfig = urlOrConfig || {};
      url = effectiveConfig.url || '';
    }

    const isOffline = options.offline ?? effectiveConfig.offline ?? this.offline;
    if (isOffline) {
      if (effectiveConfig.mock) {
        return {
          data: null as unknown as T,
          status: 200,
          statusText: 'OFFLINE_MOCK',
          headers: {},
          config: effectiveConfig as any,
        };
      }
      throw new Error(`Offline mode active. Network call to "${url}" blocked.`);
    }

    const domain = this.extractDomain(url);
    const maxRetries = options.maxRetries ?? this.maxRetries;
    let attempt = 0;

    while (attempt <= maxRetries) {
      attempt += 1;

      if (this.rateLimiter.isCircuitOpen(domain)) {
        throw new CircuitBreakerOpenError(domain);
      }

      try {
        await this.rateLimiter.throttle(domain);

        const ua =
          options.userAgent ??
          options.defaultUserAgent ??
          this.defaultUserAgent ??
          this.getNextUserAgent();
        const headers: Record<string, string> = {
          'User-Agent': ua,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          ...this.defaultHeaders,
          ...options.customHeaders,
          ...options.defaultHeaders,
          ...(effectiveConfig.headers as Record<string, string>),
        };

        const response = await axios.request<T>({
          url,
          timeout: options.timeoutMs ?? effectiveConfig.timeout ?? this.timeoutMs,
          ...effectiveConfig,
          headers,
        });

        this.rateLimiter.recordSuccess(domain);
        return response;
      } catch (error: unknown) {
        const isAxiosError = axios.isAxiosError(error);
        const status = isAxiosError ? error.response?.status : undefined;

        this.rateLimiter.recordFailure(domain, status);

        const isRetriable =
          status === 429 ||
          status === 403 ||
          (typeof status === 'number' && status >= 500 && status <= 599) ||
          (isAxiosError && (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET'));

        if (attempt <= maxRetries && isRetriable) {
          const backoffMs = this.rateLimiter.getBackoffDelay(
            domain,
            attempt,
            status
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        throw error;
      }
    }

    throw new Error(`Failed to request "${url}" after ${maxRetries} retries.`);
  }

  /**
   * Fetch raw HTML from a URL.
   */
  public async fetchHtml(
    url: string,
    options: HttpClientOptions = {}
  ): Promise<string> {
    const res = await this.request<string>(
      url,
      { responseType: 'text' },
      options
    );
    return res.data;
  }

  /**
   * Fetch parsed JSON from a URL.
   */
  public async fetchJson<T = unknown>(
    url: string,
    options: HttpClientOptions = {}
  ): Promise<T> {
    const res = await this.request<T>(
      url,
      {
        responseType: 'json',
        headers: { Accept: 'application/json' },
      },
      options
    );
    return res.data;
  }
}

export const defaultHttpClient = new HttpClient();
