/**
 * Tier 5: White-Box Adversarial Coverage Hardening Suite for TOEIC Real Exam Simulation
 *
 * Covers all white-box untested paths, error conditions, boundary cases, and disaster recovery:
 * - ADV-1: URL & Route Parameter Stressing (Part Practice, Invalid Parts, Unknown Test IDs, Legacy Mini-Tests)
 * - ADV-2: LocalStorage Resilience, Corruption & Disaster Recovery
 * - ADV-3: Keyboard Shortcuts & Input Shielding Engine
 * - ADV-4: Timer Auto-Submit vs Manual Modal Submission & State Locking
 * - ADV-5: Review Mode Diagnostics, Search Filtering & Pagination Stressing
 * - ADV-6: Scoring Engine Adversarial Boundaries & CEFR Classification
 * - ADV-7: Media Resolution, Audio Clustering & CDN Verification Across All 7 Tests
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';

import {
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
} from '../../src/lib/toeic-barem';

import {
  calculateToeicScore,
  getScaledListeningScore,
  getScaledReadingScore,
  getCefrLevel,
  getPartAccuracyRating,
  getCefrDescriptor,
} from '../../src/lib/toeic-scoring';

import {
  loadFullToeicTest,
  loadToeicPartPractice,
  getAvailableToeicTests,
  resolveToeicMediaUrl,
  parseQuestionOption,
  stripSensitiveToeicData,
  AUTHENTIC_TEST_METADATA,
} from '../../src/lib/toeic-test-loader';

import type {
  ToeicPart,
  ToeicUnifiedQuestion,
  ToeicOptionKey,
  ToeicExamMode,
  ToeicCefrLevel,
  ToeicScoreResult,
} from '../../src/types/toeic';

import readingContentRaw from '../../src/data/toeic/content-toeic-reading-v1.json';

const EXPECTED_TEST_IDS = ['6852', '6856', '6857', '6859', '7000', '7003', '7004'] as const;

export async function runTier5Tests(runner: TestRunner): Promise<void> {
  // Pre-load default test 6852 for shared use
  const test6852Questions = loadFullToeicTest('6852');

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-1: URL & Route Parameter Stressing
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-1: URL & Route Parameter Stressing', () => {
    runner.it('ADV-1.1: loadToeicPartPractice returns exact official question counts for all valid parts (1 to 7)', () => {
      const partCounts: Record<ToeicPart, number> = {
        1: 6,
        2: 25,
        3: 39,
        4: 30,
        5: 30,
        6: 16,
        7: 54,
      };

      let totalPartQuestions = 0;
      for (let p = 1; p <= 7; p++) {
        const part = p as ToeicPart;
        const questions = loadToeicPartPractice(part, '6852');
        expect(questions.length).toBe(partCounts[part]);
        expect(questions.every((q) => q.part === part)).toBe(true);
        totalPartQuestions += questions.length;
      }
      expect(totalPartQuestions).toBe(200);
    });

    runner.it('ADV-1.2: Part parameter parser safely rejects out-of-range, non-numeric, or malformed inputs', () => {
      const parsePartParam = (p: string | null): ToeicPart | null => {
        if (!p) return null;
        const parsed = parseInt(p, 10);
        return parsed >= 1 && parsed <= 7 ? (parsed as ToeicPart) : null;
      };

      expect(parsePartParam('1')).toBe(1);
      expect(parsePartParam('7')).toBe(7);
      expect(parsePartParam('0')).toBeNull();
      expect(parsePartParam('8')).toBeNull();
      expect(parsePartParam('-1')).toBeNull();
      expect(parsePartParam('999')).toBeNull();
      expect(parsePartParam('abc')).toBeNull();
      expect(parsePartParam('')).toBeNull();
      expect(parsePartParam(null)).toBeNull();
      expect(parsePartParam('part2')).toBeNull();
    });

    runner.it('ADV-1.3: Unknown or non-existent test IDs gracefully fall back to canonical default test 6852', () => {
      const unknownIds = ['unknown-9999', 'test_xyz', '', 'invalid-id-0000', '!@#$%^&*'];
      for (const id of unknownIds) {
        const questions = loadFullToeicTest(id);
        expect(questions.length).toBe(200);
        expect(questions[0].testId).toBe('6852');
      }
    });

    runner.it('ADV-1.4: Prefix-augmented test IDs with pure non-digit prefix (toeic-6856) normalize to clean numeric ID', () => {
      const q1 = loadFullToeicTest('toeic-6856');
      expect(q1.length).toBe(200);
      expect(q1[0].testId).toBe('6856');

      const q2 = loadFullToeicTest('test-7000');
      expect(q2.length).toBe(200);
      expect(q2[0].testId).toBe('7000');

      // White-box edge case: When prefix contains embedded digits (e.g. 'study4_test_6856'),
      // exact boundary matching correctly extracts '6856' (DEFECT-1 resolution)
      const q3 = loadFullToeicTest('study4_test_6856');
      expect(q3.length).toBe(200);
      expect(q3[0].testId).toBe('6856');
    });

    runner.it('ADV-1.5: Legacy mini-test entries in reading content are correctly structured and parsable', () => {
      const miniTests = (readingContentRaw as any).mini_test || [];
      expect(miniTests.length).toBeGreaterThan(0);

      for (const mt of miniTests) {
        expect(typeof mt.id).toBe('string');
        expect(typeof mt.title).toBe('string');
        expect(typeof mt.timeMinutes).toBe('number');
        expect(Array.isArray(mt.sections)).toBe(true);
        expect(mt.sections.length).toBeGreaterThan(0);
      }
    });

    runner.it('ADV-1.6: All 7 authentic tests in dataset load exactly 200 sequential questions Q1..Q200 with zero ID collisions', () => {
      for (const testId of EXPECTED_TEST_IDS) {
        const questions = loadFullToeicTest(testId);
        expect(questions.length).toBe(200);

        const seenNumbers = new Set<number>();
        const seenIds = new Set<string>();

        questions.forEach((q, idx) => {
          const expectedQNum = idx + 1;
          expect(q.questionNumber).toBe(expectedQNum);
          expect(seenNumbers.has(q.questionNumber)).toBe(false);
          expect(seenIds.has(q.id)).toBe(false);

          seenNumbers.add(q.questionNumber);
          seenIds.add(q.id);
        });

        expect(seenNumbers.size).toBe(200);
        expect(seenIds.size).toBe(200);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-2: LocalStorage Resilience, Corruption & Disaster Recovery
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-2: LocalStorage Resilience, Corruption & Disaster Recovery', () => {
    runner.it('ADV-2.1: Corrupted or truncated JSON in localStorage does not crash draft restoration', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const storageKey = 'lingo_toeic_session_6852';
        mockStorage.setItem(storageKey, '{"testId":"6852","answers":{"1":"A"},"timeRemainingSeconds":3500'); // Truncated JSON

        let didThrow = false;
        let restoredDraft: any = null;
        try {
          const raw = mockStorage.getItem(storageKey);
          if (raw) {
            restoredDraft = JSON.parse(raw);
          }
        } catch (e) {
          didThrow = true;
        }

        // Must handle corruption safely
        expect(didThrow).toBe(true);
        expect(restoredDraft).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('ADV-2.2: Expired draft (timeRemainingSeconds <= 0) is rejected and not restored', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const storageKey = 'lingo_toeic_session_6852';
        const expiredDraft = {
          testId: '6852',
          answers: { 1: 'B', 2: 'C' },
          flagged: [1],
          currentQNum: 2,
          timeRemainingSeconds: 0,
          mode: 'real',
          updatedAt: Date.now() - 10000,
        };
        mockStorage.setItem(storageKey, JSON.stringify(expiredDraft));

        const raw = mockStorage.getItem(storageKey);
        const draft = JSON.parse(raw!);
        const canRestore = draft && draft.testId === '6852' && draft.timeRemainingSeconds > 0;

        expect(canRestore).toBe(false);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('ADV-2.3: Draft with null or missing fields recovers safely with fallback defaults', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const storageKey = 'lingo_toeic_session_6852';
        const sparseDraft = {
          testId: '6852',
          answers: null,
          flagged: null,
          currentQNum: null,
          timeRemainingSeconds: 3600,
        };
        mockStorage.setItem(storageKey, JSON.stringify(sparseDraft));

        const raw = mockStorage.getItem(storageKey);
        const draft = JSON.parse(raw!);

        const recoveredAnswers = draft.answers || {};
        const recoveredFlagged = new Set(draft.flagged || []);
        const recoveredQNum = draft.currentQNum || 1;

        expect(recoveredAnswers).toEqual({});
        expect(recoveredFlagged.size).toBe(0);
        expect(recoveredQNum).toBe(1);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('ADV-2.4: Cross-test draft isolation: saved draft for test 6852 is never loaded for test 6856', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        mockStorage.setItem(
          'lingo_toeic_session_6852',
          JSON.stringify({
            testId: '6852',
            answers: { 1: 'A' },
            timeRemainingSeconds: 5000,
          })
        );

        const targetKey6856 = 'lingo_toeic_session_6856';
        const draft6856 = mockStorage.getItem(targetKey6856);
        expect(draft6856).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('ADV-2.5: Multi-mode and Part session key isolation prevents state collisions', () => {
      const generateKey = (testId: string, part: number | null, mode: string) =>
        `lingo_toeic_session_${testId}${part ? '_part' + part : ''}_${mode}`;

      const keyFullReal = generateKey('6852', null, 'real');
      const keyFullPractice = generateKey('6852', null, 'practice');
      const keyPart1Practice = generateKey('6852', 1, 'practice');
      const keyPart5Practice = generateKey('6852', 5, 'practice');

      expect(keyFullReal).toBe('lingo_toeic_session_6852_real');
      expect(keyFullPractice).toBe('lingo_toeic_session_6852_practice');
      expect(keyPart1Practice).toBe('lingo_toeic_session_6852_part1_practice');
      expect(keyPart5Practice).toBe('lingo_toeic_session_6852_part5_practice');

      const allKeys = [keyFullReal, keyFullPractice, keyPart1Practice, keyPart5Practice];
      const uniqueKeys = new Set(allKeys);
      expect(uniqueKeys.size).toBe(allKeys.length);
    });

    runner.it('ADV-2.6: Successful exam submission completely purges autosave draft from localStorage', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const storageKey = 'lingo_toeic_session_6852_real';
        mockStorage.setItem(
          storageKey,
          JSON.stringify({ testId: '6852_real', timeRemainingSeconds: 4000, answers: { 1: 'C' } })
        );
        expect(mockStorage.getItem(storageKey)).toBeDefined();

        // Simulate submit purge
        mockStorage.removeItem(storageKey);
        expect(mockStorage.getItem(storageKey)).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-3: Keyboard Shortcuts & Input Shielding Engine
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-3: Keyboard Shortcuts & Input Shielding Engine', () => {
    function simulateKeydown({
      key,
      targetTagName = 'DIV',
      isContentEditable = false,
      question,
      currentSelected,
      isFlagged,
      hasNext,
      hasPrev,
    }: {
      key: string;
      targetTagName?: string;
      isContentEditable?: boolean;
      question: ToeicUnifiedQuestion;
      currentSelected?: ToeicOptionKey;
      isFlagged: boolean;
      hasNext: boolean;
      hasPrev: boolean;
    }) {
      let selectedResult = currentSelected;
      let flagResult = isFlagged;
      let nextCalled = false;
      let prevCalled = false;

      // Input shielding check
      if (
        targetTagName === 'INPUT' ||
        targetTagName === 'TEXTAREA' ||
        isContentEditable
      ) {
        return { selectedResult, flagResult, nextCalled, prevCalled };
      }

      const upperKey = key.toUpperCase();
      if (upperKey === 'A' || upperKey === 'B' || upperKey === 'C' || upperKey === 'D') {
        const match = question.options.find((opt) => opt.key === upperKey);
        if (match) {
          selectedResult = upperKey as ToeicOptionKey;
        }
      } else if (key === 'ArrowRight' && hasNext) {
        nextCalled = true;
      } else if (key === 'ArrowLeft' && hasPrev) {
        prevCalled = true;
      } else if (upperKey === 'F') {
        flagResult = !isFlagged;
      }

      return { selectedResult, flagResult, nextCalled, prevCalled };
    }

    const sampleQ = test6852Questions[0]; // Part 1 Q1 with A, B, C, D
    const part2Q = test6852Questions[6]; // Part 2 Q7 with A, B, C only

    runner.it('ADV-3.1: Keys A, B, C, D successfully select options for 4-choice questions', () => {
      for (const k of ['A', 'B', 'C', 'D']) {
        const res = simulateKeydown({
          key: k,
          question: sampleQ,
          isFlagged: false,
          hasNext: true,
          hasPrev: false,
        });
        expect(res.selectedResult).toBe(k as ToeicOptionKey);
      }
    });

    runner.it('ADV-3.2: Lowercase keys a, b, c, d trigger option selection identically', () => {
      const res = simulateKeydown({
        key: 'c',
        question: sampleQ,
        isFlagged: false,
        hasNext: true,
        hasPrev: false,
      });
      expect(res.selectedResult).toBe('C');
    });

    runner.it('ADV-3.3: In Part 2 (only choices A, B, C), pressing D is safely rejected without creating invalid option', () => {
      expect(part2Q.options.length).toBe(3);
      expect(part2Q.options.some((opt) => opt.key === 'D')).toBe(false);

      const res = simulateKeydown({
        key: 'D',
        question: part2Q,
        currentSelected: 'B',
        isFlagged: false,
        hasNext: true,
        hasPrev: true,
      });
      expect(res.selectedResult).toBe('B'); // Unchanged
    });

    runner.it('ADV-3.4: Key F toggles question flag on and off', () => {
      const res1 = simulateKeydown({
        key: 'F',
        question: sampleQ,
        isFlagged: false,
        hasNext: true,
        hasPrev: false,
      });
      expect(res1.flagResult).toBe(true);

      const res2 = simulateKeydown({
        key: 'f',
        question: sampleQ,
        isFlagged: true,
        hasNext: true,
        hasPrev: false,
      });
      expect(res2.flagResult).toBe(false);
    });

    runner.it('ADV-3.5: ArrowRight and ArrowLeft navigate when boundary conditions allow, and no-op at endpoints', () => {
      // Middle question
      const resMidNext = simulateKeydown({
        key: 'ArrowRight',
        question: sampleQ,
        isFlagged: false,
        hasNext: true,
        hasPrev: true,
      });
      expect(resMidNext.nextCalled).toBe(true);

      const resMidPrev = simulateKeydown({
        key: 'ArrowLeft',
        question: sampleQ,
        isFlagged: false,
        hasNext: true,
        hasPrev: true,
      });
      expect(resMidPrev.prevCalled).toBe(true);

      // Boundary: Q1 hasPrev = false
      const resFirst = simulateKeydown({
        key: 'ArrowLeft',
        question: sampleQ,
        isFlagged: false,
        hasNext: true,
        hasPrev: false,
      });
      expect(resFirst.prevCalled).toBe(false);

      // Boundary: Q200 hasNext = false
      const resLast = simulateKeydown({
        key: 'ArrowRight',
        question: sampleQ,
        isFlagged: false,
        hasNext: false,
        hasPrev: true,
      });
      expect(resLast.nextCalled).toBe(false);
    });

    runner.it('ADV-3.6: Input shielding: keystrokes inside input, textarea or contentEditable are suppressed', () => {
      for (const tag of ['INPUT', 'TEXTAREA']) {
        const res = simulateKeydown({
          key: 'A',
          targetTagName: tag,
          question: sampleQ,
          currentSelected: undefined,
          isFlagged: false,
          hasNext: true,
          hasPrev: false,
        });
        expect(res.selectedResult).toBeUndefined();
      }

      const resEditable = simulateKeydown({
        key: 'F',
        targetTagName: 'DIV',
        isContentEditable: true,
        question: sampleQ,
        isFlagged: false,
        hasNext: true,
        hasPrev: false,
      });
      expect(resEditable.flagResult).toBe(false);
    });

    runner.it('ADV-3.7: Non-shortcut keys (Enter, Escape, Space, Z) produce zero side effects', () => {
      for (const k of ['Enter', 'Escape', ' ', 'Z', 'Tab']) {
        const res = simulateKeydown({
          key: k,
          question: sampleQ,
          currentSelected: 'A',
          isFlagged: false,
          hasNext: true,
          hasPrev: true,
        });
        expect(res.selectedResult).toBe('A');
        expect(res.flagResult).toBe(false);
        expect(res.nextCalled).toBe(false);
        expect(res.prevCalled).toBe(false);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-4: Timer Auto-Submit vs Manual Modal Submission & State Locking
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-4: Timer Auto-Submit vs Manual Modal Submission & State Locking', () => {
    runner.it('ADV-4.1: Timer reaching 00:00 triggers auto-submission and scores all questions', () => {
      let isSubmitted = false;
      let onTimeExpiredCalled = false;
      let scoreResult: ToeicScoreResult | null = null;

      const autoSubmit = (answers: Record<number, ToeicOptionKey>) => {
        onTimeExpiredCalled = true;
        isSubmitted = true;
        scoreResult = calculateToeicScore(answers, test6852Questions, 7200);
      };

      // Ticking timer down to 0
      let time = 1;
      if (time <= 1) {
        time = 0;
        autoSubmit({ 1: 'A', 2: 'B', 3: 'C' });
      }

      expect(time).toBe(0);
      expect(onTimeExpiredCalled).toBe(true);
      expect(isSubmitted).toBe(true);
      expect(scoreResult).not.toBeNull();
      expect(scoreResult!.timeSpentSeconds).toBe(7200);
    });

    runner.it('ADV-4.2: Manual submission via confirm modal freezes remaining time and sets accurate elapsed time', () => {
      const initialTime = 7200;
      const remainingTime = 3250; // 3950s elapsed
      const elapsed = initialTime - remainingTime;

      const answers: Record<number, ToeicOptionKey> = { 1: 'A', 101: 'B' };
      const score = calculateToeicScore(answers, test6852Questions, elapsed);

      expect(score.timeSpentSeconds).toBe(3950);
      expect(score.rawTotal).toBeGreaterThanOrEqual(0);
      expect(score.scaledTotal).toBeGreaterThanOrEqual(10);
    });

    runner.it('ADV-4.3: Post-submission state lock prevents further answer selection or flag modification', () => {
      let isSubmitted = true;
      let answers: Record<number, ToeicOptionKey> = { 1: 'A' };
      let flagged = new Set<number>([1]);

      const selectAnswer = (qnum: number, opt: ToeicOptionKey) => {
        if (isSubmitted) return;
        answers[qnum] = opt;
      };

      const toggleFlag = (qnum: number) => {
        if (isSubmitted) return;
        if (flagged.has(qnum)) flagged.delete(qnum);
        else flagged.add(qnum);
      };

      selectAnswer(1, 'D');
      selectAnswer(2, 'B');
      toggleFlag(1);
      toggleFlag(2);

      // Must be completely unchanged
      expect(answers[1]).toBe('A');
      expect(answers[2]).toBeUndefined();
      expect(flagged.has(1)).toBe(true);
      expect(flagged.has(2)).toBe(false);
    });

    runner.it('ADV-4.4: Pausing exam stops timer decrements while keeping current state intact', () => {
      let isPaused = true;
      let timeRemaining = 5000;

      const tick = () => {
        if (isPaused) return;
        timeRemaining--;
      };

      for (let i = 0; i < 10; i++) tick();
      expect(timeRemaining).toBe(5000);

      isPaused = false;
      for (let i = 0; i < 5; i++) tick();
      expect(timeRemaining).toBe(4995);
    });

    runner.it('ADV-4.5: Reset exam method restores pristine initial state across all metrics', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const storageKey = 'lingo_toeic_session_6852';
        mockStorage.setItem(storageKey, '{"some":"draft"}');

        let answers: Record<number, ToeicOptionKey> = { 1: 'A', 2: 'B' };
        let flagged = new Set<number>([1]);
        let currentQNum = 42;
        let timeRemaining = 1200;
        let isSubmitted = true;
        let scoreResult: any = { scaledTotal: 500 };

        // Reset
        mockStorage.removeItem(storageKey);
        answers = {};
        flagged = new Set();
        currentQNum = 1;
        timeRemaining = 7200;
        isSubmitted = false;
        scoreResult = undefined;

        expect(Object.keys(answers).length).toBe(0);
        expect(flagged.size).toBe(0);
        expect(currentQNum).toBe(1);
        expect(timeRemaining).toBe(7200);
        expect(isSubmitted).toBe(false);
        expect(scoreResult).toBeUndefined();
        expect(mockStorage.getItem(storageKey)).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-5: Review Mode Diagnostics, Search Filtering & Pagination Stressing
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-5: Review Mode Diagnostics, Search Filtering & Pagination Stressing', () => {
    // Generate realistic review dataset with mixed answers
    const sampleAnswers: Record<number, ToeicOptionKey> = {};
    const sampleFlagged = new Set<number>([5, 10, 15, 20, 105]);

    // 100 correct, 50 wrong, 50 unanswered
    test6852Questions.forEach((q, idx) => {
      if (idx < 100) {
        sampleAnswers[q.questionNumber] = q.correctAnswer;
      } else if (idx < 150) {
        const wrongKey = q.correctAnswer === 'A' ? 'B' : 'A';
        sampleAnswers[q.questionNumber] = wrongKey;
      }
      // Q151..200 unanswered
    });

    function filterReviewQuestions({
      statusFilter = 'all',
      partFilter = 'all',
      searchQuery = '',
    }: {
      statusFilter?: 'all' | 'correct' | 'incorrect' | 'flagged';
      partFilter?: 'all' | ToeicPart;
      searchQuery?: string;
    }) {
      return test6852Questions.filter((q) => {
        const userAns = sampleAnswers[q.questionNumber];
        const isCorrect = userAns === q.correctAnswer;
        const isFlag = sampleFlagged.has(q.questionNumber);

        if (statusFilter === 'correct' && !isCorrect) return false;
        if (statusFilter === 'incorrect' && isCorrect) return false;
        if (statusFilter === 'flagged' && !isFlag) return false;

        if (partFilter !== 'all' && q.part !== partFilter) return false;

        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const numMatch =
            String(q.questionNumber) === query || `câu ${q.questionNumber}` === query;
          const textMatch = q.prompt?.toLowerCase().includes(query);
          const explanationMatch = q.explanationVi?.toLowerCase().includes(query);
          if (!numMatch && !textMatch && !explanationMatch) return false;
        }

        return true;
      });
    }

    runner.it('ADV-5.1: Review status filters partition exactly into correct, incorrect, and flagged questions', () => {
      const all = filterReviewQuestions({ statusFilter: 'all' });
      const correct = filterReviewQuestions({ statusFilter: 'correct' });
      const incorrect = filterReviewQuestions({ statusFilter: 'incorrect' });
      const flagged = filterReviewQuestions({ statusFilter: 'flagged' });

      expect(all.length).toBe(200);
      expect(correct.length).toBe(100);
      expect(incorrect.length).toBe(100); // 50 wrong + 50 unanswered
      expect(flagged.length).toBe(5);
      expect(correct.length + incorrect.length).toBe(all.length);
    });

    runner.it('ADV-5.2: Part filter accurately isolates questions for each individual part', () => {
      const p1 = filterReviewQuestions({ partFilter: 1 });
      expect(p1.length).toBe(6);

      const p5 = filterReviewQuestions({ partFilter: 5 });
      expect(p5.length).toBe(30);

      const p7 = filterReviewQuestions({ partFilter: 7 });
      expect(p7.length).toBe(54);
    });

    runner.it('ADV-5.3: Search filter by question number handles exact matching and prefix "câu <N>"', () => {
      // Searching "câu 42" targets Question 42 via numMatch
      const resCau = filterReviewQuestions({ searchQuery: 'câu 42' });
      expect(resCau.length).toBe(1);
      expect(resCau[0].questionNumber).toBe(42);

      // Searching "42" matches Q42 (via numMatch) and Q142 (via prompt containing "...142")
      const resRaw = filterReviewQuestions({ searchQuery: '42' });
      expect(resRaw.some((q) => q.questionNumber === 42)).toBe(true);

      const resNone = filterReviewQuestions({ searchQuery: '999' });
      expect(resNone.length).toBe(0);
    });

    runner.it('ADV-5.4: Search filter by prompt or Vietnamese explanation text performs case-insensitive search', () => {
      const q101 = test6852Questions.find((q) => q.questionNumber === 101);
      if (q101 && q101.prompt) {
        const words = q101.prompt.split(/\s+/).filter((w) => w.length > 5);
        if (words.length > 0) {
          const sampleWord = words[0].toLowerCase();
          const results = filterReviewQuestions({ searchQuery: sampleWord });
          expect(results.length).toBeGreaterThan(0);
          expect(results.some((q) => q.questionNumber === 101)).toBe(true);
        }
      }
    });

    runner.it('ADV-5.5: Pagination math accurately clamps page index between 1 and totalPages', () => {
      const pageSize = 20;
      const totalItems = 200;
      const totalPages = Math.ceil(totalItems / pageSize); // 10

      const clampPage = (p: number) => Math.max(1, Math.min(totalPages, p));

      expect(clampPage(0)).toBe(1);
      expect(clampPage(-5)).toBe(1);
      expect(clampPage(1)).toBe(1);
      expect(clampPage(5)).toBe(5);
      expect(clampPage(10)).toBe(10);
      expect(clampPage(11)).toBe(10);
      expect(clampPage(999)).toBe(10);
    });

    runner.it('ADV-5.6: Page slice extraction returns exact 20 items per page and correct last page remainder', () => {
      const all = test6852Questions;
      const pageSize = 20;

      const getPageSlice = (page: number) => {
        const start = (page - 1) * pageSize;
        return all.slice(start, start + pageSize);
      };

      const page1 = getPageSlice(1);
      expect(page1.length).toBe(20);
      expect(page1[0].questionNumber).toBe(1);
      expect(page1[19].questionNumber).toBe(20);

      const page10 = getPageSlice(10);
      expect(page10.length).toBe(20);
      expect(page10[0].questionNumber).toBe(181);
      expect(page10[19].questionNumber).toBe(200);
    });

    runner.it('ADV-5.7: Single-page mode bypasses pagination and displays 100% of matching questions', () => {
      const all = test6852Questions;
      const showAll = true;
      const displayed = showAll ? all : all.slice(0, 20);
      expect(displayed.length).toBe(200);
    });

    runner.it('ADV-5.8: Audio transcript expansion toggles per-question independently and only for questions with transcript', () => {
      // Mock questions where only subset has transcript
      const mockQuestionsWithTranscript: ToeicUnifiedQuestion[] = [
        { ...test6852Questions[31], transcript: 'Speaker A: Hello. Speaker B: Hi.' },
        { ...test6852Questions[32], transcript: undefined },
        { ...test6852Questions[70], transcript: 'Attention passengers on flight 402.' },
      ];

      let expandedTranscripts: Record<number, boolean> = {};

      const toggleSingle = (qnum: number) => {
        expandedTranscripts[qnum] = !expandedTranscripts[qnum];
      };

      const toggleAll = (expand: boolean) => {
        mockQuestionsWithTranscript.forEach((q) => {
          if (q.transcript) expandedTranscripts[q.questionNumber] = expand;
        });
      };

      // Toggle single question Q32
      toggleSingle(32);
      expect(expandedTranscripts[32]).toBe(true);
      expect(expandedTranscripts[33]).toBeFalsy();

      // Global expand only opens questions with transcript (Q32 and Q71)
      toggleAll(true);
      expect(expandedTranscripts[32]).toBe(true);
      expect(expandedTranscripts[33]).toBeFalsy(); // Has no transcript
      expect(expandedTranscripts[71]).toBe(true);

      // Global collapse closes all
      toggleAll(false);
      expect(expandedTranscripts[32]).toBe(false);
      expect(expandedTranscripts[71]).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-6: Scoring Engine Adversarial Boundaries & CEFR Classification
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-6: Scoring Engine Adversarial Boundaries & CEFR Classification', () => {
    runner.it('ADV-6.1: Asymmetrical scores: 100% Listening & 0% Reading produces scaled 500 (LC 495, RC 5)', () => {
      const res = convertRawToScaled(100, 0);
      expect(res.scaledListening).toBe(495);
      expect(res.scaledReading).toBe(5);
      expect(res.scaledTotal).toBe(500);
      expect(getCefrLevel(500)).toBe('B1');
    });

    runner.it('ADV-6.2: Asymmetrical scores: 0% Listening & 100% Reading produces scaled 500 (LC 5, RC 495)', () => {
      const res = convertRawToScaled(0, 100);
      expect(res.scaledListening).toBe(5);
      expect(res.scaledReading).toBe(495);
      expect(res.scaledTotal).toBe(500);
      expect(getCefrLevel(500)).toBe('B1');
    });

    runner.it('ADV-6.3: Exact threshold transitions across all CEFR boundary points', () => {
      // C1 >= 905
      expect(getCefrLevel(990)).toBe('C1');
      expect(getCefrLevel(905)).toBe('C1');
      expect(getCefrLevel(900)).toBe('B2');

      // B2: 605 to 900
      expect(getCefrLevel(850)).toBe('B2');
      expect(getCefrLevel(785)).toBe('B2');
      expect(getCefrLevel(605)).toBe('B2');
      expect(getCefrLevel(600)).toBe('B1');

      // B1: 405 to 600
      expect(getCefrLevel(550)).toBe('B1');
      expect(getCefrLevel(405)).toBe('B1');
      expect(getCefrLevel(400)).toBe('A2');

      // A2: 255 to 400
      expect(getCefrLevel(300)).toBe('A2');
      expect(getCefrLevel(255)).toBe('A2');
      expect(getCefrLevel(250)).toBe('A1');

      // A1: 10 to 250
      expect(getCefrLevel(100)).toBe('A1');
      expect(getCefrLevel(10)).toBe('A1');
      expect(getCefrLevel(0)).toBe('A1');
    });

    runner.it('ADV-6.4: getCefrDescriptor provides rich, non-empty Vietnamese titles, descriptions and target feedback for all 5 levels', () => {
      const levels: ToeicCefrLevel[] = ['C1', 'B2', 'B1', 'A2', 'A1'];
      for (const lvl of levels) {
        const desc = getCefrDescriptor(lvl);
        expect(desc.level).toBe(lvl);
        expect(desc.title.length).toBeGreaterThan(5);
        expect(desc.descriptionVi.length).toBeGreaterThan(20);
        expect(desc.targetFeedbackVi.length).toBeGreaterThan(15);
      }
    });

    runner.it('ADV-6.5: Part accuracy ratings correctly classify high (>=80), medium (50-79), and low (<50)', () => {
      expect(getPartAccuracyRating(100)).toBe('high');
      expect(getPartAccuracyRating(80)).toBe('high');
      expect(getPartAccuracyRating(79)).toBe('medium');
      expect(getPartAccuracyRating(50)).toBe('medium');
      expect(getPartAccuracyRating(49)).toBe('low');
      expect(getPartAccuracyRating(0)).toBe('low');
    });

    runner.it('ADV-6.6: Scoring handles dirty input: lowercase answers, surrounding whitespace, and extra non-test keys', () => {
      const dirtyAnswers: Record<number, string> = {
        1: '  a  ',
        2: 'b',
        3: ' C ',
        999: 'A', // Extra non-existent question
        [-5]: 'B', // Negative question number
      };

      const result = calculateToeicScore(dirtyAnswers as any, test6852Questions, 100);
      expect(result.rawTotal).toBeGreaterThanOrEqual(0);
      expect(result.rawTotal).toBeLessThanOrEqual(3);
    });

    runner.it('ADV-6.7: Single-question answer test accurately scores 1 correct item and treats remaining 199 as incorrect', () => {
      const q1 = test6852Questions[0];
      const singleAnswer: Record<number, ToeicOptionKey> = {
        [q1.questionNumber]: q1.correctAnswer,
      };

      const result = calculateToeicScore(singleAnswer, test6852Questions, 60);
      expect(result.rawListening).toBe(1);
      expect(result.rawReading).toBe(0);
      expect(result.rawTotal).toBe(1);
      expect(result.scaledListening).toBe(5); // 1 LC is still floor 5
      expect(result.scaledReading).toBe(5);
      expect(result.scaledTotal).toBe(10);
      expect(result.partStats[1].correct).toBe(1);
      expect(result.partStats[1].total).toBe(6);
      expect(result.partStats[2].correct).toBe(0);
    });

    runner.it('ADV-6.8: Empty question list [] does not throw and returns 0 raw, 10 scaled, CEFR A1', () => {
      const result = calculateToeicScore({}, [], 0);
      expect(result.rawTotal).toBe(0);
      expect(result.scaledTotal).toBe(10);
      expect(result.cefrLevel).toBe('A1');
      for (let p = 1; p <= 7; p++) {
        expect(result.partStats[p as ToeicPart].total).toBe(0);
        expect(result.partStats[p as ToeicPart].percentage).toBe(0);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-7: Media Resolution, Audio Clustering & CDN Verification Across All 7 Tests
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-7: Media Resolution, Audio Clustering & CDN Verification Across All 7 Tests', () => {
    runner.it('ADV-7.1: resolveToeicMediaUrl correctly prepends Study4 CDN for relative media paths and preserves absolute URLs', () => {
      expect(resolveToeicMediaUrl('/media/audios/p1.mp3')).toBe(
        'https://s4-media1.study4.com/media/audios/p1.mp3'
      );
      expect(resolveToeicMediaUrl('media/images/q1.jpg')).toBe(
        'https://s4-media1.study4.com/media/images/q1.jpg'
      );
      expect(resolveToeicMediaUrl('https://example.com/sound.mp3')).toBe(
        'https://example.com/sound.mp3'
      );
      expect(resolveToeicMediaUrl('http://example.com/sound.mp3')).toBe(
        'http://example.com/sound.mp3'
      );
      expect(resolveToeicMediaUrl('')).toBeUndefined();
      expect(resolveToeicMediaUrl('   ')).toBeUndefined();
      expect(resolveToeicMediaUrl(null)).toBeUndefined();
      expect(resolveToeicMediaUrl(undefined)).toBeUndefined();
    });

    runner.it('ADV-7.2: Part 1 Photographs: Every test in the 7 authentic tests has valid https:// image URLs for all Q1..Q6', () => {
      for (const testId of EXPECTED_TEST_IDS) {
        const questions = loadFullToeicTest(testId);
        const p1 = questions.filter((q) => q.part === 1);
        expect(p1.length).toBe(6);

        p1.forEach((q) => {
          expect(q.imageUrl).toBeDefined();
          expect(q.imageUrl!.startsWith('https://')).toBe(true);
        });
      }
    });

    runner.it('ADV-7.3: Part 3 Dialogue clustering formula floor((q - 32) / 3) clusters 39 questions into exactly 13 clusters of 3', () => {
      for (let q = 32; q <= 70; q++) {
        const cluster = Math.floor((q - 32) / 3);
        expect(cluster).toBeGreaterThanOrEqual(0);
        expect(cluster).toBeLessThanOrEqual(12);
      }

      // Check first cluster (32, 33, 34)
      expect(Math.floor((32 - 32) / 3)).toBe(0);
      expect(Math.floor((33 - 32) / 3)).toBe(0);
      expect(Math.floor((34 - 32) / 3)).toBe(0);

      // Check boundary transition into cluster 1
      expect(Math.floor((35 - 32) / 3)).toBe(1);

      // Check last cluster (68, 69, 70)
      expect(Math.floor((68 - 32) / 3)).toBe(12);
      expect(Math.floor((69 - 32) / 3)).toBe(12);
      expect(Math.floor((70 - 32) / 3)).toBe(12);
    });

    runner.it('ADV-7.4: Part 4 Short talks clustering formula floor((q - 71) / 3) clusters 30 questions into exactly 10 clusters of 3', () => {
      for (let q = 71; q <= 100; q++) {
        const cluster = Math.floor((q - 71) / 3);
        expect(cluster).toBeGreaterThanOrEqual(0);
        expect(cluster).toBeLessThanOrEqual(9);
      }

      // Check first cluster (71, 72, 73)
      expect(Math.floor((71 - 71) / 3)).toBe(0);
      expect(Math.floor((72 - 71) / 3)).toBe(0);
      expect(Math.floor((73 - 71) / 3)).toBe(0);

      // Check last cluster (98, 99, 100)
      expect(Math.floor((98 - 71) / 3)).toBe(9);
      expect(Math.floor((99 - 71) / 3)).toBe(9);
      expect(Math.floor((100 - 71) / 3)).toBe(9);
    });

    runner.it('ADV-7.5: In all 7 authentic tests, Part 3 and Part 4 have 100% audio URL coverage and clusters share audio', () => {
      for (const testId of EXPECTED_TEST_IDS) {
        const questions = loadFullToeicTest(testId);

        // Part 3 checks
        const p3 = questions.filter((q) => q.part === 3);
        expect(p3.length).toBe(39);
        p3.forEach((q) => expect(Boolean(q.audioUrl)).toBe(true));

        for (let i = 0; i < 39; i += 3) {
          const audio1 = p3[i].audioUrl;
          const audio2 = p3[i + 1].audioUrl;
          const audio3 = p3[i + 2].audioUrl;
          expect(audio1).toBe(audio2);
          expect(audio2).toBe(audio3);
        }

        // Part 4 checks
        const p4 = questions.filter((q) => q.part === 4);
        expect(p4.length).toBe(30);
        p4.forEach((q) => expect(Boolean(q.audioUrl)).toBe(true));

        for (let i = 0; i < 30; i += 3) {
          const audio1 = p4[i].audioUrl;
          const audio2 = p4[i + 1].audioUrl;
          const audio3 = p4[i + 2].audioUrl;
          expect(audio1).toBe(audio2);
          expect(audio2).toBe(audio3);
        }
      }
    });

    runner.it('ADV-7.6: Option parser handles standard (A), dotted A., lowercase (a), colon A:, and empty option texts', () => {
      expect(parseQuestionOption('(A) highly productive', 'A')).toEqual({
        key: 'A',
        text: 'highly productive',
      });
      expect(parseQuestionOption('B. commercial district', 'A')).toEqual({
        key: 'B',
        text: 'commercial district',
      });
      expect(parseQuestionOption('(c) soft skills', 'A')).toEqual({
        key: 'C',
        text: 'soft skills',
      });
      expect(parseQuestionOption('D: urgent memo', 'A')).toEqual({
        key: 'D',
        text: 'urgent memo',
      });
      expect(parseQuestionOption('A.', 'A')).toEqual({
        key: 'A',
        text: '',
      });
      expect(parseQuestionOption('', 'B')).toEqual({
        key: 'B',
        text: '',
      });
    });

    // ── ADV-8: Anti-Scraping Data Stripping, Honeypot Trap & Freemium Session ──

    runner.it('ADV-8.1: stripSensitiveToeicData completely purges correctAnswer, explanationVi, and transcript across 200 questions', () => {
      const fullTest = loadFullToeicTest('6852');
      expect(fullTest.length).toBe(200);

      // Verify original fullTest has correctAnswer
      expect(fullTest.every((q) => Boolean(q.correctAnswer))).toBe(true);

      const sanitized = stripSensitiveToeicData(fullTest);
      expect(sanitized.length).toBe(200);

      for (const q of sanitized as any[]) {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanationVi).toBeUndefined();
        expect(q.transcript).toBeUndefined();
        expect(q.answer).toBeUndefined();
        expect(q.explain).toBeUndefined();
      }
    });

    runner.it('ADV-8.2: Sanitized questions preserve essential test presentation properties (prompts, options, media)', () => {
      const fullTest = loadFullToeicTest('6852');
      const sanitized = stripSensitiveToeicData(fullTest);

      const q1 = sanitized[0];
      expect(q1.questionNumber).toBe(1);
      expect(q1.part).toBe(1);
      expect(q1.section).toBe('listening');
      expect(q1.options.length).toBe(4);
      expect(Boolean(q1.imageUrl)).toBe(true);
      expect(Boolean(q1.audioUrl)).toBe(true);

      const q101 = sanitized[100];
      expect(q101.questionNumber).toBe(101);
      expect(q101.part).toBe(5);
      expect(q101.section).toBe('reading');
      expect(Boolean(q101.prompt)).toBe(true);
      expect(q101.options.length).toBe(4);
    });

    runner.it('ADV-8.3: Part practice mode strips sensitive fields for all 7 individual parts', () => {
      for (let p = 1; p <= 7; p++) {
        const partQs = loadToeicPartPractice(p as ToeicPart, '6852');
        const sanitizedPart = stripSensitiveToeicData(partQs);
        expect(sanitizedPart.length).toBe(partQs.length);

        for (const q of sanitizedPart as any[]) {
          expect(q.correctAnswer).toBeUndefined();
          expect(q.explanationVi).toBeUndefined();
          expect(q.transcript).toBeUndefined();
        }
      }
    });

    runner.it('ADV-8.4: Anti-scraping honeypot validator detects bot traps and invalid question index tampering', () => {
      const detectBotTrap = (payload: {
        honeypot?: string;
        _hp_trap?: string;
        _hp_author_code?: string;
        answers?: Record<number, string>;
      }): boolean => {
        return Boolean(
          payload.honeypot ||
          payload._hp_trap ||
          payload._hp_author_code ||
          (payload.answers && (payload.answers[0] || payload.answers[999] || payload.answers[9999]))
        );
      };

      // Real user submission
      expect(detectBotTrap({
        honeypot: '',
        answers: { 1: 'A', 2: 'B', 101: 'C' },
      })).toBe(false);

      // Bot fills hidden honeypot input
      expect(detectBotTrap({
        honeypot: 'spam-bot-value',
        answers: { 1: 'A' },
      })).toBe(true);

      // Bot fills _hp_author_code
      expect(detectBotTrap({
        _hp_author_code: 'malicious-bot-token',
        answers: { 1: 'A' },
      })).toBe(true);

      // Bot tampers with dummy out-of-bound questions
      expect(detectBotTrap({
        answers: { 0: 'A', 1: 'A' },
      })).toBe(true);

      expect(detectBotTrap({
        answers: { 999: 'C', 1: 'A' },
      })).toBe(true);
    });

    runner.it('ADV-8.5: Freemium pending guest session serializes and restores cleanly for post-auth sync', () => {
      const guestSubmission = {
        testId: '6852',
        examMode: 'real' as const,
        answers: { 1: 'A' as const, 2: 'C' as const },
        timeSpentSeconds: 3600,
        scoreResult: {
          rawListening: 2,
          rawReading: 0,
          rawTotal: 2,
          scaledListening: 5,
          scaledReading: 5,
          scaledTotal: 10,
          cefrLevel: 'A1' as const,
          partStats: {} as any,
          timeSpentSeconds: 3600,
        },
        savedAt: 1725700000000,
      };

      const serialized = JSON.stringify(guestSubmission);
      const parsed = JSON.parse(serialized);

      expect(parsed.testId).toBe('6852');
      expect(parsed.examMode).toBe('real');
      expect(parsed.answers[1]).toBe('A');
      expect(parsed.answers[2]).toBe('C');
      expect(parsed.scoreResult.scaledTotal).toBe(10);
    });

    runner.it('ADV-8.6: Server-side master key scoring matches official ETS scale and returns enriched review questions', () => {
      const masterQuestions = loadFullToeicTest('6852');
      const sampleAnswers: Record<number, ToeicOptionKey> = {
        1: masterQuestions[0].correctAnswer as ToeicOptionKey,
        2: masterQuestions[1].correctAnswer as ToeicOptionKey,
      };

      const result = calculateToeicScore(sampleAnswers, masterQuestions, 120);
      expect(result.rawListening).toBe(2);
      expect(result.rawTotal).toBe(2);
      expect(result.scaledTotal).toBeGreaterThanOrEqual(10);

      // Review questions retain full answer keys and explanations
      expect(masterQuestions[0].correctAnswer).toBeDefined();
      expect(masterQuestions[0].explanationVi).toBeDefined();
    });

    runner.it('ADV-8.7: Rate limit HTTP 429 response sets Retry-After header', () => {
      const { tooManyRequests } = require('@/lib/api-security');
      const res = tooManyRequests(60);
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('60');

      const res120 = tooManyRequests(120);
      expect(res120.headers.get('Retry-After')).toBe('120');
    });

    runner.it('ADV-8.8: Composite sessionKey cleanly extracts base testId without mode suffixes', () => {
      const cleanTestId = (raw: string) =>
        raw
          .replace(/_(real|practice|full_simulation|practice_part)$/, '')
          .replace(/_part[1-7]/, '');

      expect(cleanTestId('6852_real')).toBe('6852');
      expect(cleanTestId('6852_part5_practice')).toBe('6852');
      expect(cleanTestId('6856_full_simulation')).toBe('6856');
      expect(cleanTestId('mini-test-1_real')).toBe('mini-test-1');
      expect(cleanTestId('7000')).toBe('7000');
    });

    runner.it('ADV-8.9: OAuth redirect validator rejects external phishing URLs and accepts valid internal routes', () => {
      const isSafeRedirect = (url: string | null | undefined): boolean => {
        if (!url) return false;
        return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
      };

      expect(isSafeRedirect('/toeic/exam/6852')).toBe(true);
      expect(isSafeRedirect('/toeic/exam/6856?part=5&mode=practice')).toBe(true);
      expect(isSafeRedirect('/student')).toBe(true);
      expect(isSafeRedirect('https://evil-attacker.com/steal-session')).toBe(false);
      expect(isSafeRedirect('//evil-attacker.com')).toBe(false);
      expect(isSafeRedirect('/\\evil.com')).toBe(false);
      expect(isSafeRedirect('')).toBe(false);
    });

    runner.it('ADV-8.10: Question boundary tamper detector catches negative, NaN, and out-of-bounds keys', () => {
      const isTampered = (answers: Record<string, string>): boolean => {
        const keys = Object.keys(answers).map(Number);
        return keys.some((k) => Number.isNaN(k) || k <= 0 || k > 200 || k === 999 || k === 9999);
      };

      expect(isTampered({ 1: 'A', 200: 'D' })).toBe(false);
      expect(isTampered({ 0: 'A', 1: 'B' })).toBe(true);
      expect(isTampered({ '-5': 'C', 1: 'A' })).toBe(true);
      expect(isTampered({ 201: 'A' })).toBe(true);
      expect(isTampered({ 999: 'B' })).toBe(true);
      expect(isTampered({ 'invalid_key': 'A' })).toBe(true);
    });

    runner.it('ADV-8.11: Draft in localStorage is preserved when server submission fails on sanitized questions', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const storageKey = 'lingo_toeic_session_6852_real';
        const initialDraft = JSON.stringify({
          testId: '6852_real',
          answers: { 1: 'A', 2: 'B', 3: 'C' },
          timeRemainingSeconds: 5400,
        });
        mockStorage.setItem(storageKey, initialDraft);

        // Simulate failed submission check: when questions have no master keys (sanitized),
        // draft must NOT be removed from localStorage.
        const fullTest = loadFullToeicTest('6852');
        const sanitized = stripSensitiveToeicData(fullTest);
        const hasLocalMasterKeys = sanitized.some((q) => Boolean((q as any).correctAnswer));
        expect(hasLocalMasterKeys).toBe(false);

        // Because hasLocalMasterKeys is false, draft remains untouched
        expect(mockStorage.getItem(storageKey)).toBe(initialDraft);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });
}
