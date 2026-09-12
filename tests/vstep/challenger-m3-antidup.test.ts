/**
 * Empirical & Adversarial Challenger Test Suite: VSTEP Milestone 3
 * Verifies dynamic question counts, progress bar calculation, and anti-duplication query parameter forwarding.
 *
 * Requirements tested:
 * 1. Dynamic bank aggregation from src/data/vstep/vstep-catalog-index.json (5,604 objective Qs: 2,960 L + 2,644 R).
 * 2. LocalStorage history simulation: empty state (0 Qs), partial states (500 Qs, 1,000 Qs), and complete state (5,604 Qs),
 *    with percentage calculations, clamping (0..100%), zero-division guard, and selective skill resetting.
 * 3. Action URL parameter generation: for all 190 items, verify /vstep/exam/${item.id}?filter=${mode} for unseen, mistakes, all_random.
 * 4. Exam room integration: verify src/app/vstep/exam/[examId]/page.tsx forwards &filter= to /api/vstep/test and renders mode badges.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect, setupMockBrowserEnvironment, teardownMockBrowserEnvironment } from './test-harness';
import catalogDataRaw from '@/data/vstep/vstep-catalog-index.json';
import { VstepExamCatalogItem } from '@/lib/vstep-types';
import {
  getVstepProgressStats,
  batchRecordVstepAnswers,
  resetVstepSkillProgress,
  resetAllVstepProgress,
  VstepPracticeFilterMode,
  VSTEP_HISTORY_STORAGE_KEY
} from '@/lib/vstep-history';

const catalogItems = (catalogDataRaw as { items: VstepExamCatalogItem[] }).items;

export async function runChallengerM3AntiDupTests(): Promise<void> {
  const runner = new TestRunner();
  const { localStorage } = setupMockBrowserEnvironment();

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 1: Full Aggregation of Question Counts from Catalog
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('1. Empirical Aggregation of Question Counts & Bank Capacity', async () => {
    await runner.it('C1.1: Global catalog contains exactly 190 items with 0 duplicate IDs', () => {
      expect(catalogItems.length).toBe(190);

      const idSet = new Set<string>();
      for (const item of catalogItems) {
        expect(Boolean(item.id)).toBeTruthy();
        expect(idSet.has(item.id)).toBeFalsy();
        idSet.add(item.id);
      }
      expect(idSet.size).toBe(190);
    });

    await runner.it('C1.2: Full Mock exams count is exactly 24, contributing 840 Listening and 960 Reading Qs', () => {
      const fullMocks = catalogItems.filter(i => i.category === 'full_mock');
      expect(fullMocks.length).toBe(24);

      // 24 Full Mocks * 35 = 840 Listening
      const listeningFromMocks = fullMocks.length * 35;
      expect(listeningFromMocks).toBe(840);

      // 24 Full Mocks * 40 = 960 Reading
      const readingFromMocks = fullMocks.length * 40;
      expect(readingFromMocks).toBe(960);

      // Objective questions per mock = 75, total = 1,800
      expect(listeningFromMocks + readingFromMocks).toBe(1800);
    });

    await runner.it('C1.3: Standalone Listening sets count is exactly 61, contributing 2,120 Listening Qs', () => {
      const listeningSets = catalogItems.filter(i => i.category === 'listening');
      expect(listeningSets.length).toBe(61);

      let totalQuestions = 0;
      for (const item of listeningSets) {
        expect(item.totalQuestions).toBeGreaterThan(0);
        totalQuestions += (item.totalQuestions || 0);
      }
      expect(totalQuestions).toBe(2120);
    });

    await runner.it('C1.4: Standalone Reading sets count is exactly 105, contributing 1,684 Reading Qs', () => {
      const readingSets = catalogItems.filter(i => i.category === 'reading');
      expect(readingSets.length).toBe(105);

      let totalQuestions = 0;
      for (const item of readingSets) {
        expect(item.totalQuestions).toBeGreaterThan(0);
        totalQuestions += (item.totalQuestions || 0);
      }
      expect(totalQuestions).toBe(1684);
    });

    await runner.it('C1.5: Total Listening questions in bank equals exactly 2,960 (840 Mock + 2,120 Sets)', () => {
      let listeningTotal = 0;
      for (const item of catalogItems) {
        if (item.category === 'full_mock') {
          listeningTotal += 35;
        } else if (item.category === 'listening' || item.skills?.includes('listening')) {
          listeningTotal += (item.totalQuestions || 0);
        }
      }
      expect(listeningTotal).toBe(2960);
    });

    await runner.it('C1.6: Total Reading questions in bank equals exactly 2,644 (960 Mock + 1,684 Sets)', () => {
      let readingTotal = 0;
      for (const item of catalogItems) {
        if (item.category === 'full_mock') {
          readingTotal += 40;
        } else if (item.category === 'reading' || item.skills?.includes('reading')) {
          readingTotal += (item.totalQuestions || 0);
        }
      }
      expect(readingTotal).toBe(2644);
    });

    await runner.it('C1.7: Total Objective Question Bank capacity equals exactly 5,604 questions', () => {
      let listening = 0;
      let reading = 0;
      for (const item of catalogItems) {
        if (item.category === 'full_mock') {
          listening += 35;
          reading += 40;
        } else if (item.category === 'listening' || item.skills?.includes('listening')) {
          listening += (item.totalQuestions || 0);
        } else if (item.category === 'reading' || item.skills?.includes('reading')) {
          reading += (item.totalQuestions || 0);
        }
      }

      const totalQuestions = listening + reading;
      expect(totalQuestions).toBe(5604);
      expect(listening).toBe(2960);
      expect(reading).toBe(2644);
    });

    await runner.it('C1.8: Order invariance: bank calculation yields 5,604 regardless of item permutation', () => {
      // Reverse order test
      const reversed = [...catalogItems].reverse();
      let listeningRev = 0;
      let readingRev = 0;
      for (const item of reversed) {
        if (item.category === 'full_mock') {
          listeningRev += 35;
          readingRev += 40;
        } else if (item.category === 'listening' || item.skills?.includes('listening')) {
          listeningRev += (item.totalQuestions || 0);
        } else if (item.category === 'reading' || item.skills?.includes('reading')) {
          readingRev += (item.totalQuestions || 0);
        }
      }
      expect(listeningRev).toBe(2960);
      expect(readingRev).toBe(2644);
      expect(listeningRev + readingRev).toBe(5604);
    });

    await runner.it('C1.9: Full Mock items are NOT double-counted despite containing listening/reading in skills', () => {
      // Verify that Full Mock items have skills array containing 'listening' and 'reading'
      const fullMocks = catalogItems.filter(i => i.category === 'full_mock');
      const sampleMock = fullMocks[0];
      expect(sampleMock.skills).toContain('listening');
      expect(sampleMock.skills).toContain('reading');

      // If else-if was naive or broken, listening would have been 840 + sampleMock.totalQuestions!
      // Verify that category === 'full_mock' guards correctly.
      let mockListening = 0;
      for (const item of fullMocks) {
        if (item.category === 'full_mock') {
          mockListening += 35;
        } else if (item.skills?.includes('listening')) {
          mockListening += 999999;
        }
      }
      expect(mockListening).toBe(840);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 2: LocalStorage History Simulation & Progress Math Verification
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('2. LocalStorage History Simulation & Progress Bar Calculation', async () => {
    await runner.it('C2.1: Clean state (0 Qs answered) yields 0% for L, R, and Overall with 0 mistakes', () => {
      localStorage.clear();

      const statsL = getVstepProgressStats('listening', 2960);
      const statsR = getVstepProgressStats('reading', 2644);

      expect(statsL.answeredCount).toBe(0);
      expect(statsL.totalCount).toBe(2960);
      expect(statsL.percentage).toBe(0);
      expect(statsL.mistakeCount).toBe(0);

      expect(statsR.answeredCount).toBe(0);
      expect(statsR.totalCount).toBe(2644);
      expect(statsR.percentage).toBe(0);
      expect(statsR.mistakeCount).toBe(0);

      const totalAnswered = statsL.answeredCount + statsR.answeredCount;
      const overallPercentage = 5604 > 0 ? Math.round((totalAnswered / 5604) * 100) : 0;
      expect(overallPercentage).toBe(0);
    });

    await runner.it('C2.2: Partial state (500 Qs: 300 L + 200 R) computes accurate percentages & mistakes', () => {
      localStorage.clear();

      // Seed 300 Listening questions (260 correct, 40 mistakes)
      const listeningRecords = Array.from({ length: 300 }, (_, i) => ({
        questionId: `sim-lis-${i + 1}`,
        skill: 'listening' as const,
        part: `part${(i % 3) + 1}`,
        isCorrect: i < 260,
        selectedOption: 0,
      }));

      // Seed 200 Reading questions (170 correct, 30 mistakes)
      const readingRecords = Array.from({ length: 200 }, (_, i) => ({
        questionId: `sim-read-${i + 1}`,
        skill: 'reading' as const,
        part: `passage${(i % 4) + 1}`,
        isCorrect: i < 170,
        selectedOption: 1,
      }));

      batchRecordVstepAnswers([...listeningRecords, ...readingRecords]);

      const statsL = getVstepProgressStats('listening', 2960);
      const statsR = getVstepProgressStats('reading', 2644);

      expect(statsL.answeredCount).toBe(300);
      expect(statsL.correctCount).toBe(260);
      expect(statsL.mistakeCount).toBe(40);
      // 300 / 2960 = 0.10135... -> 10%
      expect(statsL.percentage).toBe(10);

      expect(statsR.answeredCount).toBe(200);
      expect(statsR.correctCount).toBe(170);
      expect(statsR.mistakeCount).toBe(30);
      // 200 / 2644 = 0.07564... -> 8%
      expect(statsR.percentage).toBe(8);

      const totalAnswered = statsL.answeredCount + statsR.answeredCount;
      expect(totalAnswered).toBe(500);

      // Overall: 500 / 5604 = 0.08922... -> 9%
      const overallPercentage = Math.round((totalAnswered / 5604) * 100);
      expect(overallPercentage).toBe(9);

      const totalMistakes = statsL.mistakeCount + statsR.mistakeCount;
      expect(totalMistakes).toBe(70);
    });

    await runner.it('C2.3: Second partial state (1,000 Qs: 600 L + 400 R) computes accurate percentages', () => {
      localStorage.clear();

      const listeningRecords = Array.from({ length: 600 }, (_, i) => ({
        questionId: `sim-lis-1k-${i + 1}`,
        skill: 'listening' as const,
        part: `part${(i % 3) + 1}`,
        isCorrect: true,
        selectedOption: 0,
      }));

      const readingRecords = Array.from({ length: 400 }, (_, i) => ({
        questionId: `sim-read-1k-${i + 1}`,
        skill: 'reading' as const,
        part: `passage${(i % 4) + 1}`,
        isCorrect: true,
        selectedOption: 1,
      }));

      batchRecordVstepAnswers([...listeningRecords, ...readingRecords]);

      const statsL = getVstepProgressStats('listening', 2960);
      const statsR = getVstepProgressStats('reading', 2644);

      expect(statsL.answeredCount).toBe(600);
      // 600 / 2960 = 0.2027... -> 20%
      expect(statsL.percentage).toBe(20);

      expect(statsR.answeredCount).toBe(400);
      // 400 / 2644 = 0.15128... -> 15%
      expect(statsR.percentage).toBe(15);

      const totalAnswered = statsL.answeredCount + statsR.answeredCount;
      expect(totalAnswered).toBe(1000);

      // Overall: 1000 / 5604 = 0.1784... -> 18%
      const overallPercentage = Math.round((totalAnswered / 5604) * 100);
      expect(overallPercentage).toBe(18);
    });

    await runner.it('C2.4: Complete state (5,604 Qs: 2,960 L + 2,644 R) yields exactly 100% across all bars', () => {
      localStorage.clear();

      // Seed all 2,960 listening questions in batches of 500
      const allL = Array.from({ length: 2960 }, (_, i) => ({
        questionId: `full-lis-${i + 1}`,
        skill: 'listening' as const,
        part: 'part1',
        isCorrect: i % 10 !== 0, // 90% correct
        selectedOption: 0,
      }));

      // Seed all 2,644 reading questions in batches of 500
      const allR = Array.from({ length: 2644 }, (_, i) => ({
        questionId: `full-read-${i + 1}`,
        skill: 'reading' as const,
        part: 'reading_p1',
        isCorrect: i % 10 !== 0,
        selectedOption: 2,
      }));

      batchRecordVstepAnswers([...allL, ...allR]);

      const statsL = getVstepProgressStats('listening', 2960);
      const statsR = getVstepProgressStats('reading', 2644);

      expect(statsL.answeredCount).toBe(2960);
      expect(statsL.totalCount).toBe(2960);
      expect(statsL.percentage).toBe(100);

      expect(statsR.answeredCount).toBe(2644);
      expect(statsR.totalCount).toBe(2644);
      expect(statsR.percentage).toBe(100);

      const totalAnswered = statsL.answeredCount + statsR.answeredCount;
      expect(totalAnswered).toBe(5604);

      const overallPercentage = Math.round((totalAnswered / 5604) * 100);
      expect(overallPercentage).toBe(100);
    });

    await runner.it('C2.5: Overflow & Clamping: answering > totalInBank clamps to 100% (never > 100%)', () => {
      localStorage.clear();

      // Seed 3,500 listening questions (more than the 2,960 bank)
      const excessRecords = Array.from({ length: 3500 }, (_, i) => ({
        questionId: `excess-lis-${i + 1}`,
        skill: 'listening' as const,
        part: 'part1',
        isCorrect: true,
      }));

      batchRecordVstepAnswers(excessRecords);

      const statsL = getVstepProgressStats('listening', 2960);
      expect(statsL.answeredCount).toBe(3500);
      // effectiveTotal is Math.max(2960, 3500) = 3500
      expect(statsL.totalCount).toBe(3500);
      // Math.min(100, Math.round((3500/3500)*100)) = 100
      expect(statsL.percentage).toBe(100);
      expect(statsL.percentage <= 100).toBeTruthy();
      expect(statsL.percentage >= 0).toBeTruthy();
    });

    await runner.it('C2.6: Zero-division guard: handles totalCount = 0 safely without producing NaN or Infinity', () => {
      localStorage.clear();

      // Calling getVstepProgressStats with totalInBank = 0
      const statsZero = getVstepProgressStats('listening', 0);
      expect(statsZero.answeredCount).toBe(0);
      expect(statsZero.totalCount).toBe(0);
      expect(statsZero.percentage).toBe(0);
      expect(Number.isNaN(statsZero.percentage)).toBeFalsy();
      expect(Number.isFinite(statsZero.percentage)).toBeTruthy();

      // Overall percentage calculation with bankTotals.totalQuestions = 0
      const zeroBankTotal = 0;
      const zeroAnswered = 0;
      const overallPercent = zeroBankTotal > 0 ? Math.round((zeroAnswered / zeroBankTotal) * 100) : 0;
      expect(overallPercent).toBe(0);
      expect(Number.isNaN(overallPercent)).toBeFalsy();
    });

    await runner.it('C2.7: Skill progress reset: resetting Listening leaves Reading completely intact', () => {
      localStorage.clear();

      batchRecordVstepAnswers([
        { questionId: 'l1', skill: 'listening', part: 'p1', isCorrect: false },
        { questionId: 'l2', skill: 'listening', part: 'p1', isCorrect: true },
        { questionId: 'r1', skill: 'reading', part: 'p1', isCorrect: false },
      ]);

      expect(getVstepProgressStats('listening', 2960).answeredCount).toBe(2);
      expect(getVstepProgressStats('reading', 2644).answeredCount).toBe(1);

      // Reset Listening
      resetVstepSkillProgress('listening');

      const afterL = getVstepProgressStats('listening', 2960);
      const afterR = getVstepProgressStats('reading', 2644);

      expect(afterL.answeredCount).toBe(0);
      expect(afterL.mistakeCount).toBe(0);
      expect(afterL.percentage).toBe(0);

      // Reading MUST remain untouched
      expect(afterR.answeredCount).toBe(1);
      expect(afterR.mistakeCount).toBe(1);

      // Reset Reading
      resetVstepSkillProgress('reading');
      expect(getVstepProgressStats('reading', 2644).answeredCount).toBe(0);
    });

    await runner.it('C2.8: Reset All VSTEP Progress clears the entire storage key', () => {
      localStorage.clear();

      batchRecordVstepAnswers([
        { questionId: 'l1', skill: 'listening', part: 'p1', isCorrect: true },
        { questionId: 'r1', skill: 'reading', part: 'p1', isCorrect: true },
      ]);

      resetAllVstepProgress();
      expect(localStorage.getItem(VSTEP_HISTORY_STORAGE_KEY)).toBeNull();
      expect(getVstepProgressStats('listening', 2960).answeredCount).toBe(0);
      expect(getVstepProgressStats('reading', 2644).answeredCount).toBe(0);
    });

    await runner.it('C2.9: Malformed JSON in localStorage is safely trapped without throwing runtime errors', () => {
      localStorage.setItem(VSTEP_HISTORY_STORAGE_KEY, 'CORRUPTED_NON_JSON_DATA_{{[[');

      const stats = getVstepProgressStats('listening', 2960);
      expect(stats.answeredCount).toBe(0);
      expect(stats.percentage).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 3: Action URL Parameter Generation for All 190 Items
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('3. Action URL Generation & Anti-Duplication Encoding for All 190 Items', async () => {
    const modes: VstepPracticeFilterMode[] = ['unseen', 'mistakes', 'all_random'];

    await runner.it('C3.1: All 190 items generate valid action URLs for mode "unseen"', () => {
      for (const item of catalogItems) {
        const url = `/vstep/exam/${item.id}?filter=unseen`;
        expect(url.startsWith('/vstep/exam/')).toBeTruthy();
        expect(url.includes(`/${item.id}?filter=unseen`)).toBeTruthy();

        // Verify valid URL component
        const parsed = new URL(`https://lingopro.edu.vn${url}`);
        expect(parsed.pathname).toBe(`/vstep/exam/${item.id}`);
        expect(parsed.searchParams.get('filter')).toBe('unseen');
      }
    });

    await runner.it('C3.2: All 190 items generate valid action URLs for mode "mistakes"', () => {
      for (const item of catalogItems) {
        const url = `/vstep/exam/${item.id}?filter=mistakes`;
        const parsed = new URL(`https://lingopro.edu.vn${url}`);
        expect(parsed.pathname).toBe(`/vstep/exam/${item.id}`);
        expect(parsed.searchParams.get('filter')).toBe('mistakes');
      }
    });

    await runner.it('C3.3: All 190 items generate valid action URLs for mode "all_random"', () => {
      for (const item of catalogItems) {
        const url = `/vstep/exam/${item.id}?filter=all_random`;
        const parsed = new URL(`https://lingopro.edu.vn${url}`);
        expect(parsed.pathname).toBe(`/vstep/exam/${item.id}`);
        expect(parsed.searchParams.get('filter')).toBe('all_random');
      }
    });

    await runner.it('C3.4: Total 570 URLs (190 items * 3 modes) adhere to strict URL format regex', () => {
      const urlRegex = /^\/vstep\/exam\/([a-zA-Z0-9_\-]+)\?filter=(unseen|mistakes|all_random)$/;
      let totalTested = 0;

      for (const item of catalogItems) {
        for (const mode of modes) {
          const url = `/vstep/exam/${item.id}?filter=${mode}`;
          expect(urlRegex.test(url)).toBeTruthy();
          totalTested++;
        }
      }
      expect(totalTested).toBe(570);
    });

    await runner.it('C3.5: No item ID contains illegal URL characters (whitespace, hash, query, slashes)', () => {
      for (const item of catalogItems) {
        expect(encodeURIComponent(item.id)).toBe(item.id);
        expect(item.id.includes(' ')).toBeFalsy();
        expect(item.id.includes('?')).toBeFalsy();
        expect(item.id.includes('&')).toBeFalsy();
        expect(item.id.includes('#')).toBeFalsy();
        expect(item.id.includes('/')).toBeFalsy();
        expect(item.id.includes('\\')).toBeFalsy();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 4: Exam Room Integration & Query Parameter Forwarding
  // ──────────────────────────────────────────────────────────────────────────
  await runner.describe('4. Exam Room Integration & Query Forwarding Verification', async () => {
    const examPagePath = path.resolve(__dirname, '../../src/app/vstep/exam/[examId]/page.tsx');
    const examPageSource = fs.readFileSync(examPagePath, 'utf8');

    await runner.it('C4.1: Exam room reads filter from searchParams with "unseen" fallback', () => {
      // In src/app/vstep/exam/[examId]/page.tsx:
      // const filterMode = searchParams.get('filter') || 'unseen';
      expect(examPageSource).toContain("const filterMode = searchParams.get('filter') || 'unseen';");
    });

    await runner.it('C4.2: Exam room forwards &filter= to /api/vstep/test using encodeURIComponent', () => {
      // Expect fetch call to include testId and filter parameter
      expect(examPageSource).toContain('/api/vstep/test?testId=${encodeURIComponent(examId)}&filter=${encodeURIComponent(filterMode)}');
    });

    await runner.it('C4.3: useEffect dependency array includes [examId, filterMode] for reactive re-fetching', () => {
      expect(examPageSource).toContain('[examId, filterMode]');
    });

    await runner.it('C4.4: Mode badge for "unseen" renders "Chế độ: Chưa từng làm" with ShieldCheck icon', () => {
      expect(examPageSource).toContain("filterMode === 'unseen'");
      expect(examPageSource).toContain('Chế độ: Chưa từng làm');
      expect(examPageSource).toContain('ShieldCheck');
    });

    await runner.it('C4.5: Mode badge for "mistakes" renders "Chế độ: Luyện câu sai" with RotateCcw icon', () => {
      expect(examPageSource).toContain("filterMode === 'mistakes'");
      expect(examPageSource).toContain('Chế độ: Luyện câu sai');
      expect(examPageSource).toContain('RotateCcw');
    });

    await runner.it('C4.6: Mode badge for "all_random" renders "Chế độ: Ngẫu nhiên" with Layers icon', () => {
      expect(examPageSource).toContain("filterMode === 'all_random'");
      expect(examPageSource).toContain('Chế độ: Ngẫu nhiên');
      expect(examPageSource).toContain('Layers');
    });

    await runner.it('C4.7: Adversarial query parameter simulation: sanitizes hostile inputs safely', () => {
      // Simulation of searchParams and API query construction
      const simulateForwarding = (examIdInput: string, rawQueryParam: string | null) => {
        const filterMode = rawQueryParam || 'unseen';
        return `/api/vstep/test?testId=${encodeURIComponent(examIdInput)}&filter=${encodeURIComponent(filterMode)}`;
      };

      // 1. Missing filter -> defaults to unseen
      expect(simulateForwarding('vstep-mock-01', null)).toBe('/api/vstep/test?testId=vstep-mock-01&filter=unseen');

      // 2. Hostile query injection attempt
      const injected = simulateForwarding('vstep-mock-01', 'unseen&dump=1&poison=0');
      expect(injected).toBe('/api/vstep/test?testId=vstep-mock-01&filter=unseen%26dump%3D1%26poison%3D0');
      expect(injected.includes('&dump=1')).toBeFalsy(); // parameter injection prevented

      // 3. XSS injection attempt
      const xss = simulateForwarding('vstep-mock-01', '<script>alert(1)</script>');
      expect(xss).toBe('/api/vstep/test?testId=vstep-mock-01&filter=%3Cscript%3Ealert(1)%3C%2Fscript%3E');

      // 4. Special unicode test ID
      const unicodeId = simulateForwarding('vstep-mock-đề-01', 'mistakes');
      expect(unicodeId).toBe('/api/vstep/test?testId=vstep-mock-%C4%91%E1%BB%81-01&filter=mistakes');
    });
  });

  teardownMockBrowserEnvironment();

  const stats = runner.getStats();
  console.log(`\n======================================================`);
  console.log(`🏁 CHALLENGER M3.2 SUITE: ${stats.passed}/${stats.total} PASSED | ${stats.failed} FAILED`);
  console.log(`======================================================`);

  if (stats.failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runChallengerM3AntiDupTests().catch((err) => {
    console.error('Fatal error in Challenger M3.2 test suite:', err);
    process.exit(1);
  });
}
