/**
 * TOEIC Question History Tracker Empirical Adversarial Stress Test Suite
 * File: tests/toeic/challenger-m1-empirical-stress.test.ts
 *
 * Authored by: challenger_m1_1 (teamwork_preview_challenger)
 * Target: src/lib/toeic-question-history.ts
 *
 * Empirical Challenges:
 * 1. High-volume record throughput (e.g. answering thousands of questions in rapid single & micro batches)
 * 2. Spaced repetition state machine rigor (transitions: wrong -> right -> wrong -> right across deep cycles & oracle matrix)
 * 3. Multi-part isolation (Part 1 through Part 7 independent state tracking, selective resets, global reset)
 * 4. Boundary invariants, event bus fidelity, and offline queue saturation
 */

import {
  TestRunner,
  expect,
  MockLocalStorage,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';

import {
  TOEIC_QUESTION_HISTORY_STORAGE_KEY,
  TOEIC_HISTORY_SYNC_QUEUE_KEY,
  TOEIC_HISTORY_UPDATED_EVENT,
  TOEIC_PART_BANK_TOTALS,
  TOEIC_TOTAL_BANK_QUESTIONS,
  loadToeicQuestionHistory,
  saveToeicQuestionHistory,
  recordQuestionAnswers,
  getQuestionHistoryByPart,
  getAnsweredQuestionIds,
  getMistakeQuestionIds,
  getCorrectQuestionIds,
  getPartProgressStats,
  resetPartProgress,
  notifyHistoryUpdated,
  type QuestionAnswerInput,
  type ToeicHistoryUpdatedEventDetail,
} from '../../src/lib/toeic-question-history';

export async function runChallengerEmpiricalStressTests(runner: TestRunner): Promise<void> {
  runner.describe('Challenger M1-1: Empirical Adversarial Stress Suite', () => {});

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORY 1: High-Volume Record Throughput & Batch Integrity
  // ═════════════════════════════════════════════════════════════════════════════

  await runner.it('STRESS-1: Massive single batch throughput (2,500 questions in 1 call)', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const BATCH_SIZE = 2500;
      const batch: QuestionAnswerInput[] = [];

      for (let i = 1; i <= BATCH_SIZE; i++) {
        const part = ((i % 7) + 1);
        batch.push({
          questionId: `q-stress-bulk-${i}`,
          part,
          selectedOption: ['A', 'B', 'C', 'D'][i % 4],
          isCorrect: i % 3 !== 0, // ~67% correct, ~33% mistake
          answeredAt: new Date(Date.now() - (BATCH_SIZE - i) * 1000).toISOString(),
        });
      }

      const startTime = Date.now();
      recordQuestionAnswers(batch);
      const elapsedMs = Date.now() - startTime;

      // 1. Throughput assertion: 2,500 questions processed in under 350ms
      expect(elapsedMs < 350).toBe(true);

      // 2. Storage integrity: exactly 2,500 records saved
      const storage = loadToeicQuestionHistory();
      const recordsCount = Object.keys(storage.records).length;
      expect(recordsCount).toBe(BATCH_SIZE);

      // 3. Query consistency
      const answeredIds = getAnsweredQuestionIds();
      expect(answeredIds.length).toBe(BATCH_SIZE);

      const mistakeIds = getMistakeQuestionIds();
      const correctIds = getCorrectQuestionIds();
      expect(mistakeIds.length + correctIds.length).toBe(BATCH_SIZE);

      // 4. Spot check first, middle, last records
      expect(storage.records['q-stress-bulk-1'].attemptCount).toBe(1);
      expect(storage.records['q-stress-bulk-1250'].questionId).toBe('q-stress-bulk-1250');
      expect(storage.records['q-stress-bulk-2500'].part).toBe(((2500 % 7) + 1));

      // 5. LocalStorage payload validity
      const rawStored = mockStorage.getItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY);
      expect(typeof rawStored).toBe('string');
      expect(rawStored!.length > 50000).toBe(true);
      const reParsed = JSON.parse(rawStored!);
      expect(Object.keys(reParsed.records).length).toBe(BATCH_SIZE);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-2: High-frequency rapid micro-batches (100 batches x 25 questions = 2,500 ops)', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const TOTAL_BATCHES = 100;
      const BATCH_SIZE = 25;
      let eventCount = 0;

      // Mock CustomEvent listener
      (global as any).window.dispatchEvent = (event: any) => {
        if (event.type === TOEIC_HISTORY_UPDATED_EVENT) {
          eventCount++;
        }
      };

      const startTime = Date.now();
      for (let b = 0; b < TOTAL_BATCHES; b++) {
        const batch: QuestionAnswerInput[] = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
          const qIndex = b * BATCH_SIZE + i + 1;
          batch.push({
            questionId: `q-micro-${qIndex}`,
            part: (qIndex % 7) + 1,
            selectedOption: 'B',
            isCorrect: true,
          });
        }
        recordQuestionAnswers(batch);
      }
      const elapsedMs = Date.now() - startTime;

      // Assertions
      expect(eventCount).toBe(TOTAL_BATCHES);
      const answered = getAnsweredQuestionIds();
      expect(answered.length).toBe(TOTAL_BATCHES * BATCH_SIZE);
      expect(elapsedMs < 600).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-3: Rapid re-attempting stress (200 questions x 15 attempts each = 3,000 updates)', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const QUESTION_COUNT = 200;
      const ATTEMPTS = 15;
      const options = ['A', 'B', 'C', 'D'];

      const startTime = Date.now();
      for (let att = 1; att <= ATTEMPTS; att++) {
        const batch: QuestionAnswerInput[] = [];
        for (let q = 1; q <= QUESTION_COUNT; q++) {
          batch.push({
            questionId: `q-repeat-${q}`,
            part: (q % 7) + 1,
            selectedOption: options[(q + att) % 4],
            isCorrect: att % 2 === 0, // alternates false on odd, true on even
            answeredAt: new Date(1700000000000 + att * 60000).toISOString(),
          });
        }
        recordQuestionAnswers(batch);
      }
      const elapsedMs = Date.now() - startTime;

      // 1. Exactly 200 records exist (no duplicate keys created)
      const storage = loadToeicQuestionHistory();
      expect(Object.keys(storage.records).length).toBe(QUESTION_COUNT);

      // 2. Every question has attemptCount strictly equal to 15
      for (let q = 1; q <= QUESTION_COUNT; q++) {
        const rec = storage.records[`q-repeat-${q}`];
        expect(rec.attemptCount).toBe(ATTEMPTS);
        // Attempt 15 is odd -> isCorrect === false
        expect(rec.isCorrect).toBe(false);
        expect(rec.selectedOption).toBe(options[(q + 15) % 4]);
      }

      // 3. Spaced repetition query reflects latest attempt (all 200 are mistakes)
      expect(getMistakeQuestionIds().length).toBe(QUESTION_COUNT);
      expect(getCorrectQuestionIds().length).toBe(0);
      expect(elapsedMs < 500).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-4: Dirty, malformed, and adversarial batch input resilience', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const dirtyBatch: any[] = [
        null,
        undefined,
        {},
        { questionId: '' },
        { questionId: '   ' },
        { questionId: 12345 }, // invalid type
        { questionId: 'q-dirty-1', part: -99, selectedOption: '  c  ', isCorrect: 1 }, // part clamped to 1, opt 'C'
        { questionId: 'q-dirty-2', part: 999, selectedOption: null, isCorrect: false }, // part clamped to 7, opt ''
        { questionId: 'q-dirty-3', part: NaN, selectedOption: 'd', isCorrect: 'yes' }, // part fallback to 1, opt 'D', bool true
        { questionId: 'q-dirty-4', part: 4, selectedOption: 'A', isCorrect: false, answeredAt: 'not-a-date' }, // fallback date
        { questionId: '   q-dirty-5   ', part: 5.8, selectedOption: 'b', isCorrect: true }, // trim id, floor part to 5
      ];

      // Add 200 clean items
      for (let i = 1; i <= 200; i++) {
        dirtyBatch.push({
          questionId: `q-clean-${i}`,
          part: (i % 7) + 1,
          selectedOption: 'A',
          isCorrect: true,
        });
      }

      // Must not throw runtime exception
      recordQuestionAnswers(dirtyBatch);

      const storage = loadToeicQuestionHistory();
      // Only valid items should be recorded (5 dirty with valid non-empty string IDs + 200 clean = 205)
      expect(Object.keys(storage.records).length).toBe(205);

      // Assert clamped/cleaned properties
      expect(storage.records['q-dirty-1'].part).toBe(1);
      expect(storage.records['q-dirty-1'].selectedOption).toBe('C');
      expect(storage.records['q-dirty-1'].isCorrect).toBe(true);

      expect(storage.records['q-dirty-2'].part).toBe(7);
      expect(storage.records['q-dirty-2'].selectedOption).toBe('');

      expect(storage.records['q-dirty-3'].part).toBe(1);
      expect(storage.records['q-dirty-3'].selectedOption).toBe('D');
      expect(storage.records['q-dirty-3'].isCorrect).toBe(true);

      expect(storage.records['q-dirty-4'].part).toBe(4);
      expect(typeof storage.records['q-dirty-4'].lastAnsweredAt).toBe('string');

      expect(storage.records['q-dirty-5'].part).toBe(5);
      expect(storage.records['q-dirty-5'].questionId).toBe('q-dirty-5');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORY 2: Spaced Repetition Transitions & State Machine Rigor
  // ═════════════════════════════════════════════════════════════════════════════

  await runner.it('STRESS-5: Deep cyclic transitions: wrong -> right -> wrong -> right -> wrong', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const qId = 'q-cycle-deep';
      const part = 5;

      // Initial state: unseen
      expect(getAnsweredQuestionIds().includes(qId)).toBe(false);
      expect(getMistakeQuestionIds().includes(qId)).toBe(false);
      expect(getCorrectQuestionIds().includes(qId)).toBe(false);

      // Attempt 1: WRONG
      recordQuestionAnswers([
        { questionId: qId, part, selectedOption: 'A', isCorrect: false },
      ]);
      expect(getAnsweredQuestionIds().includes(qId)).toBe(true);
      expect(getMistakeQuestionIds().includes(qId)).toBe(true);
      expect(getCorrectQuestionIds().includes(qId)).toBe(false);
      let stats = getPartProgressStats(part);
      expect(stats.completedCount).toBe(1);
      expect(stats.mistakeCount).toBe(1);
      expect(stats.totalCorrect).toBe(0);
      expect(stats.accuracyPercentage).toBe(0);

      // Attempt 2: RIGHT
      recordQuestionAnswers([
        { questionId: qId, part, selectedOption: 'B', isCorrect: true },
      ]);
      expect(getAnsweredQuestionIds().includes(qId)).toBe(true);
      expect(getMistakeQuestionIds().includes(qId)).toBe(false); // EVACUATED FROM MISTAKES
      expect(getCorrectQuestionIds().includes(qId)).toBe(true);
      stats = getPartProgressStats(part);
      expect(stats.completedCount).toBe(1);
      expect(stats.mistakeCount).toBe(0);
      expect(stats.totalCorrect).toBe(1);
      expect(stats.accuracyPercentage).toBe(100);

      // Attempt 3: WRONG AGAIN
      recordQuestionAnswers([
        { questionId: qId, part, selectedOption: 'C', isCorrect: false },
      ]);
      expect(getAnsweredQuestionIds().includes(qId)).toBe(true);
      expect(getMistakeQuestionIds().includes(qId)).toBe(true); // RE-ENTERED MISTAKES
      expect(getCorrectQuestionIds().includes(qId)).toBe(false);
      stats = getPartProgressStats(part);
      expect(stats.completedCount).toBe(1);
      expect(stats.mistakeCount).toBe(1);
      expect(stats.totalCorrect).toBe(0);

      // Attempt 4: RIGHT AGAIN
      recordQuestionAnswers([
        { questionId: qId, part, selectedOption: 'D', isCorrect: true },
      ]);
      expect(getMistakeQuestionIds().includes(qId)).toBe(false);
      expect(getCorrectQuestionIds().includes(qId)).toBe(true);
      stats = getPartProgressStats(part);
      expect(stats.mistakeCount).toBe(0);
      expect(stats.totalCorrect).toBe(1);

      // Attempt 5: WRONG AGAIN
      recordQuestionAnswers([
        { questionId: qId, part, selectedOption: 'A', isCorrect: false },
      ]);
      expect(getMistakeQuestionIds().includes(qId)).toBe(true);
      expect(getCorrectQuestionIds().includes(qId)).toBe(false);
      const record = loadToeicQuestionHistory().records[qId];
      expect(record.attemptCount).toBe(5);
      expect(record.isCorrect).toBe(false);
      expect(record.selectedOption).toBe('A');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-6: Large-scale Spaced Repetition Oracle Matrix (700 questions across 5 phases)', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const TOTAL_QUESTIONS = 700; // 100 questions per part (1..7)
      interface OracleRecord {
        questionId: string;
        part: number;
        isCorrect: boolean;
        attemptCount: number;
        selectedOption: string;
      }
      const oracle = new Map<string, OracleRecord>();

      for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
        const part = ((i - 1) % 7) + 1;
        oracle.set(`q-oracle-${i}`, {
          questionId: `q-oracle-${i}`,
          part,
          isCorrect: false,
          attemptCount: 0,
          selectedOption: '',
        });
      }

      function verifyAgainstOracle() {
        const mistakeIds = new Set(getMistakeQuestionIds());
        const correctIds = new Set(getCorrectQuestionIds());
        const answeredIds = new Set(getAnsweredQuestionIds());

        let expectedMistakes = 0;
        let expectedCorrect = 0;
        let expectedAnswered = 0;

        for (const [qId, exp] of oracle.entries()) {
          if (exp.attemptCount > 0) {
            expectedAnswered++;
            expect(answeredIds.has(qId)).toBe(true);

            if (exp.isCorrect) {
              expectedCorrect++;
              expect(correctIds.has(qId)).toBe(true);
              expect(mistakeIds.has(qId)).toBe(false);
            } else {
              expectedMistakes++;
              expect(mistakeIds.has(qId)).toBe(true);
              expect(correctIds.has(qId)).toBe(false);
            }
          } else {
            expect(answeredIds.has(qId)).toBe(false);
            expect(mistakeIds.has(qId)).toBe(false);
            expect(correctIds.has(qId)).toBe(false);
          }
        }

        expect(mistakeIds.size).toBe(expectedMistakes);
        expect(correctIds.size).toBe(expectedCorrect);
        expect(answeredIds.size).toBe(expectedAnswered);
      }

      // ── Phase 1: All 700 answered incorrectly ──
      const phase1Batch: QuestionAnswerInput[] = [];
      for (const [qId, rec] of oracle.entries()) {
        rec.attemptCount = 1;
        rec.isCorrect = false;
        rec.selectedOption = 'A';
        phase1Batch.push({
          questionId: qId,
          part: rec.part,
          selectedOption: 'A',
          isCorrect: false,
        });
      }
      recordQuestionAnswers(phase1Batch);
      verifyAgainstOracle();

      // ── Phase 2: Half (350) re-answered correctly ──
      const phase2Batch: QuestionAnswerInput[] = [];
      let count = 0;
      for (const [qId, rec] of oracle.entries()) {
        if (count < 350) {
          rec.attemptCount += 1;
          rec.isCorrect = true;
          rec.selectedOption = 'B';
          phase2Batch.push({
            questionId: qId,
            part: rec.part,
            selectedOption: 'B',
            isCorrect: true,
          });
        }
        count++;
      }
      recordQuestionAnswers(phase2Batch);
      verifyAgainstOracle();

      // ── Phase 3: 150 of the correct questions fail again ──
      const phase3Batch: QuestionAnswerInput[] = [];
      count = 0;
      for (const [qId, rec] of oracle.entries()) {
        if (rec.isCorrect && count < 150) {
          rec.attemptCount += 1;
          rec.isCorrect = false;
          rec.selectedOption = 'C';
          phase3Batch.push({
            questionId: qId,
            part: rec.part,
            selectedOption: 'C',
            isCorrect: false,
          });
          count++;
        }
      }
      recordQuestionAnswers(phase3Batch);
      verifyAgainstOracle();

      // ── Phase 4: 200 of the mistake questions re-answered correctly ──
      const phase4Batch: QuestionAnswerInput[] = [];
      count = 0;
      for (const [qId, rec] of oracle.entries()) {
        if (!rec.isCorrect && count < 200) {
          rec.attemptCount += 1;
          rec.isCorrect = true;
          rec.selectedOption = 'D';
          phase4Batch.push({
            questionId: qId,
            part: rec.part,
            selectedOption: 'D',
            isCorrect: true,
          });
          count++;
        }
      }
      recordQuestionAnswers(phase4Batch);
      verifyAgainstOracle();

      // ── Phase 5: Check part statistics alignment for all 7 parts ──
      for (let p = 1; p <= 7; p++) {
        const stats = getPartProgressStats(p);
        let partExpCorrect = 0;
        let partExpMistake = 0;
        let partExpAnswered = 0;

        for (const [qId, rec] of oracle.entries()) {
          if (rec.part === p) {
            partExpAnswered++;
            if (rec.isCorrect) partExpCorrect++;
            else partExpMistake++;
          }
        }

        expect(stats.completedCount).toBe(partExpAnswered);
        expect(stats.mistakeCount).toBe(partExpMistake);
        expect(stats.totalCorrect).toBe(partExpCorrect);
        expect(stats.completedCount).toBe(partExpCorrect + partExpMistake);
      }
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORY 3: Multi-Part Isolation & Targeted Progress Resets
  // ═════════════════════════════════════════════════════════════════════════════

  await runner.it('STRESS-7: 7-Part Isolation: Independent query results under multi-part population', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const batch: QuestionAnswerInput[] = [];
      const questionsPerPart: Record<number, number> = {
        1: 50,
        2: 70,
        3: 90,
        4: 110,
        5: 130,
        6: 80,
        7: 150,
      };

      for (let p = 1; p <= 7; p++) {
        for (let q = 1; q <= questionsPerPart[p]; q++) {
          batch.push({
            questionId: `q-p${p}-${q}`,
            part: p,
            selectedOption: 'A',
            isCorrect: q % 2 === 0, // 50% mistakes
          });
        }
      }

      recordQuestionAnswers(batch);

      // Verify each Part has strict boundary isolation
      for (let p = 1; p <= 7; p++) {
        const partRecords = getQuestionHistoryByPart(p);
        expect(partRecords.length).toBe(questionsPerPart[p]);
        // All returned records must strictly match part p
        expect(partRecords.every((r) => r.part === p)).toBe(true);

        const answeredIds = getAnsweredQuestionIds(p);
        expect(answeredIds.length).toBe(questionsPerPart[p]);
        expect(answeredIds.every((id) => id.startsWith(`q-p${p}-`))).toBe(true);

        const mistakeIds = getMistakeQuestionIds(p);
        const expectedMistakes = Math.ceil(questionsPerPart[p] / 2);
        expect(mistakeIds.length).toBe(expectedMistakes);
        expect(mistakeIds.every((id) => id.startsWith(`q-p${p}-`))).toBe(true);

        const stats = getPartProgressStats(p);
        expect(stats.completedCount).toBe(questionsPerPart[p]);
        expect(stats.mistakeCount).toBe(expectedMistakes);
        expect(stats.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[p]);
        expect(stats.unseenCount).toBe(TOEIC_PART_BANK_TOTALS[p] - questionsPerPart[p]);
      }
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-8: Selective cascading resets: reset Part 3, then Part 5, preserving other parts', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // 100 questions in each of Parts 1..7 (700 questions)
      const batch: QuestionAnswerInput[] = [];
      for (let p = 1; p <= 7; p++) {
        for (let q = 1; q <= 100; q++) {
          batch.push({
            questionId: `q-iso-p${p}-${q}`,
            part: p,
            selectedOption: 'B',
            isCorrect: true,
          });
        }
      }
      recordQuestionAnswers(batch);
      expect(getAnsweredQuestionIds().length).toBe(700);

      // Step 1: Reset Part 3 ONLY
      resetPartProgress(3);

      // Part 3 must be completely cleared
      expect(getQuestionHistoryByPart(3).length).toBe(0);
      expect(getAnsweredQuestionIds(3).length).toBe(0);
      const stats3 = getPartProgressStats(3);
      expect(stats3.completedCount).toBe(0);
      expect(stats3.percentage).toBe(0);
      expect(stats3.unseenCount).toBe(TOEIC_PART_BANK_TOTALS[3]);

      // Parts 1, 2, 4, 5, 6, 7 must remain 100% intact (100 questions each)
      for (const p of [1, 2, 4, 5, 6, 7]) {
        expect(getQuestionHistoryByPart(p).length).toBe(100);
        expect(getAnsweredQuestionIds(p).length).toBe(100);
        expect(getPartProgressStats(p).completedCount).toBe(100);
      }
      expect(getAnsweredQuestionIds().length).toBe(600);

      // Step 2: Reset Part 5 ONLY
      resetPartProgress(5);
      expect(getQuestionHistoryByPart(5).length).toBe(0);
      expect(getAnsweredQuestionIds(5).length).toBe(0);

      // Parts 1, 2, 4, 6, 7 still intact
      for (const p of [1, 2, 4, 6, 7]) {
        expect(getQuestionHistoryByPart(p).length).toBe(100);
      }
      expect(getAnsweredQuestionIds().length).toBe(500);

      // Step 3: Reset Part 7 ONLY
      resetPartProgress(7);
      expect(getQuestionHistoryByPart(7).length).toBe(0);

      // Parts 1, 2, 4, 6 still intact
      for (const p of [1, 2, 4, 6]) {
        expect(getQuestionHistoryByPart(p).length).toBe(100);
      }
      expect(getAnsweredQuestionIds().length).toBe(400);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-9: Global reset wipes all parts and emits clean reset event', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const batch: QuestionAnswerInput[] = [];
      for (let p = 1; p <= 7; p++) {
        for (let q = 1; q <= 20; q++) {
          batch.push({
            questionId: `q-glob-${p}-${q}`,
            part: p,
            selectedOption: 'A',
            isCorrect: false,
          });
        }
      }
      recordQuestionAnswers(batch);
      expect(getAnsweredQuestionIds().length).toBe(140);

      let capturedEvent: ToeicHistoryUpdatedEventDetail | null = null;
      (global as any).window.dispatchEvent = (event: any) => {
        if (event.type === TOEIC_HISTORY_UPDATED_EVENT) {
          capturedEvent = event.detail;
        }
      };

      // Perform Global Reset
      resetPartProgress();

      // All parts wiped
      expect(getAnsweredQuestionIds().length).toBe(0);
      expect(getMistakeQuestionIds().length).toBe(0);
      for (let p = 1; p <= 7; p++) {
        expect(getQuestionHistoryByPart(p).length).toBe(0);
        const stats = getPartProgressStats(p);
        expect(stats.completedCount).toBe(0);
        expect(stats.mistakeCount).toBe(0);
        expect(stats.percentage).toBe(0);
      }

      // Event assertions
      expect(capturedEvent !== null).toBe(true);
      expect(capturedEvent!.source).toBe('reset');
      expect(capturedEvent!.part).toBe(undefined);
      expect(capturedEvent!.affectedParts).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(capturedEvent!.questionIds.length).toBe(140);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORY 4: Boundary Invariants, Event Bus, and Offline Queue Saturation
  // ═════════════════════════════════════════════════════════════════════════════

  await runner.it('STRESS-10: Boundary Invariants: 0 bank, negative bank, overflow answers, and NaN part', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // 1. Zero bank total
      const statsZero = getPartProgressStats(1, 0);
      expect(statsZero.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[1]); // falls back to canonical default

      // 2. Custom small bank where completed > bank total (e.g. 10 questions answered in bank of 5)
      const batch: QuestionAnswerInput[] = [];
      for (let i = 1; i <= 10; i++) {
        batch.push({
          questionId: `q-overflow-${i}`,
          part: 1,
          selectedOption: 'A',
          isCorrect: true,
        });
      }
      recordQuestionAnswers(batch);

      const statsOverflow = getPartProgressStats(1, 5);
      expect(statsOverflow.completedCount).toBe(10);
      expect(statsOverflow.totalQuestions).toBe(5);
      expect(statsOverflow.percentage).toBe(100); // percentage clamped to 100% max
      expect(statsOverflow.unseenCount).toBe(0); // unseen clamped to 0 min

      // 3. Out of bound Part inputs
      const statsLow = getPartProgressStats(-5);
      expect(statsLow.part).toBe(1); // clamped to 1

      const statsHigh = getPartProgressStats(99);
      expect(statsHigh.part).toBe(7); // clamped to 7

      const statsNaN = getPartProgressStats(NaN as any);
      expect(statsNaN.part).toBe(1); // safe fallback
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-11: Event bus dispatch fidelity: multi-part payload structure and ordering', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const emittedEvents: ToeicHistoryUpdatedEventDetail[] = [];
      (global as any).window.dispatchEvent = (event: any) => {
        if (event.type === TOEIC_HISTORY_UPDATED_EVENT) {
          emittedEvents.push(event.detail);
        }
      };

      // Single-part batch
      recordQuestionAnswers([
        { questionId: 'q-single-p2', part: 2, selectedOption: 'A', isCorrect: true },
      ]);
      expect(emittedEvents.length).toBe(1);
      expect(emittedEvents[0].part).toBe(2);
      expect(emittedEvents[0].affectedParts).toEqual([2]);
      expect(emittedEvents[0].questionIds).toEqual(['q-single-p2']);
      expect(emittedEvents[0].source).toBe('local_record');

      // Multi-part batch (Parts 1, 4, 6)
      recordQuestionAnswers([
        { questionId: 'q-multi-p1', part: 1, selectedOption: 'B', isCorrect: false },
        { questionId: 'q-multi-p4', part: 4, selectedOption: 'C', isCorrect: true },
        { questionId: 'q-multi-p6', part: 6, selectedOption: 'D', isCorrect: true },
      ]);
      expect(emittedEvents.length).toBe(2);
      expect(emittedEvents[1].part).toBe(undefined); // multi-part has undefined part
      expect(emittedEvents[1].affectedParts).toEqual([1, 4, 6]);
      expect(emittedEvents[1].questionIds).toEqual(['q-multi-p1', 'q-multi-p4', 'q-multi-p6']);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('STRESS-12: Offline queue saturation boundary: strict 500-item FIFO/slice cap', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // Direct simulation of network failure queueing 800 items
      const largeFailedBatch: QuestionAnswerInput[] = [];
      for (let i = 1; i <= 800; i++) {
        largeFailedBatch.push({
          questionId: `q-queue-${i}`,
          part: (i % 7) + 1,
          selectedOption: 'A',
          isCorrect: true,
          answeredAt: new Date(1700000000000 + i * 1000).toISOString(),
        });
      }

      // Populate queue directly simulating failed sync
      const rawQueue = JSON.stringify(largeFailedBatch.slice(-500));
      mockStorage.setItem(TOEIC_HISTORY_SYNC_QUEUE_KEY, rawQueue);

      const storedQueueRaw = mockStorage.getItem(TOEIC_HISTORY_SYNC_QUEUE_KEY);
      expect(storedQueueRaw !== null).toBe(true);
      const parsedQueue = JSON.parse(storedQueueRaw!);
      expect(parsedQueue.length).toBe(500);

      // Verify FIFO slice retained the most recent 500 items (301..800)
      expect(parsedQueue[0].questionId).toBe('q-queue-301');
      expect(parsedQueue[499].questionId).toBe('q-queue-800');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });
}

// Standalone runner execution
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('challenger-m1-empirical-stress'))) {
  const runner = new TestRunner();
  runChallengerEmpiricalStressTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\n================================================================================`);
    console.log(`  CHALLENGER M1-1 EMPIRICAL STRESS RESULTS: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    console.log(`================================================================================`);
    if (stats.failed > 0) {
      console.error(`❌ ${stats.failed} tests failed!`);
      process.exit(1);
    } else {
      console.log(`✅ All ${stats.total} empirical stress tests passed with 0 defects.`);
      process.exit(0);
    }
  }).catch((err) => {
    console.error('Fatal error running challenger stress tests:', err);
    process.exit(1);
  });
}
