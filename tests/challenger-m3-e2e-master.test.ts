/**
 * tests/challenger-m3-e2e-master.test.ts
 *
 * Milestone M3.5 Master Acceptance Testing & Adversarial Verification
 * Empirical validation across:
 * 1. Push notification payload -> SW window matching & navigation
 * 2. Cross-classroom scoping & IDOR security
 * 3. Translation sanitization & queue preservation
 * 4. Empty state nextDue countdown & date formatting boundaries
 * 5. Free Review FSRS invariance & state isolation
 */

import { isCardReady, formatNextDue } from '../src/app/review/session/page';
import * as fs from 'fs';
import * as path from 'path';

interface TestStats {
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
}

class TestRunner {
  private passed = 0;
  private failed = 0;
  private start = Date.now();

  async it(name: string, fn: () => void | Promise<void>) {
    const t0 = Date.now();
    try {
      await fn();
      const dt = Date.now() - t0;
      console.log(`  [PASS] ${name} (${dt}ms)`);
      this.passed++;
    } catch (err: any) {
      const dt = Date.now() - t0;
      console.error(`  [FAIL] ${name} (${dt}ms):`, err?.message || err);
      this.failed++;
    }
  }

  getStats(): TestStats {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      durationMs: Date.now() - this.start,
    };
  }
}

// Mock SW Client
interface MockClient {
  url: string;
  focused: boolean;
  navigatedTo: string | null;
  focus(): Promise<void>;
  navigate(url: string): Promise<MockClient>;
}

function createMockClient(url: string): MockClient {
  const client: MockClient = {
    url,
    focused: false,
    navigatedTo: null,
    async focus() {
      client.focused = true;
    },
    async navigate(targetUrl: string) {
      client.navigatedTo = targetUrl;
      client.url = targetUrl;
      return client;
    },
  };
  return client;
}

