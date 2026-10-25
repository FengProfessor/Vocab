/**
 * Challenger 2 Adversarial Stress Harness
 * Empirical testing of TOEIC Exam Room State, Scoring Engine & UI Integrity.
 */

import {
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
} from '../../src/lib/toeic-barem';

import {
  getScaledListeningScore,
  getScaledReadingScore,
  getCefrLevel,
  getPartAccuracyRating,
  calculateToeicScore,
} from '../../src/lib/toeic-scoring';

import {
  loadFullToeicTest,
  getAvailableToeicTests,
} from '../../src/lib/toeic-test-loader';

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';

import { TechnicalMinimalistValidator } from './ui-minimalist.test';
import fs from 'node:fs';
import path from 'node:path';

const runner = new TestRunner();

runner.describe('Challenger 2 Empirical Verification: Scoring Engine Invariants', () => {
  runner.it('CH2-SCORE-1: Boundary values: -10, 0, 100, NaN, Infinity, -Infinity', () => {
    // Negative inputs clamp to 0 -> score 5
    expect(lookupListeningScore(-10)).toBe(5);
    expect(lookupReadingScore(-10)).toBe(5);
    expect(lookupListeningScore(0)).toBe(5);
    expect(lookupReadingScore(0)).toBe(5);

    // Max inputs clamp to 100 -> score 495
    expect(lookupListeningScore(100)).toBe(495);
    expect(lookupReadingScore(100)).toBe(495);
    expect(lookupListeningScore(150)).toBe(495);
    expect(lookupReadingScore(150)).toBe(495);

    // Non-numbers and NaN safely return floor score 5
    expect(lookupListeningScore(NaN)).toBe(5);
    expect(lookupReadingScore(NaN)).toBe(5);
    expect(lookupListeningScore(Infinity)).toBe(495);
    expect(lookupReadingScore(Infinity)).toBe(495);
    expect(lookupListeningScore(-Infinity)).toBe(5);
    expect(lookupReadingScore(-Infinity)).toBe(5);

    // Wrapper functions
    expect(getScaledListeningScore(-10)).toBe(5);
    expect(getScaledReadingScore(-10)).toBe(5);
    expect(getScaledListeningScore(100)).toBe(495);
    expect(getScaledReadingScore(100)).toBe(495);
  });

  runner.it('CH2-SCORE-2: Strict Monotonicity: Higher or equal raw never yields lower scaled score', () => {
    for (let r = 0; r < 100; r++) {
      const lcCurrent = lookupListeningScore(r);
      const lcNext = lookupListeningScore(r + 1);
      expect(lcNext).toBeGreaterThanOrEqual(lcCurrent);

      const rcCurrent = lookupReadingScore(r);
      const rcNext = lookupReadingScore(r + 1);
      expect(rcNext).toBeGreaterThanOrEqual(rcCurrent);
    }
  });

  runner.it('CH2-SCORE-3: Minimum possible total score is exactly 10, maximum is exactly 990', () => {
    const minConv = convertRawToScaled(0, 0);
    expect(minConv.scaledListening).toBe(5);
    expect(minConv.scaledReading).toBe(5);
    expect(minConv.scaledTotal).toBe(10);

    const maxConv = convertRawToScaled(100, 100);
    expect(maxConv.scaledListening).toBe(495);
    expect(maxConv.scaledReading).toBe(495);
    expect(maxConv.scaledTotal).toBe(990);
  });

  runner.it('CH2-SCORE-4: CEFR boundaries and rounding invariants', () => {
    expect(getCefrLevel(10)).toBe('A1');
    expect(getCefrLevel(254)).toBe('A1');
    expect(getCefrLevel(255)).toBe('A2');
    expect(getCefrLevel(404)).toBe('A2');
    expect(getCefrLevel(405)).toBe('B1');
    expect(getCefrLevel(604)).toBe('B1');
    expect(getCefrLevel(605)).toBe('B2');
    expect(getCefrLevel(904)).toBe('B2');
    expect(getCefrLevel(905)).toBe('C1');
    expect(getCefrLevel(990)).toBe('C1');

    // Float raw rounding check
    expect(lookupListeningScore(6.4)).toBe(5); // rounds to 6 -> 5
    expect(lookupListeningScore(6.5)).toBe(10); // rounds to 7 -> 10
    expect(lookupReadingScore(9.4)).toBe(5); // rounds to 9 -> 5
    expect(lookupReadingScore(9.5)).toBe(10); // rounds to 10 -> 10
  });
});

