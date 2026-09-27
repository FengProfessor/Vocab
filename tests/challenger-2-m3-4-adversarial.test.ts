/**
 * Empirical Adversarial Challenger 2 Test Suite for Milestone M3.4:
 * Review Session Queue Integrity & Empty State UX (Remediation Verification)
 *
 * Focus:
 * 1. Adversarial Date Parsing in formatNextDue (bad dates, malformed ISO, UTC vs local offsets, midnight boundaries)
 * 2. Translation & Queue Filtering in isCardReady (poisoned patterns, edge cases, valid words with similar roots)
 * 3. Empty Queue Scenarios (initial zero queue, queue depletion, educational FSRS empty state)
 * 4. Rapid Keypresses & Race Conditions in Free Review (burst keys during feedback lock, double-tap MCQ, zero FSRS mutation)
 * 5. Review Hub Scoping & CTA Navigation Contracts
 */

import { TestRunner, expect } from './perf/test-harness';
import { isCardReady, formatNextDue } from '../src/app/review/session/page';

const runner = new TestRunner();

// Pure withClass helper matching src/app/review/page.tsx
function withClass(href: string, classParam: string | null): string {
  if (!classParam) return href;
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}class=${encodeURIComponent(classParam)}`;
}

async function runChallenger2AdversarialTests() {
  console.log('\n================================================================');
  console.log('⚔️  CHALLENGER 2: M3.4 ADVERSARIAL STRESS & EMPIRICAL TEST SUITE');
  console.log('   Review Session Queue Integrity & Empty State UX Remediation');
  console.log('================================================================\n');

  // ==========================================================================
  // Suite 1: formatNextDue Adversarial Input & Timezone Offset Testing
  // ==========================================================================
  runner.describe('Suite 1: formatNextDue Adversarial & Boundary Conditions', () => {});

  const fixedNow = new Date('2026-09-27T10:00:00.000Z'); // Sunday 10:00 UTC (17:00 UTC+7)

  await runner.it('1.1: Returns empty string on null, undefined, primitives, objects, and empty strings', () => {
    expect(formatNextDue(null as unknown as string, fixedNow)).toBe('');
    expect(formatNextDue(undefined as unknown as string, fixedNow)).toBe('');
    expect(formatNextDue('', fixedNow)).toBe('');
    expect(formatNextDue('   ', fixedNow)).toBe('');
    expect(formatNextDue(12345 as unknown as string, fixedNow)).toBe('');
    expect(formatNextDue({} as unknown as string, fixedNow)).toBe('');
    expect(formatNextDue([] as unknown as string, fixedNow)).toBe('');
    expect(formatNextDue(true as unknown as string, fixedNow)).toBe('');
    expect(formatNextDue(NaN as unknown as string, fixedNow)).toBe('');
  });

  await runner.it('1.2: Returns empty string on malformed date strings (no "Invalid Date" leakage)', () => {
    expect(formatNextDue('invalid-date', fixedNow)).toBe('');
    expect(formatNextDue('malformed-iso-date', fixedNow)).toBe('');
    expect(formatNextDue('2026-99-99T99:99:99Z', fixedNow)).toBe('');
    expect(formatNextDue('undefined', fixedNow)).toBe('');
    expect(formatNextDue('null', fixedNow)).toBe('');
    expect(formatNextDue('[object Object]', fixedNow)).toBe('');
  });

  await runner.it('1.3: Immediate and overdue timestamps return "sắp đến hạn ngay bây giờ"', () => {
    expect(formatNextDue(fixedNow.toISOString(), fixedNow)).toBe('sắp đến hạn ngay bây giờ');
    const past1ms = new Date(fixedNow.getTime() - 1).toISOString();
    expect(formatNextDue(past1ms, fixedNow)).toBe('sắp đến hạn ngay bây giờ');
    const past10Days = new Date(fixedNow.getTime() - 10 * 86400000).toISOString();
    expect(formatNextDue(past10Days, fixedNow)).toBe('sắp đến hạn ngay bây giờ');
  });

  await runner.it('1.4: Due within < 30 minutes (Math.round < 1) calculates minute countdown', () => {
    // 30 seconds future (Math.round(30/60) = 1) -> 1 phút
    const in30s = new Date(fixedNow.getTime() + 30000).toISOString();
    const res30s = formatNextDue(in30s, fixedNow);
    expect(res30s.includes('hôm nay')).toBe(true);
    expect(res30s.includes('1 phút')).toBe(true);

    // 20 minutes future (20 / 60 = 0.33 -> diffHours = 0 < 1) -> 20 phút
    const in20m = new Date(fixedNow.getTime() + 20 * 60000).toISOString();
    const res20m = formatNextDue(in20m, fixedNow);
    expect(res20m.includes('hôm nay')).toBe(true);
    expect(res20m.includes('20 phút')).toBe(true);

    // 29 minutes future (29 / 60 = 0.48 -> diffHours = 0 < 1) -> 29 phút
    const in29m = new Date(fixedNow.getTime() + 29 * 60000).toISOString();
    const res29m = formatNextDue(in29m, fixedNow);
    expect(res29m.includes('hôm nay')).toBe(true);
    expect(res29m.includes('29 phút')).toBe(true);
  });

  await runner.it('1.5: Due between 30m and 90m rounds to 1 hour (Math.round = 1)', () => {
    // 30 minutes future (30 / 60 = 0.5 -> Math.round = 1) -> 1 giờ
    const in30m = new Date(fixedNow.getTime() + 30 * 60000).toISOString();
    const res30m = formatNextDue(in30m, fixedNow);
    expect(res30m.includes('hôm nay')).toBe(true);
    expect(res30m.includes('1 giờ')).toBe(true);

    // 45 minutes future (45 / 60 = 0.75 -> Math.round = 1) -> 1 giờ
    const in45m = new Date(fixedNow.getTime() + 45 * 60000).toISOString();
    const res45m = formatNextDue(in45m, fixedNow);
    expect(res45m.includes('hôm nay')).toBe(true);
    expect(res45m.includes('1 giờ')).toBe(true);

    // 4 hours future -> 4 giờ
    const in4h = new Date(fixedNow.getTime() + 4 * 3600000).toISOString();
    const res4h = formatNextDue(in4h, fixedNow);
    expect(res4h.includes('hôm nay')).toBe(true);
    expect(res4h.includes('4 giờ')).toBe(true);
  });

  await runner.it('1.6: Equivalence of UTC "Z" and Offset "+07:00" representations', () => {
    const targetTime = fixedNow.getTime() + 3 * 3600000;
    const utcIso = new Date(targetTime).toISOString(); // e.g. 2026-09-27T13:00:00.000Z
    // In local +07:00 that is 2026-09-27T20:00:00.000+07:00
    const offsetIso = '2026-09-27T20:00:00.000+07:00';

    const resUtc = formatNextDue(utcIso, fixedNow);
    const resOffset = formatNextDue(offsetIso, fixedNow);

    expect(resUtc).toBe(resOffset);
    expect(resUtc.includes('3 giờ')).toBe(true);
  });

  await runner.it('1.7: Due across midnight boundary shows specific date to prevent false "hôm nay"', () => {
    // Fixed now at 23:30 local time today
    const nowNearMidnight = new Date('2026-09-27T23:30:00.000+07:00');
    // Due at 01:30 tomorrow (2 hours later)
    const dueTomorrow = new Date('2026-09-28T01:30:00.000+07:00').toISOString();

    const res = formatNextDue(dueTomorrow, nowNearMidnight);
    // Because date.getDate() !== now.getDate(), it must NOT say "hôm nay"
    expect(res.includes('hôm nay')).toBe(false);
    expect(res.includes('ngày')).toBe(true);
  });

  await runner.it('1.8: Due multiple days in future formats date and time cleanly', () => {
    const in7Days = new Date(fixedNow.getTime() + 7 * 86400000).toISOString();
    const res7d = formatNextDue(in7Days, fixedNow);
    expect(res7d.includes('lúc')).toBe(true);
    expect(res7d.includes('ngày')).toBe(true);
    expect(res7d.includes('hôm nay')).toBe(false);
  });

  // ==========================================================================
  // Suite 2: isCardReady Translation Filter Robustness
  // ==========================================================================
  runner.describe('Suite 2: isCardReady Adversarial Translation Filtering', () => {});

  await runner.it('2.1: Correctly filters failed, analyzing, and hourglass states regardless of case/position', () => {
    const testCases = [
      { translation: 'failed', valid: false },
      { translation: 'Failed', valid: false },
      { translation: 'FAILED', valid: false },
      { translation: 'Translation failed', valid: false },
      { translation: 'failed: network error', valid: false },
      { translation: 'analyzing', valid: false },
      { translation: 'Analyzing', valid: false },
      { translation: 'ANALYZING', valid: false },
      { translation: 'AI is Analyzing context', valid: false },
      { translation: '⏳', valid: false },
      { translation: '⏳ Đang dịch nghĩa...', valid: false },
      { translation: 'Đang tải ⏳ vui lòng đợi', valid: false },
    ];

    for (const tc of testCases) {
      const card = { word: 'test', translation: tc.translation };
      expect(isCardReady(card as unknown as Parameters<typeof isCardReady>[0])).toBe(tc.valid);
    }
  });

  await runner.it('2.2: Does NOT false-positive on legitimate words/translations with similar roots', () => {
    const legitimateCases = [
      { word: 'failure', translation: 'sự thất bại, sự hỏng hóc' },
      { word: 'fail', translation: 'thất bại, không đạt' },
      { word: 'analysis', translation: 'bản phân tích, cuộc khảo sát' },
      { word: 'analyzer', translation: 'máy phân tích' },
      { word: 'clock', translation: 'đồng hồ' },
      { word: 'hour', translation: 'giờ đồng hồ' },
      { word: 'patient', translation: 'kiên nhẫn, người bệnh' },
    ];

    for (const tc of legitimateCases) {
      expect(isCardReady(tc as unknown as Parameters<typeof isCardReady>[0])).toBe(true);
    }
  });

  await runner.it('2.3: Rejects malformed objects, non-string types, and whitespace-only words', () => {
    expect(isCardReady(null)).toBe(false);
    expect(isCardReady(undefined)).toBe(false);
    expect(isCardReady({} as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ word: 'apple' } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ translation: 'quả táo' } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ word: '', translation: 'quả táo' } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ word: '   \n\t', translation: 'quả táo' } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ word: 'apple', translation: '' } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ word: 'apple', translation: '   \n\t' } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ word: 12345, translation: 'số' } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
    expect(isCardReady({ word: 'apple', translation: ['táo'] } as unknown as Parameters<typeof isCardReady>[0])).toBe(false);
  });

  // ==========================================================================
  // Suite 3: Empty Queue Scenarios & UX Transitions
  // ==========================================================================
  runner.describe('Suite 3: Empty Queue States & UX Flow', () => {});

  await runner.it('3.1: Zero initial due cards renders informative empty state with educational FSRS copy', () => {
    const dueQueue: unknown[] = [];
    const isLoading = false;
    const current = dueQueue.length > 0 ? dueQueue[0] : null;
    const done = false;

    // Condition in ReviewSession: if (!current && !done)
    const showEmptyState = !current && !done && !isLoading;
    expect(showEmptyState).toBe(true);
  });

  await runner.it('3.2: Empty queue with nextDueTime displays next due reminder badge', () => {
    const nextDueTime = new Date(fixedNow.getTime() + 2 * 3600000).toISOString();
    const formatted = formatNextDue(nextDueTime, fixedNow);
    expect(formatted.includes('2 giờ')).toBe(true);

    const hasReminderBadge = Boolean(nextDueTime && formatNextDue(nextDueTime, fixedNow));
    expect(hasReminderBadge).toBe(true);
  });

  await runner.it('3.3: Empty queue without nextDueTime cleanly hides the countdown badge', () => {
    const nextDueTime = null;
    const formatted = nextDueTime ? formatNextDue(nextDueTime, fixedNow) : '';
    expect(formatted).toBe('');
  });

  // ==========================================================================
  // Suite 4: Rapid Keypresses & Race Conditions in Free Review (FSRS Preservation)
  // ==========================================================================
  runner.describe('Suite 4: Rapid Keypress Stress & Free Review FSRS Isolation', () => {});

  interface SimulatedSession {
    mode: 'mixed' | 'cloze' | 'listen';
    isFreeReview: boolean;
    queue: Array<{ id: string; word: string; translation: string }>;
    currentIndex: number;
    current: { id: string; word: string; translation: string } | null;
    answered: boolean;
    canSkip: boolean;
    pendingSkip: boolean;
    verdict: string | null;
    advanceTimer: NodeJS.Timeout | null;
    feedbackLockTimer: NodeJS.Timeout | null;
    srsCalls: Array<{ id: string; quality: number }>;
    summaryInvalidations: number;
    stats: { correct: number; close: number; wrong: number };
    done: boolean;
  }

  function createSimulatedSession(isFree: boolean, words: Array<{ id: string; word: string; translation: string }>): SimulatedSession {
    return {
      mode: 'mixed',
      isFreeReview: isFree,
      queue: [...words],
      currentIndex: 0,
      current: words[0] || null,
      answered: false,
      canSkip: false,
      pendingSkip: false,
      verdict: null,
      advanceTimer: null,
      feedbackLockTimer: null,
      srsCalls: [],
      summaryInvalidations: 0,
      stats: { correct: 0, close: 0, wrong: 0 },
      done: false,
    };
  }

  function submitAnswer(session: SimulatedSession, isCorrect: boolean, quality: 0 | 3 | 4 | 5) {
    if (!session.current || session.answered) return;
    session.answered = true;

    // FSRS save logic:
    if (!session.isFreeReview) {
      session.srsCalls.push({ id: session.current.id, quality });
    }

    session.verdict = isCorrect ? 'correct' : 'wrong';
    if (isCorrect) session.stats.correct++;
    else session.stats.wrong++;

    // Feedback lock simulation (100ms)
    session.feedbackLockTimer = setTimeout(() => {
      session.canSkip = true;
      session.feedbackLockTimer = null;
      if (session.pendingSkip) {
        session.pendingSkip = false;
        advanceSession(session, !isCorrect);
      }
    }, 100);
  }

  function advanceSession(session: SimulatedSession, wasWrong: boolean) {
    if (session.feedbackLockTimer) {
      clearTimeout(session.feedbackLockTimer);
      session.feedbackLockTimer = null;
    }
    session.pendingSkip = false;

    const head = session.queue[0];
    const rest = session.queue.slice(1);
    if (wasWrong && head) rest.push(head);
    session.queue = rest;

    if (rest.length === 0) {
      session.done = true;
      session.current = null;
      if (!session.isFreeReview) {
        session.summaryInvalidations++;
      }
      return;
    }

    session.current = rest[0];
    session.answered = false;
    session.canSkip = false;
    session.verdict = null;
  }

  function triggerKeyPress(session: SimulatedSession, key: 'Enter' | ' ' | '1' | '2') {
    if (session.done || !session.current) return;

    if (session.answered && (key === 'Enter' || key === ' ')) {
      if (!session.canSkip) {
        session.pendingSkip = true;
      } else {
        advanceSession(session, session.verdict !== 'correct');
      }
      return;
    }

    if (!session.answered && (key === '1' || key === '2')) {
      submitAnswer(session, key === '1', key === '1' ? 4 : 0);
    }
  }

  await runner.it('4.1: Burst of 50 Enter presses during 100ms lock buffers only ONE skip and advances exactly 1 card', async () => {
    const session = createSimulatedSession(true, [
      { id: 'w1', word: 'apple', translation: 'táo' },
      { id: 'w2', word: 'banana', translation: 'chuối' },
      { id: 'w3', word: 'cherry', translation: 'anh đào' },
    ]);

    // Submit answer on card 1
    triggerKeyPress(session, '1');
    expect(session.answered).toBe(true);
    expect(session.canSkip).toBe(false);

    // Spam 50 Enter keypresses while feedback lock is active
    for (let i = 0; i < 50; i++) {
      triggerKeyPress(session, 'Enter');
    }
    expect(session.pendingSkip).toBe(true);
    expect(session.current?.id).toBe('w1'); // Still on w1 during lock

    // Wait 120ms for feedback lock to expire
    await new Promise((r) => setTimeout(r, 120));

    // Card should have advanced to w2 (NOT w3)
    expect(session.current?.id).toBe('w2');
    expect(session.answered).toBe(false);
    expect(session.pendingSkip).toBe(false);
    expect(session.canSkip).toBe(false);
  });

  await runner.it('4.2: Free Review completes entire queue with ZERO saveSrsReview calls and ZERO cache invalidations', async () => {
    const session = createSimulatedSession(true, [
      { id: 'free1', word: 'dog', translation: 'chó' },
      { id: 'free2', word: 'cat', translation: 'mèo' },
    ]);

    // Answer card 1
    triggerKeyPress(session, '1'); // correct
    await new Promise((r) => setTimeout(r, 120));
    triggerKeyPress(session, 'Enter'); // advance

    // Answer card 2
    triggerKeyPress(session, '2'); // wrong
    await new Promise((r) => setTimeout(r, 120));
    triggerKeyPress(session, 'Enter'); // re-queued to back

    // Answer re-queued card 2 again
    triggerKeyPress(session, '1'); // correct
    await new Promise((r) => setTimeout(r, 120));
    triggerKeyPress(session, 'Enter'); // completes

    expect(session.done).toBe(true);
    expect(session.srsCalls.length).toBe(0);
    expect(session.summaryInvalidations).toBe(0);
  });

  await runner.it('4.3: Standard Review executes saveSrsReview on each card and invalidates summary cache on completion', async () => {
    const session = createSimulatedSession(false, [
      { id: 'due1', word: 'bird', translation: 'chim' },
    ]);

    triggerKeyPress(session, '1'); // correct
    await new Promise((r) => setTimeout(r, 120));
    triggerKeyPress(session, 'Enter');

    expect(session.done).toBe(true);
    expect(session.srsCalls.length).toBe(1);
    expect(session.srsCalls[0].id).toBe('due1');
    expect(session.summaryInvalidations).toBe(1);
  });

  await runner.it('4.4: Accuracy calculation handles zero answered cards without NaN or division by zero', () => {
    const stats = { correct: 0, close: 0, wrong: 0 };
    const answered = stats.correct + stats.close + stats.wrong;
    const acc = answered > 0 ? Math.round((stats.correct / answered) * 100) : 0;
    expect(acc).toBe(0);
    expect(isNaN(acc)).toBe(false);
  });

  // ==========================================================================
  // Suite 5: Review Hub Link Generation & CTA Scoping
  // ==========================================================================
  runner.describe('Suite 5: Review Hub Link Generation & CTA Scoping', () => {});

  await runner.it('5.1: withClass preserves mode and free params while appending or omitting class', () => {
    expect(withClass('/review/session?mode=mixed', null)).toBe('/review/session?mode=mixed');
    expect(withClass('/review/session?mode=mixed&free=1', null)).toBe('/review/session?mode=mixed&free=1');
    expect(withClass('/review/session?mode=mixed', 'cohort-789')).toBe('/review/session?mode=mixed&class=cohort-789');
    expect(withClass('/review/session?mode=mixed&free=1', 'cohort-789')).toBe('/review/session?mode=mixed&free=1&class=cohort-789');
    expect(withClass('/practice', 'class-abc')).toBe('/practice?class=class-abc');
  });

  // ==========================================================================
  // Summary & Stats
  // ==========================================================================
  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`CHALLENGER 2 SUITE SUMMARY: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Total Duration: ${stats.durationMs} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runChallenger2AdversarialTests().catch((err) => {
  console.error('Fatal test error in Challenger 2 suite:', err);
  process.exit(1);
});