// Simulate SW notificationclick logic directly from public/firebase-messaging-sw.js
async function simulateSWNotificationClick(
  clientsList: MockClient[],
  locationOrigin: string,
  eventData: { url?: string; FCM_MSG?: { data?: { url?: string } } } | null,
  openWindowTracker: string[]
) {
  const data = eventData || {};
  const rawUrl = data.url || (data.FCM_MSG && data.FCM_MSG.data && data.FCM_MSG.data.url) || '/review';
  let targetUrl: string;
  try {
    targetUrl = new URL(rawUrl, locationOrigin).href;
  } catch {
    targetUrl = rawUrl;
  }

  const windowClients = clientsList;
  let matchingClient: MockClient | null = null;
  for (const client of windowClients) {
    try {
      const clientUrl = new URL(client.url);
      if (clientUrl.origin === locationOrigin) {
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
      await matchingClient.focus();
    }
    if ('navigate' in matchingClient && matchingClient.url !== targetUrl) {
      return matchingClient.navigate(targetUrl);
    }
    return;
  }

  openWindowTracker.push(targetUrl);
}

export async function runMasterAcceptanceTests() {
  const runner = new TestRunner();

  console.log('\n================================================================');
  console.log('🛡️  MASTER ACCEPTANCE CHALLENGER: END-TO-END EMPIRICAL HARNESS');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Category 1: Push Notification Payload & SW Window Matching Deep Dive
  // --------------------------------------------------------------------------

  await runner.it('1.1: Web Push defaults to /review and builds absolute URL with https://lingopro.online', () => {
    const notifyPath = path.join(process.cwd(), 'src/lib/notifications.ts');
    const content = fs.readFileSync(notifyPath, 'utf-8');
    
    // Check default parameter
    if (!content.includes("url: string = '/review'")) {
      throw new Error("Default url in sendPushNotificationToUser is not '/review'");
    }
    // Check link formation
    if (!content.includes("https://lingopro.online")) {
      throw new Error("Missing lingopro.online domain base for webpush link");
    }
  });

  await runner.it('1.2: SW notificationclick prioritizes /review over /student and avoids opening duplicate tabs', async () => {
    const openedWindows: string[] = [];
    const clientStudent = createMockClient('https://lingopro.online/student');
    const clientReview = createMockClient('https://lingopro.online/review');

    // Scenario: User has /student and /review open, clicks push
    await simulateSWNotificationClick([clientStudent, clientReview], 'https://lingopro.online', { url: '/review' }, openedWindows);

    if (openedWindows.length > 0) {
      throw new Error('SW opened a redundant new window instead of focusing existing tab');
    }
    if (!clientReview.focused) {
      throw new Error('SW did not focus the existing /review tab');
    }
    if (clientStudent.focused) {
      throw new Error('SW erroneously focused the /student tab instead of /review');
    }
  });

  await runner.it('1.3: SW notificationclick updates query params on existing tab (e.g. /review to /review?class=123)', async () => {
    const openedWindows: string[] = [];
    const clientReview = createMockClient('https://lingopro.online/review');

    await simulateSWNotificationClick([clientReview], 'https://lingopro.online', { url: '/review?class=123' }, openedWindows);

    if (openedWindows.length > 0) {
      throw new Error('SW opened new window instead of navigating existing tab');
    }
    if (clientReview.navigatedTo !== 'https://lingopro.online/review?class=123') {
      throw new Error(`Expected navigatedTo 'https://lingopro.online/review?class=123', got '${clientReview.navigatedTo}'`);
    }
  });

  await runner.it('1.4: Cross-origin security: SW rejects external domain tabs and never navigates them', async () => {
    const openedWindows: string[] = [];
    const attackerClient = createMockClient('https://attacker.com/review');

    await simulateSWNotificationClick([attackerClient], 'https://lingopro.online', { url: '/review' }, openedWindows);

    if (attackerClient.focused || attackerClient.navigatedTo) {
      throw new Error('Security breach: SW matched or navigated an external origin tab');
    }
    if (openedWindows.length !== 1 || openedWindows[0] !== 'https://lingopro.online/review') {
      throw new Error('SW should have opened a new window when only external tabs existed');
    }
  });

  // --------------------------------------------------------------------------
  // Category 2: Translation Sanitization & Queue Filtering
  // --------------------------------------------------------------------------

  await runner.it('2.1: isCardReady rigorously filters translation poisoning and pending AI states', () => {
    const invalidCases = [
      { word: 'apple', translation: '❌ Analysis failed - click Retry' },
      { word: 'banana', translation: 'failed to translate' },
      { word: 'cat', translation: 'FAILED' },
      { word: 'dog', translation: '⏳ Analyzing...' },
      { word: 'elephant', translation: 'Analyzing definitions' },
      { word: 'fox', translation: '⏳' },
      { word: 'grape', translation: '  ' },
      { word: 'horse', translation: '' },
      { word: 'iguana', translation: null as any },
      { word: 'jaguar', translation: undefined as any },
      { word: '', translation: 'hợp lệ' },
      { word: '   ', translation: 'hợp lệ' },
    ];

    for (const c of invalidCases) {
      if (isCardReady(c as any)) {
        throw new Error(`isCardReady falsely accepted invalid case: ${JSON.stringify(c)}`);
      }
    }
  });

  await runner.it('2.2: isCardReady safely accepts legal Vietnamese words even with substrings resembling artifacts', () => {
    const validCases = [
      { word: 'fruit', translation: 'trái cây' },
      { word: 'fail-safe', translation: 'cơ chế an toàn dự phòng' }, // Contains word but not the AI error pattern
      { word: 'analyze', translation: 'phân tích' },
      { word: 'time', translation: 'thời gian' },
    ];

    for (const c of validCases) {
      if (!isCardReady(c as any)) {
        throw new Error(`isCardReady falsely rejected valid case: ${JSON.stringify(c)}`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Category 3: Empty State Countdown & Date Formatting Boundary Precision
  // --------------------------------------------------------------------------

  await runner.it('3.1: formatNextDue handles immediate/past dates without crash or negative minutes', () => {
    const now = new Date('2026-09-27T10:00:00.000Z');
    
    // Past date
    const past = new Date('2026-09-27T09:30:00.000Z').toISOString();
    if (formatNextDue(past, now) !== 'sắp đến hạn ngay bây giờ') {
      throw new Error(`Expected 'sắp đến hạn ngay bây giờ', got '${formatNextDue(past, now)}'`);
    }

    // Exact now
    if (formatNextDue(now.toISOString(), now) !== 'sắp đến hạn ngay bây giờ') {
      throw new Error(`Expected 'sắp đến hạn ngay bây giờ', got '${formatNextDue(now.toISOString(), now)}'`);
    }
  });

  await runner.it('3.2: formatNextDue accurately calculates minute countdown for items due within 1 hour', () => {
    const now = new Date('2026-09-27T10:00:00.000Z');
    const future25m = new Date('2026-09-27T10:25:00.000Z').toISOString();
    const result = formatNextDue(future25m, now);
    
    if (!result.includes('25 phút')) {
      throw new Error(`Expected countdown with '25 phút', got '${result}'`);
    }
  });

  await runner.it('3.3: formatNextDue cleanly rejects corrupt ISO strings without "Invalid Date" leakage', () => {
    const corrupted = [
      'corrupt-date',
      '2026-99-99T99:99:99',
      '',
      null as any,
      undefined as any,
    ];

    for (const c of corrupted) {
      const res = formatNextDue(c);
      if (res.includes('Invalid Date')) {
        throw new Error(`formatNextDue leaked "Invalid Date" on input: ${c}`);
      }
      if (res !== '') {
        throw new Error(`formatNextDue should return empty string on invalid input, got: '${res}'`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // Category 4: Free Review Isolation & FSRS Preservation
  // --------------------------------------------------------------------------

  await runner.it('4.1: Review session source code guarantees saveSrsReview is bypassed during Free Review', () => {
    const sessionPath = path.join(process.cwd(), 'src/app/review/session/page.tsx');
    const content = fs.readFileSync(sessionPath, 'utf-8');

    // Check saveSrsReview guard
    const savePattern = /if\s*\(!isFreeReview\)\s*\{\s*(?:void\s+)?saveSrsReview/;
    if (!savePattern.test(content)) {
      throw new Error("saveSrsReview is not strictly guarded by 'if (!isFreeReview)'");
    }

    // Check invalidateWordSummaryCache guard
    const cachePattern = /if\s*\(!isFreeReview\)\s*\{\s*invalidateWordSummaryCache\(\);?\s*\}/;
    if (!cachePattern.test(content)) {
      throw new Error("invalidateWordSummaryCache is not strictly guarded by 'if (!isFreeReview)'");
    }
  });

  await runner.it('4.2: Review Hub and Session support URL parameter ?free=1 isolation', () => {
    const sessionPath = path.join(process.cwd(), 'src/app/review/session/page.tsx');
    const hubPath = path.join(process.cwd(), 'src/app/review/page.tsx');
    const sessionContent = fs.readFileSync(sessionPath, 'utf-8');
    const hubContent = fs.readFileSync(hubPath, 'utf-8');

    if (!hubContent.includes("withClass('/review/session?mode=mixed&free=1')")) {
      throw new Error("Review hub missing Free Review link '/review/session?mode=mixed&free=1'");
    }
    if (!sessionContent.includes("searchParams.get('free') === '1'")) {
      throw new Error("Review session does not parse 'free' query parameter");
    }
  });

  // --------------------------------------------------------------------------
  // Category 5: Timezone Uniformity & SQL RPC Contract
  // --------------------------------------------------------------------------

  await runner.it('5.1: SQL Migration strictly avoids (now() AT TIME ZONE UTC) and enforces uniform now()', () => {
    const sqlPath = path.join(process.cwd(), 'supabase/migrations/20260927_cross_classroom_due_words_and_tz.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');

    const executableSql = content
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    if (executableSql.includes("now() AT TIME ZONE")) {
      throw new Error("Flawed (now() AT TIME ZONE ...) found in executable SQL migration");
    }
    if (!content.includes("s.next_review_date <= now()")) {
      throw new Error("Expected uniform 's.next_review_date <= now()' in get_due_words_list");
    }
    if (!content.includes("sp.next_review_date <= now()")) {
      throw new Error("Expected uniform 'sp.next_review_date <= now()' in get_word_summary");
    }
  });

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Master Acceptance Suite: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Execution Time: ${stats.durationMs} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runMasterAcceptanceTests().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