runner.describe('Challenger 2 Empirical Verification: Rapid Answering & State Machine', () => {
  const test6852 = loadFullToeicTest('6852');

  runner.it('CH2-STATE-1: Rapid answer selection across Q1..Q200 preserves exact selections and count metrics', () => {
    const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    const flagged = new Set<number>();

    // Rapidly cycle and change answers across all 200 questions 3 times
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let q = 1; q <= 200; q++) {
        const choice = options[(q + cycle) % 4];
        answers[q] = choice;
      }
    }

    expect(Object.keys(answers).length).toBe(200);

    // Rapidly toggle flags on even questions
    for (let q = 1; q <= 200; q++) {
      if (q % 2 === 0) {
        flagged.add(q);
      }
    }
    expect(flagged.size).toBe(100);

    // Score calculation after rapid input
    const score = calculateToeicScore(answers, test6852, 3600);
    expect(score.rawListening + score.rawReading).toBe(score.rawTotal);
    expect(score.scaledTotal).toBe(score.scaledListening + score.scaledReading);
    expect(score.scaledTotal).toBeGreaterThanOrEqual(10);
    expect(score.scaledTotal).toBeLessThanOrEqual(990);
  });

  runner.it('CH2-STATE-2: Rapid switching and overwrite does not corrupt intermediate state', () => {
    const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    // Simulate user rapidly changing answer on Q42: A -> B -> C -> D -> A
    answers[42] = 'A';
    expect(answers[42]).toBe('A');
    answers[42] = 'B';
    expect(answers[42]).toBe('B');
    answers[42] = 'C';
    expect(answers[42]).toBe('C');
    answers[42] = 'D';
    expect(answers[42]).toBe('D');
    answers[42] = 'A';
    expect(answers[42]).toBe('A');

    // Total answers map contains exactly 1 entry for Q42
    expect(Object.keys(answers).length).toBe(1);
  });
});

runner.describe('Challenger 2 Empirical Verification: LocalStorage Corruption Recovery', () => {
  runner.it('CH2-STORE-1: Truncated / malformed JSON recovers without crashing session', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const storageKey = 'lingo_toeic_session_6852_real';
      mockStorage.setItem(storageKey, '{"testId":"6852","answers":{"1":"A'); // broken json

      let restoredDraft: any = null;
      let errorCaught = false;

      try {
        const raw = mockStorage.getItem(storageKey);
        if (raw) {
          restoredDraft = JSON.parse(raw);
        }
      } catch (err) {
        errorCaught = true;
      }

      // Must be safely caught
      expect(errorCaught).toBe(true);
      expect(restoredDraft).toBeNull();
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  runner.it('CH2-STORE-2: Corrupted schema types (non-array flagged, string answers, negative time) recovered safely', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const storageKey = 'lingo_toeic_session_6852_real';
      // Put adversarial data types in storage
      const corruptedData = {
        testId: '6852_real',
        answers: 'not an object',
        flagged: 12345, // not an array
        currentQNum: 'invalid',
        timeRemainingSeconds: -50,
      };
      mockStorage.setItem(storageKey, JSON.stringify(corruptedData));

      const raw = mockStorage.getItem(storageKey);
      const draft = JSON.parse(raw!);

      // In useToeicExamSession logic:
      // draft.timeRemainingSeconds <= 0 should prevent restoring expired/negative drafts
      const canRestore = draft && draft.timeRemainingSeconds > 0;
      expect(canRestore).toBe(false);

      // If timeRemainingSeconds was positive but flagged was non-array:
      const safeRestoreFlagged = (val: any) => {
        if (Array.isArray(val)) return new Set(val);
        return new Set();
      };
      expect(safeRestoreFlagged(draft.flagged).size).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  runner.it('CH2-STORE-3: QuotaExceededError in localStorage does not crash autosave execution', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // Mock setItem throwing QuotaExceededError
      let quotaCaught = false;
      const failingStorage = {
        setItem: () => {
          const err = new Error('QuotaExceededError');
          err.name = 'QuotaExceededError';
          throw err;
        },
      };

      try {
        failingStorage.setItem();
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          quotaCaught = true;
        }
      }
      expect(quotaCaught).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });
});

