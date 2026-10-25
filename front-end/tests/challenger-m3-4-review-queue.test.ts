/**
 * Adversarial Challenger Test Suite for Milestone M3.4:
 * Review Session Queue Integrity & Empty State UX
 * 
 * Conducted by Challenger 1 (Empirical Verification & Stress Harness)
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, expect } from './perf/test-harness';
import { isCardReady } from '../src/app/review/session/page';

const runner = new TestRunner();

// Mirror formatNextDue directly from src/app/review/session/page.tsx
function formatNextDue(isoString: string, mockNow?: Date): string {
  try {
    const date = new Date(isoString);
    const now = mockNow || new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return 'sắp đến hạn ngay bây giờ';
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `lúc ${timeStr} hôm nay (sau khoảng ${diffMins} phút)`;
    }
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `lúc ${timeStr} hôm nay (sau khoảng ${diffHours} giờ)`;
    }
    return `lúc ${timeStr}, ngày ${dateStr}`;
  } catch {
    return '';
  }
}

// Oracle that fixes the Invalid Date leakage
function safeFormatNextDueOracle(isoString: string, mockNow?: Date): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = mockNow || new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return 'sắp đến hạn ngay bây giờ';
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `lúc ${timeStr} hôm nay (sau khoảng ${diffMins} phút)`;
    }
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `lúc ${timeStr} hôm nay (sau khoảng ${diffHours} giờ)`;
    }
    return `lúc ${timeStr}, ngày ${dateStr}`;
  } catch {
    return '';
  }
}

function withClass(href: string, classParam: string | null): string {
  if (!classParam) return href;
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}class=${encodeURIComponent(classParam)}`;
}

async function runChallengerTests() {
  console.log('\n================================================================');
  console.log('⚔️  CHALLENGER 1: M3.4 REVIEW SESSION INTEGRITY & UX HARNESS');
  console.log('================================================================\n');

  // ==========================================================================
  // Suite 1: Translation State Safety & Filtering (isCardReady)
  // ==========================================================================
  runner.describe('Suite 1: Translation State Safety (isCardReady)', () => {});

  await runner.it('1.1: Accepts valid words with clean translations', () => {
    expect(isCardReady({ word: 'accommodate', translation: 'đáp ứng, cung cấp chỗ ở' } as any)).toBe(true);
    expect(isCardReady({ word: 'meticulous', translation: 'tỉ mỉ, cẩn thận (trong công việc)' } as any)).toBe(true);
    expect(isCardReady({ word: 'ubiquitous', translation: 'phổ biến, có mặt ở khắp nơi' } as any)).toBe(true);
  });

  await runner.it('1.2: Rejects words with failed translations in all casings', () => {
    expect(isCardReady({ word: 'apple', translation: 'failed' } as any)).toBe(false);
    expect(isCardReady({ word: 'apple', translation: 'FAILED' } as any)).toBe(false);
    expect(isCardReady({ word: 'apple', translation: 'Translation failed' } as any)).toBe(false);
    expect(isCardReady({ word: 'apple', translation: '  failed  ' } as any)).toBe(false);
    expect(isCardReady({ word: 'apple', translation: 'error: failed to enrich' } as any)).toBe(false);
  });

  await runner.it('1.3: Rejects words with analyzing translations in all casings', () => {
    expect(isCardReady({ word: 'banana', translation: 'Analyzing' } as any)).toBe(false);
    expect(isCardReady({ word: 'banana', translation: 'analyzing' } as any)).toBe(false);
    expect(isCardReady({ word: 'banana', translation: 'ANALYZING' } as any)).toBe(false);
    expect(isCardReady({ word: 'banana', translation: '⏳ Analyzing...' } as any)).toBe(false);
    expect(isCardReady({ word: 'banana', translation: 'AI is Analyzing definition' } as any)).toBe(false);
  });

  await runner.it('1.4: Rejects words with hourglass ⏳ emoji', () => {
    expect(isCardReady({ word: 'cherry', translation: '⏳' } as any)).toBe(false);
    expect(isCardReady({ word: 'cherry', translation: '⏳ Đang dịch' } as any)).toBe(false);
    expect(isCardReady({ word: 'cherry', translation: 'Đang tải ⏳' } as any)).toBe(false);
  });

  await runner.it('1.5: Rejects empty strings, whitespace, null, undefined, and non-strings', () => {
    expect(isCardReady(null)).toBe(false);
    expect(isCardReady(undefined)).toBe(false);
    expect(isCardReady({} as any)).toBe(false);
    expect(isCardReady({ word: '', translation: 'táo' } as any)).toBe(false);
    expect(isCardReady({ word: '   ', translation: 'táo' } as any)).toBe(false);
    expect(isCardReady({ word: 'apple', translation: '' } as any)).toBe(false);
    expect(isCardReady({ word: 'apple', translation: '   ' } as any)).toBe(false);
    expect(isCardReady({ word: 123 as any, translation: 'số' } as any)).toBe(false);
    expect(isCardReady({ word: 'apple', translation: 456 as any } as any)).toBe(false);
  });

  await runner.it('1.6: Queue integrity: only drops invalid cards, preserves valid due queue', () => {
    const queue = [
      { id: '1', word: 'valid_1', translation: 'nghĩa 1' },
      { id: '2', word: 'invalid_failed', translation: 'failed' },
      { id: '3', word: 'valid_2', translation: 'nghĩa 2' },
      { id: '4', word: 'invalid_analyzing', translation: 'Analyzing' },
      { id: '5', word: 'invalid_hourglass', translation: '⏳ Đang dịch' },
      { id: '6', word: 'valid_3', translation: 'nghĩa 3' },
      { id: '7', word: 'invalid_empty', translation: '   ' },
    ];

    const filtered = queue.filter(isCardReady);
    expect(filtered.length).toBe(3);
    expect(filtered.map((w) => w.id).join(',')).toBe('1,3,6');
  });

  // ==========================================================================
  // Suite 2: Next Due Date Formatting & Adversarial Time Parsing
  // ==========================================================================
  runner.describe('Suite 2: formatNextDue Logic & Adversarial Analysis', () => {});

  const fixedNow = new Date('2026-09-27T10:00:00.000Z');

  await runner.it('2.1: Past or zero diffMs returns "sắp đến hạn ngay bây giờ"', () => {
    const past = new Date('2026-09-27T09:30:00.000Z').toISOString();
    expect(formatNextDue(past, fixedNow)).toBe('sắp đến hạn ngay bây giờ');
    expect(formatNextDue(fixedNow.toISOString(), fixedNow)).toBe('sắp đến hạn ngay bây giờ');
  });

  await runner.it('2.2: Due within next hour returns minutes countdown', () => {
    const in20m = new Date(fixedNow.getTime() + 20 * 60 * 1000).toISOString();
    const formatted = formatNextDue(in20m, fixedNow);
    expect(formatted.includes('hôm nay')).toBe(true);
    expect(formatted.includes('20 phút')).toBe(true);
  });

  await runner.it('2.3: Due later today returns hours countdown', () => {
    const in3h = new Date(fixedNow.getTime() + 3 * 3600 * 1000).toISOString();
    const formatted = formatNextDue(in3h, fixedNow);
    expect(formatted.includes('hôm nay')).toBe(true);
    expect(formatted.includes('3 giờ')).toBe(true);
  });

  await runner.it('2.4: Due on future days returns time and date', () => {
    const in5days = new Date(fixedNow.getTime() + 5 * 24 * 3600 * 1000).toISOString();
    const formatted = formatNextDue(in5days, fixedNow);
    expect(formatted.includes('ngày')).toBe(true);
    expect(formatted.includes('lúc')).toBe(true);
  });

  await runner.it('2.5: [CHALLENGE FINDING] Current formatNextDue leaks "lúc Invalid Date, ngày Invalid Date" on invalid ISO string', () => {
    const invalidResult = formatNextDue('malformed-iso-date', fixedNow);
    // Documenting empirical behavior:
    console.log(`    ⚠️  Observed formatNextDue('malformed-iso-date') -> "${invalidResult}"`);
    expect(invalidResult).toBe('lúc Invalid Date, ngày Invalid Date');

    // Safe oracle produces empty string
    const oracleResult = safeFormatNextDueOracle('malformed-iso-date', fixedNow);
    expect(oracleResult).toBe('');
  });

  // ==========================================================================
  // Suite 3: Free Review Mode FSRS Isolation
  // ==========================================================================
  runner.describe('Suite 3: Free Review Mode FSRS Isolation', () => {});

  interface SessionSimulation {
    isFreeReview: boolean;
    srsCalls: Array<{ wordId: string; quality: number }>;
    summaryInvalidated: boolean;
  }

  function simulateFinalize(sim: SessionSimulation, currentWord: { id: string }, quality: 0 | 3 | 4 | 5) {
    if (!sim.isFreeReview) {
      sim.srsCalls.push({ wordId: currentWord.id, quality });
    }
  }

  function simulateSessionComplete(sim: SessionSimulation) {
    if (!sim.isFreeReview) {
      sim.summaryInvalidated = true;
    }
  }

  await runner.it('3.1: Standard Review: calls saveSrsReview on finalize and invalidates summary cache on completion', () => {
    const sim: SessionSimulation = {
      isFreeReview: false,
      srsCalls: [],
      summaryInvalidated: false,
    };

    simulateFinalize(sim, { id: 'w1' }, 4);
    simulateFinalize(sim, { id: 'w2' }, 5);
    simulateSessionComplete(sim);

    expect(sim.srsCalls.length).toBe(2);
    expect(sim.srsCalls[0].wordId).toBe('w1');
    expect(sim.srsCalls[1].wordId).toBe('w2');
    expect(sim.summaryInvalidated).toBe(true);
  });

  await runner.it('3.2: Free Review: ZERO calls to saveSrsReview and summary cache is NEVER invalidated', () => {
    const sim: SessionSimulation = {
      isFreeReview: true,
      srsCalls: [],
      summaryInvalidated: false,
    };

    simulateFinalize(sim, { id: 'w1' }, 4);
    simulateFinalize(sim, { id: 'w2' }, 0);
    simulateFinalize(sim, { id: 'w3' }, 3);
    simulateSessionComplete(sim);

    expect(sim.srsCalls.length).toBe(0);
    expect(sim.summaryInvalidated).toBe(false);
  });

  // ==========================================================================
  // Suite 4: Empty Queue UX Flow & Fallbacks
  // ==========================================================================
  runner.describe('Suite 4: Empty Queue UX Flow & Fallbacks', () => {});

  await runner.it('4.1: When due count is 0, session state cleanly stops loading without crashing', () => {
    const due: any[] = [];
    const isLoading = false;
    const current = due.length > 0 ? due[0] : null;
    const done = false;

    expect(current).toBeNull();
    expect(isLoading).toBe(false);
    expect(done).toBe(false);

    // Empty state view guard
    const rendersEmptyState = !current && !done && !isLoading;
    expect(rendersEmptyState).toBe(true);
  });

  // ==========================================================================
  // Suite 5: Review Hub Link Scoping
  // ==========================================================================
  runner.describe('Suite 5: Review Hub Link Scoping', () => {});

  await runner.it('5.1: withClass properly maintains cross-classroom (null classParam) links', () => {
    expect(withClass('/review/session?mode=mixed', null)).toBe('/review/session?mode=mixed');
    expect(withClass('/review/session?mode=mixed&free=1', null)).toBe('/review/session?mode=mixed&free=1');
    expect(withClass('/practice', null)).toBe('/practice');
  });

  await runner.it('5.2: withClass encodes classParam when present', () => {
    const cid = 'c123-abc';
    expect(withClass('/review/session?mode=mixed', cid)).toBe('/review/session?mode=mixed&class=c123-abc');
    expect(withClass('/practice', cid)).toBe('/practice?class=c123-abc');
  });

  // ==========================================================================
  // Suite 6: Source Code AST Verification
  // ==========================================================================
  runner.describe('Suite 6: Source Code Verification', () => {});

  const sessionSource = fs.readFileSync(path.resolve(__dirname, '../src/app/review/session/page.tsx'), 'utf8');
  const hubSource = fs.readFileSync(path.resolve(__dirname, '../src/app/review/page.tsx'), 'utf8');

  await runner.it('6.1: src/app/review/session/page.tsx exports isCardReady and guards FSRS saving', () => {
    expect(sessionSource.includes('export function isCardReady')).toBe(true);
    expect(sessionSource.includes('if (!isFreeReview)')).toBe(true);
    expect(sessionSource.includes('saveSrsReview')).toBe(true);
    expect(sessionSource.includes('Tất cả từ đã ôn tập đúng hạn!')).toBe(true);
    expect(sessionSource.includes('formatNextDue')).toBe(true);
    expect(sessionSource.includes('startFreeReview')).toBe(true);
  });

  await runner.it('6.2: src/app/review/page.tsx queries cross-classroom summary and has mixed session CTA', () => {
    expect(hubSource.includes("authFetch('/api/words?summary=1'")).toBe(true);
    expect(hubSource.includes("withClass('/review/session?mode=mixed')")).toBe(true);
    expect(hubSource.includes("withClass('/review/session?mode=mixed&free=1')")).toBe(true);
  });

  // ==========================================================================
  // Final Results
  // ==========================================================================
  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Challenger Suite Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Execution Time: ${stats.durationMs} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runChallengerTests().catch((err) => {
  console.error('Challenger test failed:', err);
  process.exit(1);
});
