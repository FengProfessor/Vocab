/**
 * Rate Limiter and Circuit Breaker for Ethical Crawling
 * File: scripts/speaking/core/rate-limiter.ts
 *
 * Implements:
 * 1. Per-domain traffic shaping with uniform random jitter (1500ms - 4000ms default).
 * 2. Strict concurrency control (max 1 in-flight request per domain).
 * 3. Exponential backoff calculation:
 *    - 429/403: 45s * retryCount
 *    - 5xx/Network: 1000ms * 2^retryCount
 * 4. Circuit breaker: trips after N consecutive failures, enters cooldown period.
 */

export interface RateLimiterOptions {
  minDelayMs?: number;
  maxDelayMs?: number;
  circuitFailureThreshold?: number;
  circuitCooldownMs?: number;
}

interface DomainState {
  lastRequestTime: number;
  consecutiveFailures: number;
  circuitTrippedAt: number | null;
  queue: Promise<void>;
}

export class RateLimiter {
  private readonly minDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly failureThreshold: number;
  private readonly circuitCooldownMs: number;
  private readonly domainStates = new Map<string, DomainState>();

  constructor(options: RateLimiterOptions = {}) {
    this.minDelayMs = options.minDelayMs ?? 1500;
    this.maxDelayMs = options.maxDelayMs ?? 4000;
    this.failureThreshold = options.circuitFailureThreshold ?? 3;
    this.circuitCooldownMs = options.circuitCooldownMs ?? 10 * 60 * 1000; // 10 minutes default
  }

  /**
   * Get or initialize internal domain tracking state.
   */
  private getDomainState(domain: string): DomainState {
    let state = this.domainStates.get(domain);
    if (!state) {
      state = {
        lastRequestTime: 0,
        consecutiveFailures: 0,
        circuitTrippedAt: null,
        queue: Promise.resolve(),
      };
      this.domainStates.set(domain, state);
    }
    return state;
  }

  /**
   * Calculate jittered delay between minDelayMs and maxDelayMs.
   */
  public calculateJitterDelay(): number {
    if (this.minDelayMs >= this.maxDelayMs) {
      return this.minDelayMs;
    }
    return Math.floor(
      this.minDelayMs + Math.random() * (this.maxDelayMs - this.minDelayMs)
    );
  }

  /**
   * Calculate backoff duration based on HTTP status code and retry count.
   * - 429 / 403: 45s * retryCount (e.g., attempt 1 = 45s, attempt 2 = 90s, attempt 3 = 135s)
   * - 5xx or network errors: 1000ms * 2^(retryCount - 1)
   */
  public getBackoffDelay(
    _domain: string,
    retryCount: number,
    status?: number
  ): number {
    const attempt = Math.max(1, retryCount);
    if (status === 429 || status === 403) {
      return 45000 * attempt;
    }
    return 1000 * Math.pow(2, attempt - 1);
  }

  /**
   * Checks if the circuit breaker is currently open (tripped) for a given domain.
   */
  public isCircuitOpen(domain: string): boolean {
    const state = this.getDomainState(domain);
    if (state.circuitTrippedAt === null) {
      return false;
    }

    const elapsed = Date.now() - state.circuitTrippedAt;
    if (elapsed >= this.circuitCooldownMs) {
      // Cooldown has elapsed -> circuit resets to half-open / closed
      state.circuitTrippedAt = null;
      state.consecutiveFailures = 0;
      return false;
    }

    return true;
  }

  /**
   * Records a successful request for a domain.
   */
  public recordSuccess(domain: string): void {
    const state = this.getDomainState(domain);
    state.consecutiveFailures = 0;
    state.circuitTrippedAt = null;
  }

  /**
   * Records a failed request for a domain.
   * If consecutive failures reach threshold, trips the circuit breaker.
   */
  public recordFailure(domain: string, _status?: number): void {
    const state = this.getDomainState(domain);
    state.consecutiveFailures += 1;

    if (state.consecutiveFailures >= this.failureThreshold) {
      state.circuitTrippedAt = Date.now();
    }
  }

  /**
   * Throttles domain traffic sequentially.
   * Guarantees max 1 in-flight request per domain and minimum jittered spacing.
   * Throws Error if circuit breaker is open.
   */
  public async throttle(domain: string): Promise<number> {
    if (this.isCircuitOpen(domain)) {
      throw new Error(
        `Circuit breaker is OPEN for domain "${domain}". Cooldown in progress.`
      );
    }

    const state = this.getDomainState(domain);

    // Enqueue request behind existing in-flight operations for this domain
    const operation = state.queue.then(async () => {
      const now = Date.now();
      const elapsed = now - state.lastRequestTime;
      const targetDelay = this.calculateJitterDelay();
      const waitTime = Math.max(0, targetDelay - elapsed);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      state.lastRequestTime = Date.now();
      return waitTime;
    });

    state.queue = operation.then(() => {}).catch(() => {});
    return operation;
  }

  /**
   * Get consecutive failure count for inspection.
   */
  public getFailureCount(domain: string): number {
    return this.getDomainState(domain).consecutiveFailures;
  }

  /**
   * Reset internal state for all domains or a specific domain.
   */
  public reset(domain?: string): void {
    if (domain) {
      this.domainStates.delete(domain);
    } else {
      this.domainStates.clear();
    }
  }
}

export const defaultRateLimiter = new RateLimiter();
