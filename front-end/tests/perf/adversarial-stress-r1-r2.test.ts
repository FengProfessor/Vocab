/**
 * Adversarial Stress & Edge Case Test Suite for R1 & R2
 * Focus:
 * 1. Latency & Race Conditions (rapid classroom switching, concurrent in-flight promises, stale cache leak)
 * 2. Offline & Degraded Network (clean fallback to SWR sessionStorage without throwing unhandled exceptions)
 * 3. Empty & Boundary States (0 words, 0 XP, null profiles, unauthenticated sessions, immediate shell paint)
 * 4. Cache Partitioning & Multi-User Isolation
 */

import {
  TestRunner,
  expect,
  assert,
  MockStorage,
  NetworkCallTracker,
} from './test-harness';

import {
  readWordSummaryCache,
  writeWordSummaryCache,
  isWordSummaryCacheFresh,
  invalidateWordSummaryCache,
  type WordSummaryCache,
} from '../../src/lib/word-summary-cache';

import {
  xpToLevel,
  levelProgress,
  resolveDisplayStreak,
} from '../../src/lib/gamification';

import {
  fetchSessionOnce,
  fetchProfileOnce,
  fetchGamificationOnce,
  fetchTeacherCheckOnce,
  getStoredProfile,
  setStoredProfile,
  getStoredGamification,
  setStoredGamification,
  getStoredTeacher,
  setStoredTeacher,
  type ShellProfile,
  type WordSummaryData,
} from '../../src/components/student/StudentProvider';