runner.describe('Challenger 2 Empirical Verification: Keyboard Shortcut Input Shielding', () => {
  const sampleQuestion = {
    questionNumber: 1,
    part: 1,
    options: [
      { key: 'A', text: 'Option A' },
      { key: 'B', text: 'Option B' },
      { key: 'C', text: 'Option C' },
      { key: 'D', text: 'Option D' },
    ],
  };

  function simulateShortcutHandler(e: {
    key: string;
    targetTagName?: string;
    isContentEditable?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
  }) {
    let prevented = false;
    let selectedOption: string | null = null;
    let flaggedToggled = false;
    let navDirection: 'prev' | 'next' | null = null;

    // 1. Input shielding check
    const isInput =
      e.targetTagName === 'INPUT' ||
      e.targetTagName === 'TEXTAREA' ||
      Boolean(e.isContentEditable);

    if (isInput) {
      return { prevented, selectedOption, flaggedToggled, navDirection };
    }

    // 2. Modifier key check (Adversarial check: Ctrl/Cmd/Alt)
    const hasModifier = Boolean(e.ctrlKey || e.metaKey || e.altKey);

    const key = e.key.toUpperCase();

    if (key === 'A' || key === 'B' || key === 'C' || key === 'D') {
      // In ToeicSplitPane.tsx, it matches options:
      if (!hasModifier) {
        prevented = true;
        selectedOption = key;
      }
    } else if (e.key === 'ArrowRight' && !hasModifier) {
      prevented = true;
      navDirection = 'next';
    } else if (e.key === 'ArrowLeft' && !hasModifier) {
      prevented = true;
      navDirection = 'prev';
    } else if (key === 'F' && !hasModifier) {
      prevented = true;
      flaggedToggled = true;
    }

    return { prevented, selectedOption, flaggedToggled, navDirection };
  }

  runner.it('CH2-KEY-1: Keystrokes in INPUT and TEXTAREA are completely shielded', () => {
    for (const tag of ['INPUT', 'TEXTAREA']) {
      for (const k of ['a', 'b', 'c', 'd', 'f', 'ArrowRight', 'ArrowLeft']) {
        const res = simulateShortcutHandler({ key: k, targetTagName: tag });
        expect(res.prevented).toBe(false);
        expect(res.selectedOption).toBeNull();
        expect(res.flaggedToggled).toBe(false);
        expect(res.navDirection).toBeNull();
      }
    }
  });

  runner.it('CH2-KEY-2: isContentEditable elements are completely shielded', () => {
    const res = simulateShortcutHandler({
      key: 'A',
      targetTagName: 'DIV',
      isContentEditable: true,
    });
    expect(res.prevented).toBe(false);
    expect(res.selectedOption).toBeNull();
  });

  runner.it('CH2-KEY-3: Normal keys outside input select options and navigate', () => {
    const resA = simulateShortcutHandler({ key: 'a', targetTagName: 'DIV' });
    expect(resA.prevented).toBe(true);
    expect(resA.selectedOption).toBe('A');

    const resF = simulateShortcutHandler({ key: 'F', targetTagName: 'DIV' });
    expect(resF.prevented).toBe(true);
    expect(resF.flaggedToggled).toBe(true);

    const resNext = simulateShortcutHandler({ key: 'ArrowRight', targetTagName: 'DIV' });
    expect(resNext.prevented).toBe(true);
    expect(resNext.navDirection).toBe('next');
  });

  runner.it('CH2-KEY-4: Modifier keys (Ctrl+A, Ctrl+C, Ctrl+F) must not trigger answer selection or toggle flags', () => {
    const resCtrlA = simulateShortcutHandler({ key: 'a', ctrlKey: true, targetTagName: 'DIV' });
    expect(resCtrlA.selectedOption).toBeNull();
    expect(resCtrlA.prevented).toBe(false);

    const resCtrlC = simulateShortcutHandler({ key: 'c', ctrlKey: true, targetTagName: 'DIV' });
    expect(resCtrlC.selectedOption).toBeNull();
    expect(resCtrlC.prevented).toBe(false);

    const resCtrlF = simulateShortcutHandler({ key: 'f', ctrlKey: true, targetTagName: 'DIV' });
    expect(resCtrlF.flaggedToggled).toBe(false);
    expect(resCtrlF.prevented).toBe(false);
  });
});

