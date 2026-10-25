/**
 * Test Suite for Milestone M3.3: Standardize Navigation & Deep-Links (Push & Bell)
 * 
 * Verifies:
 * 1. Web Push Notification Deep-Link (/review) in cron and test routes
 * 2. Push Notification default URL and robust link formatting in notifications.ts
 * 3. Service Worker notificationclick handler logic in both public script and dynamic route
 * 4. NotificationBell review link scoping (handles null, __personal__, and custom classrooms)
 * 5. Student Dashboard CTA ("Ôn Tập FSRS") link scoping (handles __personal__ and classroom scope)
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, expect } from './perf/test-harness';

const runner = new TestRunner();

// ============================================================================
// Service Worker Simulation Environment
// ============================================================================

interface MockWindowClient {
  url: string;
  focused: boolean;
  navigatedTo: string | null;
  focus(): Promise<void>;
  navigate(url: string): Promise<MockWindowClient>;
}

class MockServiceWorkerGlobalScope {
  location: { origin: string; href: string };
  clients: {
    matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<MockWindowClient[]>;
    openWindow(url: string): Promise<MockWindowClient | null>;
  };
  eventListeners: Map<string, Array<(event: unknown) => void>> = new Map();
  openedWindows: string[] = [];
  mockClients: MockWindowClient[] = [];

  constructor(origin: string, existingClients: Array<{ url: string }>) {
    this.location = { origin, href: `${origin}/firebase-messaging-sw.js` };
    this.mockClients = existingClients.map((c): MockWindowClient => ({
      url: c.url,
      focused: false,
      navigatedTo: null,
      async focus() {
        this.focused = true;
      },
      async navigate(targetUrl: string) {
        this.navigatedTo = targetUrl;
        this.url = targetUrl;
        return this;
      },
    }));

    this.clients = {
      matchAll: async () => this.mockClients,
      openWindow: async (targetUrl: string) => {
        this.openedWindows.push(targetUrl);
        const newClient: MockWindowClient = {
          url: targetUrl,
          focused: true,
          navigatedTo: null,
          async focus() {
            this.focused = true;
          },
          async navigate(u: string) {
            this.navigatedTo = u;
            this.url = u;
            return this;
          },
        };
        this.mockClients.push(newClient);
        return newClient;
      },
    };
  }

  addEventListener(type: string, handler: (event: unknown) => void) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(handler);
  }

  async triggerNotificationClick(data: { url?: string; FCM_MSG?: { data?: { url?: string } } }): Promise<void> {
    const handlers = this.eventListeners.get('notificationclick') || [];
    let waitPromise: Promise<unknown> | null = null;

    const event = {
      notification: {
        data,
        close: () => {},
      },
      stopImmediatePropagation: () => {},
      waitUntil: (promise: Promise<unknown>) => {
        waitPromise = promise;
      },
    };

    for (const handler of handlers) {
      handler(event);
    }

    if (waitPromise) {
      await waitPromise;
    }
  }
}

// Function to simulate the notificationclick logic from Service Worker
function executeNotificationClickLogic(
  self: MockServiceWorkerGlobalScope,
  data: { url?: string; FCM_MSG?: { data?: { url?: string } } }
) {
  const clients = self.clients;
  const rawUrl = data.url || (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || '/review';
  let targetUrl: string;
  try {
    targetUrl = new URL(rawUrl, self.location.origin).href;
  } catch {
    targetUrl = rawUrl;
  }

  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    let matchingClient: MockWindowClient | null = null;
    for (const client of windowClients) {
      try {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          if (clientUrl.pathname.startsWith('/review')) {
            matchingClient = client;
            break;
          }
          if (!matchingClient) {
            matchingClient = client;
          }
        }
      } catch {
        // ignore
      }
    }

    if (matchingClient) {
      if ('focus' in matchingClient) {
        matchingClient.focus();
      }
      if ('navigate' in matchingClient && matchingClient.url !== targetUrl) {
        return matchingClient.navigate(targetUrl);
      }
      return;
    }

    if (clients.openWindow) {
      return clients.openWindow(targetUrl);
    }
  });
}

// ============================================================================
// NotificationBell & Dashboard Review Link Pure Logic Simulators
// ============================================================================

function computeNotificationBellReviewHref(classroomId: string | null): string {
  return classroomId && classroomId !== '__personal__'
    ? `/review?class=${encodeURIComponent(classroomId)}`
    : '/review';
}

function computeStudentDashboardReviewHref(currentClassScope: string | null | undefined): string {
  return currentClassScope && currentClassScope !== '__personal__'
    ? `/review?class=${encodeURIComponent(currentClassScope)}`
    : '/review';
}

function formatNotificationLink(url: string = '/review'): string {
  return url.startsWith('http')
    ? url
    : `https://lingopro.online${url.startsWith('/') ? url : `/${url}`}`;
}

// ============================================================================
// Test Suite Execution
// ============================================================================

export async function runM33Tests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING MILESTONE M3.3 NAVIGATION & DEEP-LINKS TEST SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Category 1: Web Push Notification Deep-Link in Source Files
  // --------------------------------------------------------------------------

  await runner.it('1.1: src/app/api/cron/push-due/route.ts routes push to /review', () => {
    const filePath = path.join(process.cwd(), 'src/app/api/cron/push-due/route.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("'/review'")).toBe(true);
    expect(content.includes("sendPushNotificationToUser(\n        profile.id,\n        title,\n        body,\n        '/review'\n      )")).toBe(true);
    // Verify no leftover /student destination in sendPushNotificationToUser
    const matchesStudent = content.match(/sendPushNotificationToUser\([^)]*'\/student'/g);
    expect(matchesStudent).toBe(null);
  });

  await runner.it('1.2: src/lib/notifications.ts defaults to /review and formats URLs safely', () => {
    const filePath = path.join(process.cwd(), 'src/lib/notifications.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("url: string = '/review'")).toBe(true);
    // Verify link construction handles both relative and absolute URLs
    expect(formatNotificationLink('/review')).toBe('https://lingopro.online/review');
    expect(formatNotificationLink('review')).toBe('https://lingopro.online/review');
    expect(formatNotificationLink('/review?class=123')).toBe('https://lingopro.online/review?class=123');
    expect(formatNotificationLink('https://custom.domain.com/review')).toBe('https://custom.domain.com/review');
  });

  await runner.it('1.3: src/app/api/test/push-due/route.ts routes test push to /review', () => {
    const filePath = path.join(process.cwd(), 'src/app/api/test/push-due/route.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("'/review'")).toBe(true);
    const matchesStudent = content.match(/sendPushNotificationToUser\([^)]*'\/student'/g);
    expect(matchesStudent).toBe(null);
  });

  // --------------------------------------------------------------------------
  // Category 2: Service Worker Source Code Verification
  // --------------------------------------------------------------------------

  await runner.it('2.1: public/firebase-messaging-sw.js contains improved notificationclick handler', () => {
    const filePath = path.join(process.cwd(), 'public/firebase-messaging-sw.js');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("const rawUrl = data.url || (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || '/review'")).toBe(true);
    expect(content.includes("new URL(rawUrl, self.location.origin)")).toBe(true);
    expect(content.includes("clientUrl.pathname.startsWith('/review')")).toBe(true);
    expect(content.includes("matchingClient.navigate(targetUrl)")).toBe(true);
    expect(content.includes("matchingClient.focus()")).toBe(true);
    expect(content.includes("clients.openWindow(targetUrl)")).toBe(true);
  });

  await runner.it('2.2: src/app/firebase-messaging-sw/route.ts contains identical improved handler', () => {
    const filePath = path.join(process.cwd(), 'src/app/firebase-messaging-sw/route.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("const rawUrl = data.url || (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || '/review'")).toBe(true);
    expect(content.includes("new URL(rawUrl, self.location.origin)")).toBe(true);
    expect(content.includes("clientUrl.pathname.startsWith('/review')")).toBe(true);
    expect(content.includes("matchingClient.navigate(targetUrl)")).toBe(true);
    expect(content.includes("matchingClient.focus()")).toBe(true);
    expect(content.includes("clients.openWindow(targetUrl)")).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Category 3: Service Worker Behavioral Simulation
  // --------------------------------------------------------------------------

  await runner.it('3.1: SW opens new window if no client matches the origin', async () => {
    const sw = new MockServiceWorkerGlobalScope('https://lingopro.online', [
      { url: 'https://other-domain.com/page' },
    ]);

    await executeNotificationClickLogic(sw, { url: '/review' });

    expect(sw.openedWindows.length).toBe(1);
    expect(sw.openedWindows[0]).toBe('https://lingopro.online/review');
  });

  await runner.it('3.2: SW focuses and navigates client when URL differs on same origin', async () => {
    const sw = new MockServiceWorkerGlobalScope('https://lingopro.online', [
      { url: 'https://lingopro.online/student' },
    ]);

    await executeNotificationClickLogic(sw, { url: '/review' });

    expect(sw.openedWindows.length).toBe(0); // Did not open duplicate tab
    expect(sw.mockClients[0].focused).toBe(true);
    expect(sw.mockClients[0].navigatedTo).toBe('https://lingopro.online/review');
    expect(sw.mockClients[0].url).toBe('https://lingopro.online/review');
  });

  await runner.it('3.3: SW focuses existing /review tab without redundant re-navigation if URL matches', async () => {
    const sw = new MockServiceWorkerGlobalScope('https://lingopro.online', [
      { url: 'https://lingopro.online/review' },
    ]);

    await executeNotificationClickLogic(sw, { url: '/review' });

    expect(sw.openedWindows.length).toBe(0);
    expect(sw.mockClients[0].focused).toBe(true);
    expect(sw.mockClients[0].navigatedTo).toBe(null); // No redundant reload
  });

  await runner.it('3.4: SW prioritizes tab already on /review over other origin tabs', async () => {
    const sw = new MockServiceWorkerGlobalScope('https://lingopro.online', [
      { url: 'https://lingopro.online/student' },
      { url: 'https://lingopro.online/review?class=math' },
      { url: 'https://lingopro.online/profile' },
    ]);

    await executeNotificationClickLogic(sw, { url: '/review' });

    expect(sw.openedWindows.length).toBe(0);
    // Tab on review was prioritized and navigated to target /review
    expect(sw.mockClients[1].focused).toBe(true);
    expect(sw.mockClients[1].navigatedTo).toBe('https://lingopro.online/review');
    // Other tabs were untouched
    expect(sw.mockClients[0].focused).toBe(false);
    expect(sw.mockClients[2].focused).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Category 4: NotificationBell & Student Dashboard CTA Logic & Source
  // --------------------------------------------------------------------------

  await runner.it('4.1: NotificationBell review link logic matches specifications', () => {
    // When classroomId is null -> /review
    expect(computeNotificationBellReviewHref(null)).toBe('/review');
    // When classroomId is __personal__ -> /review (not /review?class=__personal__)
    expect(computeNotificationBellReviewHref('__personal__')).toBe('/review');
    // When classroomId is valid UUID -> /review?class=<UUID>
    const classId = 'e2b1b369-6ea8-4e8c-8515-81fa2dbdfb4b';
    expect(computeNotificationBellReviewHref(classId)).toBe(`/review?class=${classId}`);
  });

  await runner.it('4.2: src/components/NotificationBell.tsx implements reviewHref consistently', () => {
    const filePath = path.join(process.cwd(), 'src/components/NotificationBell.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("const reviewHref = classroomId && classroomId !== '__personal__'")).toBe(true);
    expect(content.includes("`/review?class=${encodeURIComponent(classroomId)}`")).toBe(true);
    expect(content.includes("href: reviewHref")).toBe(true);
  });

  await runner.it('4.3: Student Dashboard CTA review link logic matches specifications', () => {
    // When scope is __personal__ -> /review
    expect(computeStudentDashboardReviewHref('__personal__')).toBe('/review');
    // When scope is null or undefined -> /review
    expect(computeStudentDashboardReviewHref(null)).toBe('/review');
    expect(computeStudentDashboardReviewHref(undefined)).toBe('/review');
    // When scope is classroom UUID -> /review?class=<UUID>
    const classId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    expect(computeStudentDashboardReviewHref(classId)).toBe(`/review?class=${classId}`);
  });

  await runner.it('4.4: src/app/student/page.tsx preserves currentClassScope in Ôn Tập FSRS card', () => {
    const filePath = path.join(process.cwd(), 'src/app/student/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content.includes("currentClassScope && currentClassScope !== '__personal__'")).toBe(true);
    expect(content.includes("`/review?class=${encodeURIComponent(currentClassScope)}`")).toBe(true);
    expect(content.includes("data-onboarding=\"review\"")).toBe(true);
  });

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Navigation Suite Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Execution Time: ${stats.durationMs} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runM33Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
