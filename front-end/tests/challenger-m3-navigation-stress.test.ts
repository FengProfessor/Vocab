/**
 * Adversarial Stress & Edge Case Test Suite for Milestone M3.3:
 * Standardize Navigation & Deep-Links (Push & Bell)
 * 
 * Conducted by Challenger 1 (Empirical Verification & Stress Harness)
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, expect } from './perf/test-harness';

const runner = new TestRunner();

// ============================================================================
// Service Worker Simulation Harness
// ============================================================================

interface MockWindowClient {
  id: string;
  url: string;
  focused: boolean;
  navigatedTo: string | null;
  focusCount: number;
  navigateCount: number;
  focus(): Promise<void>;
  navigate?(url: string): Promise<MockWindowClient>;
}

class MockServiceWorkerContext {
  origin: string;
  location: { origin: string; href: string };
  clients: {
    matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<MockWindowClient[]>;
    openWindow?(url: string): Promise<MockWindowClient | null>;
  };
  mockClients: MockWindowClient[] = [];
  openedWindows: string[] = [];

  constructor(origin: string, existingClients: Array<{ id?: string; url: string; hasNavigate?: boolean }>) {
    this.origin = origin;
    this.location = { origin, href: `${origin}/firebase-messaging-sw.js` };
    this.mockClients = existingClients.map((c, i): MockWindowClient => {
      const client: MockWindowClient = {
        id: c.id || `client-${i}`,
        url: c.url,
        focused: false,
        navigatedTo: null,
        focusCount: 0,
        navigateCount: 0,
        async focus() {
          this.focused = true;
          this.focusCount++;
        },
      };

      if (c.hasNavigate !== false) {
        client.navigate = async (targetUrl: string) => {
          client.navigatedTo = targetUrl;
          client.url = targetUrl;
          client.navigateCount++;
          return client;
        };
      }

      return client;
    });

    this.clients = {
      matchAll: async () => this.mockClients,
      openWindow: async (targetUrl: string) => {
        this.openedWindows.push(targetUrl);
        const newClient: MockWindowClient = {
          id: `new-client-${this.openedWindows.length}`,
          url: targetUrl,
          focused: true,
          navigatedTo: null,
          focusCount: 1,
          navigateCount: 0,
          async focus() {
            this.focused = true;
            this.focusCount++;
          },
          async navigate(u: string) {
            this.navigatedTo = u;
            this.url = u;
            this.navigateCount++;
            return this;
          },
        };
        this.mockClients.push(newClient);
        return newClient;
      },
    };
  }

  async simulateNotificationClick(data: { url?: string; FCM_MSG?: { data?: { url?: string } } } | null | undefined) {
    const rawData = data || {};
    const rawUrl = rawData.url || (rawData.FCM_MSG && rawData.FCM_MSG.data && rawData.FCM_MSG.data.url) || '/review';
    let targetUrl: string;
    try {
      targetUrl = new URL(rawUrl, this.location.origin).href;
    } catch {
      targetUrl = rawUrl;
    }

    const windowClients = await this.clients.matchAll({ type: 'window', includeUncontrolled: true });
    let matchingClient: MockWindowClient | null = null;

    for (const client of windowClients) {
      try {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === this.location.origin) {
          if (clientUrl.pathname.startsWith('/review')) {
            matchingClient = client;
            break;
          }
          if (!matchingClient) {
            matchingClient = client;
          }
        }
      } catch {
        // ignore parse error
      }
    }

    if (matchingClient) {
      if ('focus' in matchingClient) {
        await matchingClient.focus();
      }
      if ('navigate' in matchingClient && matchingClient.navigate && matchingClient.url !== targetUrl) {
        return matchingClient.navigate(targetUrl);
      }
      return;
    }

    if (this.clients.openWindow) {
      return this.clients.openWindow(targetUrl);
    }
  }
}

// Pure helper matching notifications.ts
function formatNotificationLink(url: string = '/review'): string {
  return url.startsWith('http')
    ? url
    : `https://lingopro.online${url.startsWith('/') ? url : `/${url}`}`;
}

// Pure helper matching NotificationBell and Dashboard CTA
function computeScopedReviewHref(classroomId: string | null | undefined): string {
  return classroomId && classroomId !== '__personal__'
    ? `/review?class=${encodeURIComponent(classroomId)}`
    : '/review';
}

export async function runAdversarialStressSuite() {
  console.log('\n================================================================');
  console.log('⚔️  RUNNING M3.3 ADVERSARIAL STRESS & EDGE CASE HARNESS');
  console.log('================================================================\n');

  // ==========================================================================
  // Suite 1: Source Parity & Route Integrity
  // ==========================================================================
  runner.describe('Suite 1: Static Source Parity & Deep-Link Destination', () => {});

  await runner.it('1.1: Verify public SW and dynamic route SW share identical click logic', () => {
    const publicSw = fs.readFileSync(path.join(process.cwd(), 'public/firebase-messaging-sw.js'), 'utf-8');
    const routeSw = fs.readFileSync(path.join(process.cwd(), 'src/app/firebase-messaging-sw/route.ts'), 'utf-8');

    // Extract notificationclick handler body from public SW
    const publicMatch = publicSw.match(/self\.addEventListener\('notificationclick',[\s\S]*?\n\}\);/);
    expect(publicMatch !== null).toBe(true);
    const publicHandler = publicMatch![0];

    // Extract notificationclick handler body from dynamic route
    const routeMatch = routeSw.match(/self\.addEventListener\('notificationclick',[\s\S]*?\n\}\);/);
    expect(routeMatch !== null).toBe(true);
    const routeHandler = routeMatch![0];

    // Normalize whitespace for direct comparison
    const normPublic = publicHandler.replace(/\s+/g, ' ').trim();
    const normRoute = routeHandler.replace(/\s+/g, ' ').trim();
    expect(normPublic).toBe(normRoute);
  });

  await runner.it('1.2: Verify no residual /student redirect in any notification dispatchers', () => {
    const cronRoute = fs.readFileSync(path.join(process.cwd(), 'src/app/api/cron/push-due/route.ts'), 'utf-8');
    const testRoute = fs.readFileSync(path.join(process.cwd(), 'src/app/api/test/push-due/route.ts'), 'utf-8');
    const notifLib = fs.readFileSync(path.join(process.cwd(), 'src/lib/notifications.ts'), 'utf-8');

    // Verify default in lib
    expect(notifLib.includes("url: string = '/review'")).toBe(true);

    // Verify cron route explicitly passes '/review'
    expect(cronRoute.includes("'/review'")).toBe(true);
    const cronStudentMatches = cronRoute.match(/sendPushNotificationToUser\([^)]*'\/student'/g);
    expect(cronStudentMatches).toBe(null);

    // Verify test route explicitly passes '/review'
    expect(testRoute.includes("'/review'")).toBe(true);
    const testStudentMatches = testRoute.match(/sendPushNotificationToUser\([^)]*'\/student'/g);
    expect(testStudentMatches).toBe(null);
  });

  // ==========================================================================
  // Suite 2: Service Worker Tab Matching & Lifecycle Stress
  // ==========================================================================
  runner.describe('Suite 2: Service Worker Tab Matching & Navigation Stress', () => {});

  await runner.it('2.1: SW correctly matches and focuses tab when target URL matches existing tab exactly', async () => {
    const sw = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'tab-review', url: 'https://lingopro.online/review' }
    ]);

    await sw.simulateNotificationClick({ url: '/review' });

    expect(sw.openedWindows.length).toBe(0);
    expect(sw.mockClients[0].focused).toBe(true);
    expect(sw.mockClients[0].focusCount).toBe(1);
    expect(sw.mockClients[0].navigateCount).toBe(0); // No redundant reload
    expect(sw.mockClients[0].navigatedTo).toBe(null);
  });

  await runner.it('2.2: SW navigates existing /review tab when query parameters differ (e.g. ?class=123 vs /review)', async () => {
    const sw = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'tab-review-class', url: 'https://lingopro.online/review?class=biology' }
    ]);

    // Push notification comes without class filter (all classes)
    await sw.simulateNotificationClick({ url: '/review' });

    expect(sw.openedWindows.length).toBe(0);
    expect(sw.mockClients[0].focused).toBe(true);
    expect(sw.mockClients[0].navigateCount).toBe(1);
    expect(sw.mockClients[0].navigatedTo).toBe('https://lingopro.online/review');
    expect(sw.mockClients[0].url).toBe('https://lingopro.online/review');
  });

  await runner.it('2.3: SW handles trailing slash normalization gracefully', async () => {
    // Client is at /review, target is /review/
    const sw1 = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'tab-1', url: 'https://lingopro.online/review' }
    ]);
    await sw1.simulateNotificationClick({ url: '/review/' });
    expect(sw1.openedWindows.length).toBe(0);
    expect(sw1.mockClients[0].focused).toBe(true);
    expect(sw1.mockClients[0].navigatedTo).toBe('https://lingopro.online/review/');

    // Client is at /review/, target is /review
    const sw2 = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'tab-2', url: 'https://lingopro.online/review/' }
    ]);
    await sw2.simulateNotificationClick({ url: '/review' });
    expect(sw2.openedWindows.length).toBe(0);
    expect(sw2.mockClients[0].focused).toBe(true);
    expect(sw2.mockClients[0].navigatedTo).toBe('https://lingopro.online/review');
  });

  await runner.it('2.4: Multi-tab priority: prioritizes /review over other app tabs regardless of order', async () => {
    // Array order: /student first, then /settings, then /review
    const sw = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'tab-student', url: 'https://lingopro.online/student' },
      { id: 'tab-settings', url: 'https://lingopro.online/settings' },
      { id: 'tab-review', url: 'https://lingopro.online/review' },
      { id: 'tab-external', url: 'https://otherdomain.com/review' },
    ]);

    await sw.simulateNotificationClick({ url: '/review' });

    expect(sw.openedWindows.length).toBe(0);
    // Specifically tab-review was selected
    expect(sw.mockClients[2].id).toBe('tab-review');
    expect(sw.mockClients[2].focused).toBe(true);
    expect(sw.mockClients[0].focused).toBe(false);
    expect(sw.mockClients[1].focused).toBe(false);
    expect(sw.mockClients[3].focused).toBe(false);
  });

  await runner.it('2.5: Multi-tab fallback: if no /review tab exists, reuses existing student tab instead of opening new', async () => {
    const sw = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'tab-student', url: 'https://lingopro.online/student' },
      { id: 'tab-grammar', url: 'https://lingopro.online/grammar' },
    ]);

    await sw.simulateNotificationClick({ url: '/review' });

    expect(sw.openedWindows.length).toBe(0); // Zero new windows opened!
    expect(sw.mockClients[0].id).toBe('tab-student');
    expect(sw.mockClients[0].focused).toBe(true);
    expect(sw.mockClients[0].navigatedTo).toBe('https://lingopro.online/review');
    expect(sw.mockClients[1].focused).toBe(false);
  });

  await runner.it('2.6: Cross-origin isolation: never matches or redirects external tabs', async () => {
    const sw = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'external-1', url: 'https://google.com' },
      { id: 'external-2', url: 'https://subdomain.lingopro.online/review' }, // different subdomain = different origin
      { id: 'external-3', url: 'http://lingopro.online/review' }, // different protocol = different origin
    ]);

    await sw.simulateNotificationClick({ url: '/review' });

    // Must open a new window because no client matches origin
    expect(sw.openedWindows.length).toBe(1);
    expect(sw.openedWindows[0]).toBe('https://lingopro.online/review');
    // None of the external clients should be touched
    for (const c of sw.mockClients.slice(0, 3)) {
      expect(c.focused).toBe(false);
      expect(c.navigatedTo).toBe(null);
    }
  });

  await runner.it('2.7: Graceful degradation when WindowClient.navigate is undefined or not supported', async () => {
    // Simulate browser/environment where navigate() does not exist
    const sw = new MockServiceWorkerContext('https://lingopro.online', [
      { id: 'tab-student', url: 'https://lingopro.online/student', hasNavigate: false },
    ]);

    // Should focus without crashing
    await sw.simulateNotificationClick({ url: '/review' });

    expect(sw.mockClients[0].focused).toBe(true);
    expect(sw.openedWindows.length).toBe(0);
  });

  await runner.it('2.8: Payload variations: handles nested FCM_MSG, raw url, relative, empty, and null', async () => {
    // 1. Nested FCM_MSG with no existing windows -> opens new window
    const sw1 = new MockServiceWorkerContext('https://lingopro.online', []);
    await sw1.simulateNotificationClick({ FCM_MSG: { data: { url: '/review/session?mode=mixed' } } });
    expect(sw1.openedWindows.length).toBe(1);
    expect(sw1.openedWindows[0]).toBe('https://lingopro.online/review/session?mode=mixed');

    // Subsequent click with tab already open -> reuses existing tab and navigates it!
    await sw1.simulateNotificationClick({ url: 'review?filter=due' });
    expect(sw1.openedWindows.length).toBe(1); // Did not open duplicate window!
    expect(sw1.mockClients[0].focused).toBe(true);
    expect(sw1.mockClients[0].navigatedTo).toBe('https://lingopro.online/review?filter=due');

    // 2. Relative URL without leading slash on fresh context
    const sw2 = new MockServiceWorkerContext('https://lingopro.online', []);
    await sw2.simulateNotificationClick({ url: 'review?filter=due' });
    expect(sw2.openedWindows.length).toBe(1);
    expect(sw2.openedWindows[0]).toBe('https://lingopro.online/review?filter=due');

    // 3. Absolute URL matching origin on fresh context
    const sw3 = new MockServiceWorkerContext('https://lingopro.online', []);
    await sw3.simulateNotificationClick({ url: 'https://lingopro.online/review' });
    expect(sw3.openedWindows.length).toBe(1);
    expect(sw3.openedWindows[0]).toBe('https://lingopro.online/review');

    // 4. Empty string -> fallback to /review
    const sw4 = new MockServiceWorkerContext('https://lingopro.online', []);
    await sw4.simulateNotificationClick({ url: '' });
    expect(sw4.openedWindows.length).toBe(1);
    expect(sw4.openedWindows[0]).toBe('https://lingopro.online/review');

    // 5. Undefined data -> fallback to /review
    const sw5 = new MockServiceWorkerContext('https://lingopro.online', []);
    await sw5.simulateNotificationClick(undefined);
    expect(sw5.openedWindows.length).toBe(1);
    expect(sw5.openedWindows[0]).toBe('https://lingopro.online/review');
  });

  // ==========================================================================
  // Suite 3: Link Formatting & URL Normalization
  // ==========================================================================
  runner.describe('Suite 3: formatNotificationLink Property Generator', () => {});

  await runner.it('3.1: Link formatter preserves full http/https URLs and normalizes relative paths', () => {
    const testCases: [string | undefined, string][] = [
      [undefined, 'https://lingopro.online/review'],
      ['/review', 'https://lingopro.online/review'],
      ['review', 'https://lingopro.online/review'],
      ['/review/session', 'https://lingopro.online/review/session'],
      ['/review?class=123', 'https://lingopro.online/review?class=123'],
      ['review?class=123', 'https://lingopro.online/review?class=123'],
      ['https://lingopro.online/review', 'https://lingopro.online/review'],
      ['http://localhost:3000/review', 'http://localhost:3000/review'],
      ['https://custom-domain.com/deep/link?foo=bar#hash', 'https://custom-domain.com/deep/link?foo=bar#hash'],
    ];

    for (const [input, expected] of testCases) {
      const result = formatNotificationLink(input);
      expect(result).toBe(expected);
      // Verify valid URL parsing
      const parsed = new URL(result);
      expect(parsed.protocol === 'http:' || parsed.protocol === 'https:').toBe(true);
    }
  });

  await runner.it('3.2: Link formatter produces zero double slashes in paths', () => {
    const inputs = ['/review', 'review', '/student', 'student', '/review/session', 'review/session'];
    for (const input of inputs) {
      const res = formatNotificationLink(input);
      const urlObj = new URL(res);
      // Pathname must not have double slash at start
      expect(urlObj.pathname.startsWith('//')).toBe(false);
    }
  });

  // ==========================================================================
  // Suite 4: Scoping & Classroom Parameter Edge Cases
  // ==========================================================================
  runner.describe('Suite 4: NotificationBell & Dashboard CTA Scoping Edge Cases', () => {});

  await runner.it('4.1: Scoping logic correctly strips __personal__ and formats valid classroom IDs', () => {
    const cases: [string | null | undefined, string][] = [
      [null, '/review'],
      [undefined, '/review'],
      ['', '/review'],
      ['__personal__', '/review'],
      ['6ba7b810-9dad-11d1-80b4-00c04fd430c8', '/review?class=6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
      ['class-with spaces', '/review?class=class-with%20spaces'],
      ['class/slash', '/review?class=class%2Fslash'],
      ['class&param=evil', '/review?class=class%26param%3Devil'],
      ['lớp-tiếng-anh-cô-mai-phương', `/review?class=${encodeURIComponent('lớp-tiếng-anh-cô-mai-phương')}`],
    ];

    for (const [input, expected] of cases) {
      const result = computeScopedReviewHref(input);
      expect(result).toBe(expected);
    }
  });

  await runner.it('4.2: End-to-end alignment: Push payload URL and Scoped Href load identical ReviewHub state', () => {
    // When push notification fires: payload URL is /review
    const pushTarget = formatNotificationLink('/review');
    const pushPath = new URL(pushTarget).pathname;

    // When bell notification fires with no class or __personal__: href is /review
    const bellHrefDefault = computeScopedReviewHref(null);
    const bellHrefPersonal = computeScopedReviewHref('__personal__');

    // When dashboard CTA fires with no class or __personal__: href is /review
    const ctaHrefDefault = computeScopedReviewHref(undefined);
    const ctaHrefPersonal = computeScopedReviewHref('__personal__');

    // All must strictly equal '/review'
    expect(pushPath).toBe('/review');
    expect(bellHrefDefault).toBe('/review');
    expect(bellHrefPersonal).toBe('/review');
    expect(ctaHrefDefault).toBe('/review');
    expect(ctaHrefPersonal).toBe('/review');
  });

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Adversarial Suite Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Execution Time: ${stats.durationMs} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runAdversarialStressSuite().catch((err) => {
  console.error('Stress test failure:', err);
  process.exit(1);
});