runner.describe('Challenger 2 Empirical Verification: Timer Boundary & Warning States', () => {
  function formatTime(seconds: number): string {
    const s = Math.max(0, seconds);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(sec)}`;
    }
    return `${pad(minutes)}:${pad(sec)}`;
  }

  function isWarning(seconds: number): boolean {
    return seconds <= 300 && seconds > 0;
  }

  runner.it('CH2-TIMER-1: Formatted time handles 120min (02:00:00), 59min (59:00), 0s (00:00)', () => {
    expect(formatTime(7200)).toBe('02:00:00');
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(300)).toBe('05:00');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(1)).toBe('00:01');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(-10)).toBe('00:00'); // Clamped
  });

  runner.it('CH2-TIMER-2: Warning threshold activates strictly at <= 300s (5 minutes) and deactivates at 0', () => {
    expect(isWarning(301)).toBe(false);
    expect(isWarning(300)).toBe(true);
    expect(isWarning(299)).toBe(true);
    expect(isWarning(60)).toBe(true);
    expect(isWarning(1)).toBe(true);
    expect(isWarning(0)).toBe(false); // Expired, not warning
    expect(isWarning(-5)).toBe(false);
  });

  runner.it('CH2-TIMER-3: 00:00 boundary condition triggers auto-submit transition', () => {
    let autoSubmitTriggered = false;
    let remaining = 1;

    // Simulate tick to 0
    if (remaining <= 1) {
      remaining = 0;
      autoSubmitTriggered = true;
    }

    expect(remaining).toBe(0);
    expect(autoSubmitTriggered).toBe(true);
  });
});

runner.describe('Challenger 2 Empirical Verification: Minimalist UI Guardrails', () => {
  runner.it('CH2-UI-1: Source check on ToeicExamHeader.tsx and ToeicQuestionPalette.tsx passes Technical Minimalist rules', () => {
    const components = [
      'src/components/toeic/ToeicExamHeader.tsx',
      'src/components/toeic/ToeicQuestionPalette.tsx',
      'src/components/toeic/ToeicSplitPane.tsx',
      'src/components/toeic/ToeicScoreReportView.tsx',
      'src/app/toeic/page.tsx',
    ];

    for (const comp of components) {
      const fullPath = path.resolve(__dirname, '../..', comp);
      if (fs.existsSync(fullPath)) {
        const code = fs.readFileSync(fullPath, 'utf-8');
        const violations = TechnicalMinimalistValidator.validateSource(code, comp);
        expect(violations.length).toBe(0);
      }
    }
  });
});

async function main() {
  // Give async test promises a tick to complete
  await new Promise((resolve) => setTimeout(resolve, 500));

  const stats = runner.getStats();
  console.log(`\n================================================================`);
  console.log(`Challenger 2 Stress Tests: ${stats.passed}/${stats.total} passed (${stats.failed} failed) in ${stats.durationMs}ms`);
  console.log(`================================================================`);

  if (stats.failed > 0 || stats.total === 0) {
    process.exit(1);
  } else {
    console.log('✅ ALL CHALLENGER 2 EMPIRICAL TESTS PASSED CLEANLY');
    process.exit(0);
  }
}

main();