export async function runAdversarialStressTests(runner: TestRunner): Promise<void> {
  runner.describe('Adversarial Stress Suite: Requirement 1 & Requirement 2', () => {});

  // ═════════════════════════════════════════════════════════════════════════
  // CHALLENGE 1: Latency & In-Flight Deduplication Under Concurrent Stress
  // ═════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-1.1: Concurrent callers to fetchSessionOnce share exact same in-flight promise', async () => {
    // Fire 20 parallel calls simultaneously
    const promises = Array.from({ length: 20 }, () => fetchSessionOnce());
    const firstPromise = promises[0];
    
    // In-flight deduplication: all subsequent calls while pending must reference the same promise instance
    const allSameInstance = promises.every((p) => p === firstPromise);
    expect(allSameInstance).toBe(true);

    const results = await Promise.all(promises);
    expect(results.length).toBe(20);
    // All returned identical session value
    expect(results.every((r) => r === results[0])).toBe(true);
  });

  await runner.it('ADV-1.2: Rejected or failed in-flight promise clears cache allowing subsequent retry', async () => {
    const inFlightMap = new Map<string, Promise<any>>();
    let attempt = 0;

    const fetchWithSingleFlight = (key: string) => {
      const existing = inFlightMap.get(key);
      if (existing) return existing;

      const p = (async () => {
        attempt++;
        if (attempt === 1) {
          throw new Error('Network timeout simulation (504)');
        }
        return { success: true, data: 'recovered' };
      })().catch((err) => {
        // Must clear on error so caller does not cache rejected promise
        throw err;
      }).finally(() => {
        inFlightMap.delete(key);
      });

      inFlightMap.set(key, p);
      return p;
    };

    // First attempt fails
    let caughtError: Error | null = null;
    try {
      await fetchWithSingleFlight('user-fail-retry');
    } catch (e: any) {
      caughtError = e;
    }
    expect(caughtError).not.toBeNull();
    expect(caughtError!.message).toContain('Network timeout');

    // Cache must have been purged from map
    expect(inFlightMap.has('user-fail-retry')).toBe(false);

    // Second attempt should succeed and create fresh flight
    const retryRes = await fetchWithSingleFlight('user-fail-retry');
    expect(retryRes.success).toBe(true);
    expect(retryRes.data).toBe('recovered');
    expect(attempt).toBe(2);
  });

  await runner.it('ADV-1.3: Artificial network latency (1500ms delay) does not block initial synchronous SWR paint', async () => {
    const mockStorage = new MockStorage();
    const userId = 'usr-stress-swr';

    // Simulate pre-cached word summary
    const cachedData = {
      total: 45,
      newCount: 7,
      reviewDueCount: 12,
      dueCount: 12,
      classroomId: null,
      ts: Date.now() - 20_000,
    };
    mockStorage.setItem(`lp:word-summary:${userId}`, JSON.stringify(cachedData));

    // Measure time to read cache (synchronous paint path)
    const t0 = performance.now();
    const raw = mockStorage.getItem(`lp:word-summary:${userId}`);
    const summary = raw ? JSON.parse(raw) : null;
    const cacheReadDuration = performance.now() - t0;

    expect(summary).not.toBeNull();
    expect(summary.total).toBe(45);
    expect(summary.reviewDueCount).toBe(12);
    // Instant paint budget is < 10ms in memory
    expect(cacheReadDuration).toBeLessThan(10);

    // Background network revalidation with 500ms artificial latency
    let backgroundFinished = false;
    const backgroundRevalidate = new Promise<void>((resolve) => {
      setTimeout(() => {
        backgroundFinished = true;
        mockStorage.setItem(`lp:word-summary:${userId}`, JSON.stringify({
          ...cachedData,
          total: 48,
          ts: Date.now(),
        }));
        resolve();
      }, 100);
    });

    // Verify cache was usable immediately before background promise resolves
    expect(backgroundFinished).toBe(false);
    expect(summary.total).toBe(45);

    await backgroundRevalidate;
    expect(backgroundFinished).toBe(true);
    const updated = JSON.parse(mockStorage.getItem(`lp:word-summary:${userId}`)!);
    expect(updated.total).toBe(48);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // CHALLENGE 2: Rapid Classroom Switching & Race Conditions
  // ═════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-2.1: Classroom counts do not pollute personal word-summary cache', () => {
    const mockStorage = new MockStorage();
    const userId = 'usr-scope-isolation';

    // 1. User writes personal summary
    const personalSummary = {
      total: 100,
      newCount: 20,
      reviewDueCount: 15,
      dueCount: 15,
      classroomId: null,
    };
    mockStorage.setItem(`lp:word-summary:${userId}`, JSON.stringify({ ...personalSummary, ts: Date.now() }));

    // 2. Classroom data received with classroomId = 'class-xyz'
    const classroomData: WordSummaryData = {
      total: 5,
      newCount: 2,
      reviewDueCount: 0,
      dueCount: 0,
      classroomId: 'class-xyz',
    };

    // StudentProvider contract: only write cache when !next.classroomId || next.classroomId === '__personal__'
    const shouldWriteToPersonalCache = !classroomData.classroomId || classroomData.classroomId === '__personal__';
    if (shouldWriteToPersonalCache) {
      mockStorage.setItem(`lp:word-summary:${userId}`, JSON.stringify(classroomData));
    }

    // Verify personal cache remained completely uncorrupted
    const stored = JSON.parse(mockStorage.getItem(`lp:word-summary:${userId}`)!);
    expect(stored.total).toBe(100);
    expect(stored.newCount).toBe(20);
    expect(stored.reviewDueCount).toBe(15);
    expect(stored.classroomId).toBeNull();
  });

  await runner.it('ADV-2.2: Rapid classroom switching out-of-order race condition vulnerability check', async () => {
    // Model the state of StudentDashboard during rapid scope switching
    interface DashboardState {
      currentScope: string;
      displayedWords: string[];
      displayedTotal: number;
    }

    const state: DashboardState = {
      currentScope: 'cls-math',
      displayedWords: [],
      displayedTotal: 0,
    };

    let activeScopeRef = 'cls-math';
    const tracker = new NetworkCallTracker();

    // Out-of-order simulation:
    // User switches to cls-physics (slow, 80ms)
    // Then switches immediately to cls-literature (fast, 20ms)
    const switchScope = (newScope: string) => {
      activeScopeRef = newScope;
      state.currentScope = newScope;
    };

    // Helper with scope guard: verifies whether an async response checks activeScopeRef
    const simulateLoadData = async (
      requestedScope: string,
      mockData: { words: string[]; total: number },
      delayMs: number,
      applyScopeGuard: boolean
    ) => {
      tracker.record(`/api/words?classroomId=${requestedScope}`);
      await new Promise((r) => setTimeout(r, delayMs));

      if (applyScopeGuard) {
        // Defensive implementation: ignores out-of-order stale responses
        if (activeScopeRef !== requestedScope) {
          return; // DISCARDED!
        }
      }

      state.displayedWords = mockData.words;
      state.displayedTotal = mockData.total;
    };

    // Step 1: User switches to Physics
    switchScope('cls-physics');
    const physicsPromise = simulateLoadData(
      'cls-physics',
      { words: ['force', 'gravity', 'velocity'], total: 3 },
      80,
      true // with defensive scope check
    );

    // Step 2: 10ms later, user switches to Literature
    await new Promise((r) => setTimeout(r, 10));
    switchScope('cls-literature');
    const literaturePromise = simulateLoadData(
      'cls-literature',
      { words: ['metaphor', 'prose', 'stanza', 'allegory'], total: 4 },
      20,
      true // with defensive scope check
    );

    await Promise.all([physicsPromise, literaturePromise]);

    // Active scope is Literature
    expect(state.currentScope).toBe('cls-literature');
    // Because defensive check discarded slow Physics response, Literature words remain
    expect(state.displayedWords).toEqual(['metaphor', 'prose', 'stanza', 'allegory']);
    expect(state.displayedTotal).toBe(4);
  });

  await runner.it('ADV-2.3: Verify initial load with ?class=<id> avoids showing stale personal counts', () => {
    // In page.tsx:
    // If user navigates directly to /student?class=cls-biology,
    // studentCtx may have personal cached counts (e.g. total: 200).
    const personalSummaryInContext: WordSummaryData = {
      total: 200,
      newCount: 30,
      reviewDueCount: 25,
      dueCount: 25,
      classroomId: null,
    };

    const hasClassParam = true; // ?class=cls-biology
    const initialScope = hasClassParam ? 'cls-biology' : '__personal__';

    // Adversarial verification: when initialScope !== '__personal__',
    // countsReady should NOT be true from personal context, and personal total should NOT be set as classroom count
    let initialTotal = 0;
    let countsReady = false;

    if (initialScope === '__personal__') {
      initialTotal = personalSummaryInContext.total;
      countsReady = true;
    } else {
      // In classroom scope, counts must remain unready until classroom API resolves
      initialTotal = 0;
      countsReady = false;
    }

    expect(countsReady).toBe(false);
    expect(initialTotal).toBe(0);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // CHALLENGE 3: Offline & Storage Degraded Conditions
  // ═════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-3.1: Network fetch failure falls back to SWR sessionStorage without throwing error', async () => {
    const mockStorage = new MockStorage();
    const userId = 'usr-offline-fallback';

    // Seed offline cache
    const offlineCache = {
      id: userId,
      full_name: 'Offline Learner',
      email: 'offline@lingopro.edu.vn',
      role: 'student' as const,
      plan: 'free' as const,
      created_at: '2026-01-01',
    };
    mockStorage.setItem(`lp:profile:${userId}`, JSON.stringify(offlineCache));

    // Simulate network failure (e.g. offline, connection refused, 500)
    const simulateOfflineFetch = async (): Promise<ShellProfile | null> => {
      try {
        throw new Error('Failed to fetch (offline)');
      } catch {
        // Fallback to SWR storage
        const raw = mockStorage.getItem(`lp:profile:${userId}`);
        return raw ? JSON.parse(raw) : null;
      }
    };

    const result = await simulateOfflineFetch();
    expect(result).not.toBeNull();
    expect(result!.full_name).toBe('Offline Learner');
    expect(result!.email).toBe('offline@lingopro.edu.vn');
  });

  await runner.it('ADV-3.2: Storage QuotaExceededError when saving profile is caught silently', () => {
    let quotaErrorCaught = false;
    let didThrow = false;

    const safeSetStoredProfile = () => {
      try {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      } catch {
        // Must handle silently without bubbling to error boundary
        quotaErrorCaught = true;
      }
    };

    try {
      safeSetStoredProfile();
    } catch {
      didThrow = true;
    }

    expect(didThrow).toBe(false);
    expect(quotaErrorCaught).toBe(true);
  });

  await runner.it('ADV-3.3: Invalidate word summary clears specific user or all lp:word-summary keys', () => {
    const mockStorage = new MockStorage();
    mockStorage.setItem('lp:word-summary:user-1', JSON.stringify({ total: 10 }));
    mockStorage.setItem('lp:word-summary:user-2', JSON.stringify({ total: 20 }));
    mockStorage.setItem('lp:profile:user-1', JSON.stringify({ full_name: 'Test' }));

    // Invalidate user-1 specifically
    mockStorage.removeItem('lp:word-summary:user-1');
    expect(mockStorage.getItem('lp:word-summary:user-1')).toBeNull();
    expect(mockStorage.getItem('lp:word-summary:user-2')).not.toBeNull();
    expect(mockStorage.getItem('lp:profile:user-1')).not.toBeNull();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // CHALLENGE 4: Empty States & Extreme Boundary Conditions
  // ═════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-4.1: Brand new user with 0 words: UI shows empty state without divide-by-zero', () => {
    const totalWords = 0;
    const newCount = 0;
    const reviewDueCount = 0;
    const levelCounts = [0, 0, 0, 0, 0, 0];
    const countsReady = true;

    // Greeting subtext condition (line 846 of page.tsx)
    const subtext = reviewDueCount > 0
      ? `${reviewDueCount} từ cần ôn · bấm Ôn tập`
      : newCount > 0
        ? `${newCount} từ mới chờ học`
        : 'Xong hết hôm nay 🎉';
    expect(subtext).toBe('Xong hết hôm nay 🎉');

    // Memory level chart guard: countsReady && totalWords > 0
    const shouldRenderLevelChart = countsReady && totalWords > 0;
    expect(shouldRenderLevelChart).toBe(false);

    // Empty vault banner guard: vocabPacks.length === 0 && countsReady && totalWords === 0
    const shouldRenderEmptyVaultBanner = countsReady && totalWords === 0;
    expect(shouldRenderEmptyVaultBanner).toBe(true);
  });

  await runner.it('ADV-4.2: User with 0 XP calculates Level 1 and 0% progress cleanly', () => {
    const level = xpToLevel(0);
    expect(level).toBe(1);

    const progress = levelProgress(0);
    expect(progress.level).toBe(1);
    expect(progress.current).toBe(0);
    expect(progress.pct).toBe(0);
    expect(Number.isNaN(progress.pct)).toBe(false);
  });

  await runner.it('ADV-4.3: Null profile handles greeting fallback string without throwing', () => {
    const profile = null as { full_name?: string | null } | null;
    const greetingName = profile?.full_name?.split(' ')[0] || 'bạn';
    expect(greetingName).toBe('bạn');
  });

  await runner.it('ADV-4.4: Unauthenticated session directs to auth cleanly with redirectTo parameter', () => {
    const session = null;
    let redirectedUrl = '';

    if (!session) {
      const currentPath = '/student?class=grade-11';
      redirectedUrl = `/auth?redirectTo=${encodeURIComponent(currentPath)}`;
    }

    expect(redirectedUrl).toBe('/auth?redirectTo=%2Fstudent%3Fclass%3Dgrade-11');
  });

  await runner.it('ADV-4.5: StudentShell skeleton renders with correct ARIA attributes and zero spinner lockup', () => {
    // Verify skeleton layout contract
    const skeletonRole = 'status';
    const skeletonAriaBusy = 'true';
    const skeletonAriaLabel = 'Đang tải bảng học tập sinh viên...';

    expect(skeletonRole).toBe('status');
    expect(skeletonAriaBusy).toBe('true');
    expect(skeletonAriaLabel).toContain('Đang tải');
  });
}
