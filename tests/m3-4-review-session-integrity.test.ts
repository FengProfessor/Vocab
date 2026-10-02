/**
 * Adversarial Test Suite for Milestone M3.4:
 * Review Session Queue Integrity & Empty State UX
 * 
 * Verifies:
 * 1. isCardReady filter logic & edge cases
 * 2. formatNextDue date formatting & fault tolerance
 * 3. Free Review isolation (FSRS preservation)
 * 4. Review Hub cross-classroom scoping & link generation
 * 5. Integrity & absence of hardcoded mocks/bypasses
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, expect } from './perf/test-harness';
import { isCardReady, formatNextDue } from '../src/app/review/session/page';

const runner = new TestRunner();

// Pure withClass helper matching src/app/review/page.tsx
function withClass(href: string, classParam: string | null): string {
  if (!classParam) return href;
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}class=${encodeURIComponent(classParam)}`;
}

async function runM34Tests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING M3.4 REVIEW SESSION INTEGRITY & UX TEST SUITE');
  console.log('================================================================\n');

  // ==========================================================================
  // Suite 1: isCardReady Translation Filter Resilience
  // ==========================================================================
  runner.describe('Suite 1: isCardReady Filter Resilience', () => {});

  await runner.it('1.1: Accepts valid words with clean translations', () => {
    expect(isCardReady({ id: '1', word: 'apple', translation: 'quả táo' })).toBe(true);
    expect(isCardReady({ id: '2', word: 'accelerate', translation: 'tăng tốc, thúc đẩy' })).toBe(true);
    expect(isCardReady({ id: '3', word: 'failure', translation: 'sự thất bại' })).toBe(true);
    expect(isCardReady({ id: '4', word: 'analysis', translation: 'sự phân tích' })).toBe(true);
  });

  await runner.it('1.2: Rejects null, undefined, empty, or whitespace-only inputs', () => {
    expect(isCardReady(null)).toBe(false);
    expect(isCardReady(undefined)).toBe(false);
    expect(isCardReady({ id: '1', word: '', translation: 'nghĩa' })).toBe(false);
    expect(isCardReady({ id: '2', word: '   ', translation: 'nghĩa' })).toBe(false);
    expect(isCardReady({ id: '3', word: 'hello', translation: '' })).toBe(false);
    expect(isCardReady({ id: '4', word: 'hello', translation: '   ' })).toBe(false);
    expect(isCardReady({ id: '5', word: 'hello', translation: null as unknown as string })).toBe(false);
    expect(isCardReady({ id: '6', word: 'hello', translation: undefined as unknown as string })).toBe(false);
  });

  await runner.it('1.3: Rejects "failed" in all casing and variants', () => {
    expect(isCardReady({ id: '1', word: 'test', translation: 'failed' })).toBe(false);
    expect(isCardReady({ id: '2', word: 'test', translation: 'FAILED' })).toBe(false);
    expect(isCardReady({ id: '3', word: 'test', translation: 'Failed: quota exceeded' })).toBe(false);
    expect(isCardReady({ id: '4', word: 'test', translation: 'Translation failed due to rate limit' })).toBe(false);
  });

  await runner.it('1.4: Rejects "analyzing" in all casing and variants', () => {
    expect(isCardReady({ id: '1', word: 'test', translation: 'analyzing' })).toBe(false);
    expect(isCardReady({ id: '2', word: 'test', translation: 'Analyzing' })).toBe(false);
    expect(isCardReady({ id: '3', word: 'test', translation: 'ANALYZING' })).toBe(false);
    expect(isCardReady({ id: '4', word: 'test', translation: 'Analyzing context...' })).toBe(false);
  });

  await runner.it('1.5: Rejects emoji ⏳ in translation strings', () => {
    expect(isCardReady({ id: '1', word: 'test', translation: '⏳' })).toBe(false);
    expect(isCardReady({ id: '2', word: 'test', translation: '⏳ Đang dịch thuật' })).toBe(false);
    expect(isCardReady({ id: '3', word: 'test', translation: 'Pending ⏳...' })).toBe(false);
  });

  await runner.it('1.6: Queue preservation: only drops invalid cards, keeps valid due cards', () => {
    const queue = [
      { id: '1', word: 'cat', translation: 'con mèo', isDue: true },
      { id: '2', word: 'dog', translation: 'FAILED', isDue: true },
      { id: '3', word: 'bird', translation: '⏳ Đang dịch', isDue: true },
      { id: '4', word: 'fish', translation: 'Analyzing...', isDue: true },
      { id: '5', word: 'rabbit', translation: 'con thỏ', isDue: true },
      { id: '6', word: 'empty', translation: '   ', isDue: true },
    ];

    const validDue = queue.filter(isCardReady);
    expect(validDue.length).toBe(2);
    expect(validDue.map((w) => w.word)).toEqual(['cat', 'rabbit']);
  });

  // ==========================================================================
  // Suite 2: formatNextDue Formatting & Fault Tolerance
  // ==========================================================================
  runner.describe('Suite 2: formatNextDue Logic & Resilience', () => {});

  const now = new Date('2026-09-27T10:00:00.000Z');

  await runner.it('2.1: Handles past or immediate due dates gracefully', () => {
    const pastIso = new Date('2026-09-27T09:59:59.000Z').toISOString();
    expect(formatNextDue(pastIso, now)).toBe('sắp đến hạn ngay bây giờ');
    const exactIso = now.toISOString();
    expect(formatNextDue(exactIso, now)).toBe('sắp đến hạn ngay bây giờ');
  });

  await runner.it('2.2: Formats due dates within the next hour (minutes countdown)', () => {
    const next15m = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const result = formatNextDue(next15m, now);
    expect(result.includes('sau khoảng 15 phút')).toBe(true);
    expect(result.includes('hôm nay')).toBe(true);
  });

  await runner.it('2.3: Formats due dates later today (hours countdown)', () => {
    const next4h = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const result = formatNextDue(next4h, now);
    expect(result.includes('sau khoảng 4 giờ')).toBe(true);
    expect(result.includes('hôm nay')).toBe(true);
  });

  await runner.it('2.4: Formats due dates on future days with date string', () => {
    const nextWeek = new Date('2026-10-04T14:30:00.000Z').toISOString();
    const result = formatNextDue(nextWeek, now);
    expect(result.includes('ngày')).toBe(true);
  });

  await runner.it('2.5: Fault tolerance for malformed ISO strings returns empty string', () => {
    expect(formatNextDue('not-a-date', now)).toBe('');
    expect(formatNextDue('', now)).toBe('');
    expect(formatNextDue(null as unknown as string, now)).toBe('');
  });

  // ==========================================================================
  // Suite 3: Free Review FSRS Isolation Verification
  // ==========================================================================
  runner.describe('Suite 3: Free Review FSRS Isolation & UX State', () => {});

  const sessionPageContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/review/session/page.tsx'),
    'utf-8'
  );

  await runner.it('3.1: saveSrsReview is strictly conditioned on !isFreeReview', () => {
    // Check that saveSrsReview call is guarded by if (!isFreeReview)
    const match = sessionPageContent.match(/if\s*\(!isFreeReview\)\s*\{\s*void\s*saveSrsReview/);
    expect(match !== null).toBe(true);
  });

  await runner.it('3.2: invalidateWordSummaryCache is strictly conditioned on !isFreeReview', () => {
    // Check that invalidateWordSummaryCache is guarded by if (!isFreeReview)
    const match = sessionPageContent.match(/if\s*\(!isFreeReview\)\s*\{\s*invalidateWordSummaryCache\(\);/);
    expect(match !== null).toBe(true);
  });

  await runner.it('3.3: startFreeReview correctly sets isFreeReview = true and shuffles pool', () => {
    expect(sessionPageContent.includes('setIsFreeReview(true)')).toBe(true);
    expect(sessionPageContent.includes('shuffle(freeWords).slice(0, SESSION_CAP)')).toBe(true);
  });

  await runner.it('3.4: Visual indicators for Free Review mode are present', () => {
    // Badge 🔄 Ôn tự do
    expect(sessionPageContent.includes('🔄 Ôn tự do')).toBe(true);
    // Completion heading
    expect(sessionPageContent.includes("isFreeReview ? 'Xong lượt ôn tự do!' : `Xong phiên ${sessionTitle}!`")).toBe(true);
    // Continue button
    expect(sessionPageContent.includes("isFreeReview ? 'Ôn tiếp lượt khác' : 'Ôn tiếp'")).toBe(true);
  });

  // ==========================================================================
  // Suite 4: Review Hub Scoping & CTA Navigation
  // ==========================================================================
  runner.describe('Suite 4: Review Hub Scoping & CTA Navigation', () => {});

  const hubPageContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/review/page.tsx'),
    'utf-8'
  );

  await runner.it('4.1: Cross-classroom query when classParam is absent', () => {
    expect(hubPageContent.includes("authFetch('/api/words?summary=1'")).toBe(true);
    expect(hubPageContent.includes("classroomId: null")).toBe(true);
  });

  await runner.it('4.2: Scoped classroom query when classParam is present', () => {
    expect(hubPageContent.includes("authFetch(url, {})") || hubPageContent.includes("authFetch(url)")).toBe(true);
    expect(hubPageContent.includes("/api/words?classroomId=${encodeURIComponent(classParam)}&summary=1")).toBe(true);
  });

  await runner.it('4.3: Primary CTA links to /review/session?mode=mixed with scoping', () => {
    expect(hubPageContent.includes("withClass('/review/session?mode=mixed')")).toBe(true);
    expect(hubPageContent.includes("⚡ Bắt đầu phiên ôn tập ({dueCount} từ)")).toBe(true);

    // Verify withClass behavior
    expect(withClass('/review/session?mode=mixed', null)).toBe('/review/session?mode=mixed');
    expect(withClass('/review/session?mode=mixed', 'class-uuid')).toBe('/review/session?mode=mixed&class=class-uuid');
  });

  await runner.it('4.4: Zero due words offers Free Review and Practice quiz CTAs', () => {
    expect(hubPageContent.includes("withClass('/review/session?mode=mixed&free=1')")).toBe(true);
    expect(hubPageContent.includes("🔄 Ôn tập tự do (Tất cả từ đã học)")).toBe(true);
    expect(hubPageContent.includes("withClass('/practice')")).toBe(true);
    expect(hubPageContent.includes("🧠 Quiz trắc nghiệm")).toBe(true);
  });

  // ==========================================================================
  // Suite 5: Integrity & Hardcoded Mock Detection
  // ==========================================================================
  runner.describe('Suite 5: Source Code Integrity Checks', () => {});

  await runner.it('5.1: Zero hardcoded test mocks or fake user IDs in production files', () => {
    const forbiddenPatterns = [
      /00000000-0000-0000-0000-000000000001/,
      /test-user-id/,
      /fake_token/,
      /mockResponse/,
      /__test_bypass__/,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(pattern.test(sessionPageContent)).toBe(false);
      expect(pattern.test(hubPageContent)).toBe(false);
    }
  });

  await runner.it('5.2: Verification that Empty State provides educational FSRS explanation', () => {
    expect(sessionPageContent.includes('Thuật toán FSRS tối ưu khoảng cách ghi nhớ')).toBe(true);
    expect(sessionPageContent.includes('ôn tập trước hạn không bắt buộc theo FSRS')).toBe(true);
  });

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`M3.4 Test Suite Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Execution Time: ${stats.durationMs} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runM34Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
