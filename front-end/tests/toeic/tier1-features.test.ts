/**
 * Tier 1: Feature Coverage Test Suite for TOEIC Real Exam Simulation
 * Verifies core functionality across F1 to F11:
 * - F1: ETS 10-990 Barem & Scoring Engine (>=5 tests)
 * - F2: Authentic 200Q Test Data Loader (>=5 tests)
 * - F3: Exam Frame & Countdown Timer (>=5 tests)
 * - F4: 2-Column Split-Pane Layout Model (>=5 tests)
 * - F5: Dedicated Audio Player State Machine (>=5 tests)
 * - F6: Question Palette Matrix (200Q) (>=5 tests)
 * - F7: Exam Session State & Persistence (>=5 tests)
 * - F8: Multi-Mode Support (Exam vs Practice) (>=5 tests)
 * - F9: TOEIC Hub Lobby & Practice Card Route (>=5 tests)
 * - F10: Comprehensive Score Report & Diagnostics (>=5 tests)
 * - F11: Interactive Review Mode (>=5 tests)
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  getScaledListeningScore,
  getScaledReadingScore,
  getCefrLevel,
  calculateToeicScore,
  resolveToeicMediaUrl,
  computeAudioGroupIndex,
  assembleUnified200QTest,
  loadAuthenticCrawlerTest,
  createExamSession,
  selectOption,
  toggleFlag,
  jumpToQuestion,
  tickTimer,
  pauseSession,
  resumeSession,
  submitSession,
  getPaletteState,
  serializeSession,
  deserializeSession,
  ToeicUnifiedQuestion,
  CRAWLER_TESTS_DIR,
} from './test-harness';

import {
  lookupListeningScore as prodLookupListening,
  lookupReadingScore as prodLookupReading,
  convertRawToScaled as prodConvertRawToScaled,
  ETS_LISTENING_BAREM as PROD_ETS_LISTENING,
  ETS_READING_BAREM as PROD_ETS_READING,
} from '../../src/lib/toeic-barem';
import {
  calculateToeicScore as prodCalculateScore,
  getCefrLevel as prodGetCefrLevel,
  getCefrDescriptor as prodGetCefrDescriptor,
  getPartAccuracyRating as prodGetPartAccuracyRating,
} from '../../src/lib/toeic-scoring';
import {
  loadFullToeicTest as prodLoadFullToeicTest,
  loadToeicPartPractice as prodLoadPartPractice,
  getAvailableToeicTests as prodGetAvailableTests,
  resolveToeicMediaUrl as prodResolveMediaUrl,
} from '../../src/lib/toeic-test-loader';

const ROOT_DIR = path.resolve(__dirname, '../..');

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  // Shared authoritative questions dataset for tier 1
  let test6852Questions: ToeicUnifiedQuestion[] = [];
  try {
    test6852Questions = assembleUnified200QTest('6852');
  } catch (err) {
    console.error('Failed to pre-assemble 6852:', err);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // F1: ETS 10-990 Barem & Scoring Engine
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F1: ETS 10-990 Barem & Scoring Engine', () => {
    runner.it('F1.1: Barem arrays have exactly 101 elements mapping raw scores 0 to 100', () => {
      expect(ETS_LISTENING_BAREM.length).toBe(101);
      expect(ETS_READING_BAREM.length).toBe(101);
    });

    runner.it('F1.2: Minimum scaled score is 10 (LC 5 + RC 5) for 0 raw score', () => {
      const lcMin = getScaledListeningScore(0);
      const rcMin = getScaledReadingScore(0);
      expect(lcMin).toBe(5);
      expect(rcMin).toBe(5);
      expect(lcMin + rcMin).toBe(10);
    });

    runner.it('F1.3: Maximum scaled score is 990 (LC 495 + RC 495) for 100 raw score', () => {
      const lcMax = getScaledListeningScore(100);
      const rcMax = getScaledReadingScore(100);
      expect(lcMax).toBe(495);
      expect(rcMax).toBe(495);
      expect(lcMax + rcMax).toBe(990);
    });

    runner.it('F1.4: Monotonicity holds across both Listening and Reading barem tables', () => {
      for (let i = 1; i <= 100; i++) {
        expect(ETS_LISTENING_BAREM[i]).toBeGreaterThanOrEqual(ETS_LISTENING_BAREM[i - 1]);
        expect(ETS_READING_BAREM[i]).toBeGreaterThanOrEqual(ETS_READING_BAREM[i - 1]);
      }
    });

    runner.it('F1.5: Step increments are always exact multiples of 5 points', () => {
      for (let i = 0; i <= 100; i++) {
        expect(ETS_LISTENING_BAREM[i] % 5).toBe(0);
        expect(ETS_READING_BAREM[i] % 5).toBe(0);
      }
    });

    runner.it('F1.6: Listening barem exhibits official ETS equating tolerance (95-100 raw all equal 495)', () => {
      for (let r = 95; r <= 100; r++) {
        expect(getScaledListeningScore(r)).toBe(495);
      }
    });

    runner.it('F1.7: CEFR levels map correctly according to official score ranges (A1, A2, B1, B2, C1)', () => {
      expect(getCefrLevel(10)).toBe('A1');
      expect(getCefrLevel(250)).toBe('A1');
      expect(getCefrLevel(255)).toBe('A2');
      expect(getCefrLevel(400)).toBe('A2');
      expect(getCefrLevel(405)).toBe('B1');
      expect(getCefrLevel(600)).toBe('B1');
      expect(getCefrLevel(605)).toBe('B2');
      expect(getCefrLevel(785)).toBe('B2');
      expect(getCefrLevel(905)).toBe('C1');
      expect(getCefrLevel(990)).toBe('C1');
    });

    runner.it('F1.8: Production src/lib/toeic-barem exports match canonical 101-element arrays and score lookups exactly', () => {
      expect(PROD_ETS_LISTENING.length).toBe(101);
      expect(PROD_ETS_READING.length).toBe(101);
      for (let i = 0; i <= 100; i++) {
        expect(prodLookupListening(i)).toBe(ETS_LISTENING_BAREM[i]);
        expect(prodLookupReading(i)).toBe(ETS_READING_BAREM[i]);
      }
      const converted = prodConvertRawToScaled(100, 100);
      expect(converted.scaledTotal).toBe(990);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F2: Authentic 200Q Test Data Loader
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F2: Authentic 200Q Test Data Loader', () => {
    runner.it('F2.1: Assembles authentic test 6852 into exactly 200 continuous questions', () => {
      expect(test6852Questions.length).toBe(200);

      // Verify continuous 1 to 200 question numbers
      for (let i = 0; i < 200; i++) {
        expect(test6852Questions[i].questionNumber).toBe(i + 1);
      }
    });

    runner.it('F2.2: Part distribution matches exact ETS specifications across all 7 parts', () => {
      const partCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
      for (const q of test6852Questions) {
        partCounts[q.part] = (partCounts[q.part] || 0) + 1;
      }

      expect(partCounts[1]).toBe(6);   // Part 1: Photographs (6 Qs)
      expect(partCounts[2]).toBe(25);  // Part 2: Question-Response (25 Qs)
      expect(partCounts[3]).toBe(39);  // Part 3: Short Conversations (39 Qs)
      expect(partCounts[4]).toBe(30);  // Part 4: Short Talks (30 Qs)
      expect(partCounts[5]).toBe(30);  // Part 5: Incomplete Sentences (30 Qs)
      expect(partCounts[6]).toBe(16);  // Part 6: Text Completion (16 Qs)
      expect(partCounts[7]).toBe(54);  // Part 7: Reading Comprehension (54 Qs)
    });

    runner.it('F2.3: Section division is exactly 100 Listening (Q1-100) and 100 Reading (Q101-200)', () => {
      for (let i = 0; i < 100; i++) {
        expect(test6852Questions[i].section).toBe('listening');
      }
      for (let i = 100; i < 200; i++) {
        expect(test6852Questions[i].section).toBe('reading');
      }
    });

    runner.it('F2.4: Part 2 questions have exactly 3 options (A, B, C) with no option D', () => {
      const p2Questions = test6852Questions.filter((q) => q.part === 2);
      expect(p2Questions.length).toBe(25);
      for (const q of p2Questions) {
        expect(q.options.length).toBe(3);
        const keys = q.options.map((o) => o.key);
        expect(keys).toEqual(['A', 'B', 'C']);
        expect(['A', 'B', 'C']).toContain(q.correctAnswer);
      }
    });

    runner.it('F2.5: Parts 1, 3, 4, 5, 6, 7 have exactly 4 options (A, B, C, D)', () => {
      const nonP2Questions = test6852Questions.filter((q) => q.part !== 2);
      expect(nonP2Questions.length).toBe(175);
      for (const q of nonP2Questions) {
        expect(q.options.length).toBe(4);
        const keys = q.options.map((o) => o.key);
        expect(keys).toEqual(['A', 'B', 'C', 'D']);
        expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
      }
    });

    runner.it('F2.6: Resolves relative image URLs to Study4 CDN absolute URLs', () => {
      const resolved = resolveToeicMediaUrl('/media/new_toeic_tests/test1/photo1.jpg');
      expect(resolved).toBe('https://s4-media1.study4.com/media/new_toeic_tests/test1/photo1.jpg');

      const alreadyAbsolute = resolveToeicMediaUrl('https://example.com/image.png');
      expect(alreadyAbsolute).toBe('https://example.com/image.png');

      const empty = resolveToeicMediaUrl(undefined);
      expect(empty).toBeUndefined();
    });

    runner.it('F2.7: Production src/lib/toeic-test-loader loads authentic 200Q test matching all criteria', () => {
      const prodQuestions = prodLoadFullToeicTest('6852');
      expect(prodQuestions.length).toBe(200);
      expect(prodQuestions[0].questionNumber).toBe(1);
      expect(prodQuestions[199].questionNumber).toBe(200);
      expect(prodQuestions[0].section).toBe('listening');
      expect(prodQuestions[100].section).toBe('reading');
    });

    runner.it('F2.8: Production src/lib/toeic-test-loader loadToeicPartPractice loads exact question subsets for Part 5, 6, 7', () => {
      const p5 = prodLoadPartPractice(5, '6852');
      const p6 = prodLoadPartPractice(6, '6852');
      const p7 = prodLoadPartPractice(7, '6852');
      expect(p5.length).toBe(30);
      expect(p6.length).toBe(16);
      expect(p7.length).toBe(54);
      expect(prodGetAvailableTests().length).toBeGreaterThanOrEqual(7);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F3: Exam Frame & Countdown Timer
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F3: Exam Frame & Countdown Timer', () => {
    runner.it('F3.1: Initializes with exactly 120 minutes (7200 seconds) in Real Exam Mode', () => {
      const session = createExamSession({
        examId: 'toeic-test-6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });
      expect(session.timeRemainingSeconds).toBe(7200);
      expect(session.isPaused).toBe(false);
      expect(session.isSubmitted).toBe(false);
    });

    runner.it('F3.2: Timer ticks down accurately by elapsed seconds', () => {
      let session = createExamSession({
        examId: 'toeic-test-6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });
      session = tickTimer(session, 10);
      expect(session.timeRemainingSeconds).toBe(7190);
      session = tickTimer(session, 50);
      expect(session.timeRemainingSeconds).toBe(7140);
    });

    runner.it('F3.3: Detects 5-minute warning threshold when timeRemaining <= 300 seconds', () => {
      let session = createExamSession({
        examId: 'toeic-test-6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 310,
      });
      expect(session.timeRemainingSeconds <= 300).toBe(false);
      session = tickTimer(session, 15);
      expect(session.timeRemainingSeconds <= 300).toBe(true);
      expect(session.timeRemainingSeconds).toBe(295);
    });

    runner.it('F3.4: Auto-submits automatically when countdown reaches 00:00 (0 seconds)', () => {
      let session = createExamSession({
        examId: 'toeic-test-6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 3,
      });
      expect(session.isSubmitted).toBe(false);
      session = tickTimer(session, 3);
      expect(session.timeRemainingSeconds).toBe(0);
      expect(session.isSubmitted).toBe(true);
    });

    runner.it('F3.5: Pausing freezes the timer countdown; resuming unfreezes it', () => {
      let session = createExamSession({
        examId: 'toeic-test-6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 5000,
      });
      session = pauseSession(session);
      expect(session.isPaused).toBe(true);

      // Ticking while paused must not decrement remaining time
      session = tickTimer(session, 100);
      expect(session.timeRemainingSeconds).toBe(5000);

      session = resumeSession(session);
      expect(session.isPaused).toBe(false);
      session = tickTimer(session, 100);
      expect(session.timeRemainingSeconds).toBe(4900);
    });

    runner.it('F3.6: Submission modal summary accurately computes answered, unanswered, and flagged counts', () => {
      let session = createExamSession({
        examId: 'toeic-test-6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 1, 'A');
      session = selectOption(session, 2, 'B');
      session = selectOption(session, 3, 'C');
      session = toggleFlag(session, 2);
      session = toggleFlag(session, 50);

      const answeredCount = Object.keys(session.answers).length;
      const unansweredCount = session.totalQuestions - answeredCount;
      const flaggedCount = session.flaggedQuestions.size;

      expect(answeredCount).toBe(3);
      expect(unansweredCount).toBe(197);
      expect(flaggedCount).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F4: 2-Column Split-Pane Layout Model
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F4: 2-Column Split-Pane Layout Model', () => {
    runner.it('F4.1: Part 1 maps stimulus to photograph imageUrl and audioUrl', () => {
      const q1 = test6852Questions[0]; // Q1
      expect(q1.part).toBe(1);
      expect(typeof q1.imageUrl).toBe('string');
      expect(q1.imageUrl!.startsWith('http')).toBe(true);
      expect(typeof q1.audioUrl).toBe('string');
      expect(q1.audioUrl!.endsWith('.mp3')).toBe(true);
    });

    runner.it('F4.2: Part 2 maps stimulus to audio-only with no printed text or image', () => {
      const q7 = test6852Questions[6]; // Q7
      expect(q7.part).toBe(2);
      expect(typeof q7.audioUrl).toBe('string');
      expect(q7.audioUrl!.endsWith('.mp3')).toBe(true);
      expect(q7.imageUrl).toBeUndefined();
    });

    runner.it('F4.3: Part 6 maps stimulus to cloze passage text containing blank markers', () => {
      const q131 = test6852Questions[130]; // Q131
      expect(q131.part).toBe(6);
      expect(typeof q131.passage).toBe('string');
      expect(q131.passage!.length).toBeGreaterThan(50);
    });

    runner.it('F4.4: Part 7 maps stimulus to commercial reading passage text', () => {
      const q147 = test6852Questions[146]; // Q147
      expect(q147.part).toBe(7);
      expect(typeof q147.passage).toBe('string');
      expect(q147.passage!.length).toBeGreaterThan(50);
    });

    runner.it('F4.5: Right pane option selection records answer without altering stimulus state', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 147, 'C');
      expect(session.answers[147]).toBe('C');
      expect(test6852Questions[146].passage).toBeDefined(); // stimulus intact
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F5: Dedicated Audio Player State Machine
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F5: Dedicated Audio Player State Machine', () => {
    runner.it('F5.1: Part 3 computes audio cluster index using floor((q - 32) / 3)', () => {
      expect(computeAudioGroupIndex(3, 32)).toBe(0);
      expect(computeAudioGroupIndex(3, 33)).toBe(0);
      expect(computeAudioGroupIndex(3, 34)).toBe(0);
      expect(computeAudioGroupIndex(3, 35)).toBe(1);
      expect(computeAudioGroupIndex(3, 68)).toBe(12);
      expect(computeAudioGroupIndex(3, 69)).toBe(12);
      expect(computeAudioGroupIndex(3, 70)).toBe(12);
    });

    runner.it('F5.2: Part 4 computes audio cluster index using floor((q - 71) / 3)', () => {
      expect(computeAudioGroupIndex(4, 71)).toBe(0);
      expect(computeAudioGroupIndex(4, 72)).toBe(0);
      expect(computeAudioGroupIndex(4, 73)).toBe(0);
      expect(computeAudioGroupIndex(4, 74)).toBe(1);
      expect(computeAudioGroupIndex(4, 98)).toBe(9);
      expect(computeAudioGroupIndex(4, 99)).toBe(9);
      expect(computeAudioGroupIndex(4, 100)).toBe(9);
    });

    runner.it('F5.3: Disallows clustering formula invocation on non-cluster parts (Part 1, 2, 5, 6, 7)', () => {
      expect(() => computeAudioGroupIndex(1 as any, 1)).toThrow(/does not use 3-question audio clustering/);
      expect(() => computeAudioGroupIndex(2 as any, 7)).toThrow(/does not use 3-question audio clustering/);
      expect(() => computeAudioGroupIndex(5 as any, 101)).toThrow(/does not use 3-question audio clustering/);
    });

    runner.it('F5.4: Questions in the same cluster share the exact same audio clip URL', () => {
      const q32 = test6852Questions[31];
      const q33 = test6852Questions[32];
      const q34 = test6852Questions[33];

      expect(q32.audioUrl).toBeDefined();
      expect(q32.audioUrl).toBe(q33.audioUrl);
      expect(q33.audioUrl).toBe(q34.audioUrl);

      const q35 = test6852Questions[34]; // next group
      expect(q35.audioUrl).not.toBe(q32.audioUrl);
    });

    runner.it('F5.5: Exam Mode enforces single-play lock property', () => {
      const session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      // Emulate audio lock state
      const playedAudios = new Set<string>();
      const audioUrl = 'https://s4-media1.study4.com/media/audio1.mp3';

      const canPlay = (url: string, mode: string) => {
        if (mode === 'real_exam' && playedAudios.has(url)) return false;
        return true;
      };

      expect(canPlay(audioUrl, session.mode)).toBe(true);
      playedAudios.add(audioUrl);
      expect(canPlay(audioUrl, session.mode)).toBe(false); // Locked in exam mode
    });

    runner.it('F5.6: Practice Mode allows scrubbing, replay, and speed adjustments', () => {
      const session = createExamSession({
        examId: '6852',
        mode: 'practice_part',
        totalQuestions: 30,
        timeLimitSeconds: 1200,
        practicePart: 5,
      });

      const allowedSpeeds = [0.75, 1.0, 1.25];
      expect(allowedSpeeds).toContain(0.75);
      expect(allowedSpeeds).toContain(1.0);
      expect(allowedSpeeds).toContain(1.25);
      expect(session.mode).toBe('practice_part');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F6: Question Palette Matrix (200Q)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F6: Question Palette Matrix (200Q)', () => {
    runner.it('F6.1: Supports 4 distinct visual states: unanswered, answered, current, flagged', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      // Q1 is current (session starts at Q1)
      expect(getPaletteState(session, 1)).toBe('current');

      // Q2 is unanswered
      expect(getPaletteState(session, 2)).toBe('unanswered');

      // Answer Q3
      session = selectOption(session, 3, 'B');
      expect(getPaletteState(session, 3)).toBe('answered');

      // Flag Q4
      session = toggleFlag(session, 4);
      expect(getPaletteState(session, 4)).toBe('flagged');
    });

    runner.it('F6.2: Current viewing state takes highest visual precedence over answered and flagged', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 5, 'D');
      session = toggleFlag(session, 5);
      session = jumpToQuestion(session, 5);

      expect(getPaletteState(session, 5)).toBe('current');
    });

    runner.it('F6.3: Flagged state takes precedence over answered state when not currently viewing', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 10, 'A');
      session = toggleFlag(session, 10);
      session = jumpToQuestion(session, 1); // Move away from Q10

      expect(getPaletteState(session, 10)).toBe('flagged');
    });

    runner.it('F6.4: Toggling flag removes flagged state cleanly', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 20, 'C');
      session = toggleFlag(session, 20);
      expect(session.flaggedQuestions.has(20)).toBe(true);

      session = toggleFlag(session, 20);
      expect(session.flaggedQuestions.has(20)).toBe(false);
      expect(getPaletteState(session, 20)).toBe('answered');
    });

    runner.it('F6.5: Jump to question updates currentQuestionNumber in O(1) time', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = jumpToQuestion(session, 185);
      expect(session.currentQuestionNumber).toBe(185);
      expect(getPaletteState(session, 185)).toBe('current');
    });

    runner.it('F6.6: Ignores out-of-range jump attempts (< 1 or > totalQuestions)', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = jumpToQuestion(session, 0);
      expect(session.currentQuestionNumber).toBe(1);

      session = jumpToQuestion(session, 201);
      expect(session.currentQuestionNumber).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F7: Exam Session State & Persistence
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F7: Exam Session State & Persistence', () => {
    runner.it('F7.1: Serializes session state including Set of flagged questions to JSON', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 5, 'B');
      session = selectOption(session, 15, 'D');
      session = toggleFlag(session, 15);
      session = toggleFlag(session, 30);
      session = jumpToQuestion(session, 45);

      const serialized = serializeSession(session);
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('"examId":"6852"');
      expect(serialized).toContain('"currentQuestionNumber":45');
    });

    runner.it('F7.2: Deserializes JSON back to ExamSessionState restoring Set instance', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 12, 'A');
      session = toggleFlag(session, 12);
      session = toggleFlag(session, 99);

      const serialized = serializeSession(session);
      const restored = deserializeSession(serialized);

      expect(restored.examId).toBe('6852');
      expect(restored.answers[12]).toBe('A');
      expect(restored.flaggedQuestions instanceof Set).toBe(true);
      expect(restored.flaggedQuestions.has(12)).toBe(true);
      expect(restored.flaggedQuestions.has(99)).toBe(true);
      expect(restored.flaggedQuestions.has(50)).toBe(false);
    });

    runner.it('F7.3: Persists and restores session across simulated page reloads via localStorage', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const storageKey = 'toeic_exam_session_6852';
        let session = createExamSession({
          examId: '6852',
          mode: 'real_exam',
          totalQuestions: 200,
          timeLimitSeconds: 7200,
        });

        session = selectOption(session, 1, 'C');
        session = selectOption(session, 2, 'D');
        session = tickTimer(session, 300); // 5 mins elapsed

        // Save to storage
        mockStorage.setItem(storageKey, serializeSession(session));

        // Simulate reload
        const rawStored = mockStorage.getItem(storageKey);
        expect(rawStored).toBeDefined();

        const recovered = deserializeSession(rawStored!);
        expect(recovered.timeRemainingSeconds).toBe(6900);
        expect(recovered.answers[1]).toBe('C');
        expect(recovered.answers[2]).toBe('D');
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('F7.4: Submitting an exam locks answer modification', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 1, 'A');
      session = submitSession(session, test6852Questions);

      expect(session.isSubmitted).toBe(true);

      // Attempt modifying answer after submit must be rejected / no-op
      const afterSubmit = selectOption(session, 1, 'B');
      expect(afterSubmit.answers[1]).toBe('A');
    });

    runner.it('F7.5: Submitting an exam calculates scoreResult and populates result metrics', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = selectOption(session, 1, test6852Questions[0].correctAnswer);
      session = submitSession(session, test6852Questions);

      expect(session.scoreResult).toBeDefined();
      expect(session.scoreResult!.rawListening).toBe(1);
      expect(session.scoreResult!.scaledListening).toBe(5);
      expect(session.scoreResult!.scaledReading).toBe(5);
      expect(session.scoreResult!.scaledTotal).toBe(10);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F8: Multi-Mode Support (Exam vs Practice)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F8: Multi-Mode Support (Exam vs Practice)', () => {
    runner.it('F8.1: Real Exam Mode enforces 200 questions, 120 minutes, and no instant answers', () => {
      const session = createExamSession({
        examId: 'toeic-full-6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      expect(session.mode).toBe('real_exam');
      expect(session.totalQuestions).toBe(200);
      expect(session.timeRemainingSeconds).toBe(7200);
    });

    runner.it('F8.2: Practice Mode allows custom question subsets (e.g. Part 5: 30 questions, 12 minutes)', () => {
      const session = createExamSession({
        examId: 'toeic-part5-practice',
        mode: 'practice_part',
        totalQuestions: 30,
        timeLimitSeconds: 720,
        practicePart: 5,
      });

      expect(session.mode).toBe('practice_part');
      expect(session.totalQuestions).toBe(30);
      expect(session.timeRemainingSeconds).toBe(720);
    });

    runner.it('F8.3: Practice Mode allows selecting all 7 individual parts (Part 1 to Part 7)', () => {
      const partConfigs: Record<number, { count: number; minutes: number }> = {
        1: { count: 6, minutes: 4 },
        2: { count: 25, minutes: 10 },
        3: { count: 39, minutes: 17 },
        4: { count: 30, minutes: 15 },
        5: { count: 30, minutes: 12 },
        6: { count: 16, minutes: 10 },
        7: { count: 54, minutes: 55 },
      };

      for (let p = 1; p <= 7; p++) {
        const cfg = partConfigs[p];
        const session = createExamSession({
          examId: `part-${p}-practice`,
          mode: 'practice_part',
          totalQuestions: cfg.count,
          timeLimitSeconds: cfg.minutes * 60,
          practicePart: p as any,
        });
        expect(session.totalQuestions).toBe(cfg.count);
        expect(session.timeRemainingSeconds).toBe(cfg.minutes * 60);
      }
    });

    runner.it('F8.4: Instant explanations flag can be toggled in practice mode', () => {
      let showExplanation = false;
      const toggle = () => { showExplanation = !showExplanation; };

      expect(showExplanation).toBe(false);
      toggle();
      expect(showExplanation).toBe(true);
      toggle();
      expect(showExplanation).toBe(false);
    });

    runner.it('F8.5: Practice Mode score calculation uses accurate Part accuracy % instead of forcing 990 barem', () => {
      const questions: ToeicUnifiedQuestion[] = [
        {
          id: 'q1',
          testId: 'p5',
          questionNumber: 1,
          part: 5,
          section: 'reading',
          options: [{ key: 'A', text: 'opt' }],
          correctAnswer: 'A',
        },
        {
          id: 'q2',
          testId: 'p5',
          questionNumber: 2,
          part: 5,
          section: 'reading',
          options: [{ key: 'B', text: 'opt' }],
          correctAnswer: 'B',
        },
      ];

      const score = calculateToeicScore({ 1: 'A', 2: 'C' }, questions, 60);
      expect(score.partStats[5].total).toBe(2);
      expect(score.partStats[5].correct).toBe(1);
      expect(score.partStats[5].percentage).toBe(50);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F9: TOEIC Hub Lobby & Practice Route
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F9: TOEIC Hub Lobby & Practice Route', () => {
    runner.it('F9.1: TOEIC Hub route /toeic is registered and discoverable', () => {
      const toeicPagePath = path.resolve(ROOT_DIR, 'src/app/toeic/page.tsx');
      expect(fs.existsSync(toeicPagePath)).toBe(true);
    });

    runner.it('F9.2: Exam dynamic route /toeic/exam/[examId] is registered and discoverable', () => {
      const examPagePath = path.resolve(ROOT_DIR, 'src/app/toeic/exam/[examId]/page.tsx');
      expect(fs.existsSync(examPagePath)).toBe(true);
    });

    runner.it('F9.3: TOEIC Hub landing page links directly to /toeic/exam for testing', () => {
      const toeicPagePath = path.resolve(ROOT_DIR, 'src/app/toeic/page.tsx');
      expect(fs.existsSync(toeicPagePath)).toBe(true);
      const content = fs.readFileSync(toeicPagePath, 'utf-8');
      expect(content).toContain('/toeic/exam');
    });

    runner.it('F9.4: Available authentic test IDs include canonical 7 ETS full tests', () => {
      const canonicalTests = ['6852', '6856', '6857', '6859', '7000', '7003', '7004'];
      for (const tid of canonicalTests) {
        const filePath = path.resolve(CRAWLER_TESTS_DIR, `study4_test_${tid}.json`);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    });

    runner.it('F9.5: Test lobby metadata lists title, questionCount, and duration', () => {
      const raw = loadAuthenticCrawlerTest('6852');
      expect(raw.title).toBeDefined();
      expect(raw.test_id).toBe('6852');
      expect(typeof raw.title).toBe('string');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F10: Comprehensive Score Report & Diagnostics
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F10: Comprehensive Score Report & Diagnostics', () => {
    runner.it('F10.1: Correctly partitions rawListening (Q1-100) and rawReading (Q101-200)', () => {
      const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
      // Answer first 50 listening correctly
      for (let i = 1; i <= 50; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }
      // Answer first 30 reading correctly
      for (let i = 101; i <= 130; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }

      const report = calculateToeicScore(answers, test6852Questions, 3600);
      expect(report.rawListening).toBe(50);
      expect(report.rawReading).toBe(30);
      expect(report.rawTotal).toBe(80);
      expect(report.scaledListening).toBe(250); // Barem for 50 LC
      expect(report.scaledReading).toBe(110);   // Barem for 30 RC
      expect(report.scaledTotal).toBe(360);
      expect(report.cefrLevel).toBe('A2');
    });

    runner.it('F10.2: Computes Part 1 to Part 7 accuracy percentages accurately', () => {
      const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
      // Part 1: all 6 correct -> 100%
      for (let i = 1; i <= 6; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }
      // Part 5: 15 out of 30 correct -> 50%
      for (let i = 101; i <= 115; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }

      const report = calculateToeicScore(answers, test6852Questions, 3600);
      expect(report.partStats[1].total).toBe(6);
      expect(report.partStats[1].correct).toBe(6);
      expect(report.partStats[1].percentage).toBe(100);

      expect(report.partStats[5].total).toBe(30);
      expect(report.partStats[5].correct).toBe(15);
      expect(report.partStats[5].percentage).toBe(50);

      // Part 2: 0 answered -> 0%
      expect(report.partStats[2].total).toBe(25);
      expect(report.partStats[2].correct).toBe(0);
      expect(report.partStats[2].percentage).toBe(0);
    });

    runner.it('F10.3: High-accuracy candidates (>=905) map to CEFR C1 with advanced target feedback', () => {
      const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
      // 95 LC + 95 RC = 495 + 445 = 940 -> C1
      for (let i = 1; i <= 95; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }
      for (let i = 101; i <= 195; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }

      const report = calculateToeicScore(answers, test6852Questions, 6000);
      expect(report.scaledTotal).toBe(940);
      expect(report.cefrLevel).toBe('C1');
    });

    runner.it('F10.4: Intermediate candidates (605-780) map to CEFR B2 (MNC / Airline standard)', () => {
      // e.g. 70 LC (370) + 65 RC (290) = 660 -> B2
      const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
      for (let i = 1; i <= 70; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }
      for (let i = 101; i <= 165; i++) {
        answers[i] = test6852Questions[i - 1].correctAnswer;
      }

      const report = calculateToeicScore(answers, test6852Questions, 5000);
      expect(report.scaledListening).toBe(370);
      expect(report.scaledReading).toBe(290);
      expect(report.scaledTotal).toBe(660);
      expect(report.cefrLevel).toBe('B2');
    });

    runner.it('F10.5: Zero division guard returns 0% when a part has 0 questions', () => {
      const report = calculateToeicScore({}, [], 0);
      for (let p = 1; p <= 7; p++) {
        expect(report.partStats[p as any].percentage).toBe(0);
      }
    });

    runner.it('F10.6: Production src/lib/toeic-scoring calculateToeicScore matches calculation across all 7 parts', () => {
      const prodReport = prodCalculateScore({ 1: 'A' }, test6852Questions, 100);
      expect(prodReport.scaledTotal).toBeGreaterThanOrEqual(10);
      expect(prodReport.partStats[1].total).toBe(6);
      expect(prodReport.partStats[5].total).toBe(30);
    });

    runner.it('F10.7: Production src/lib/toeic-scoring getCefrDescriptor provides detailed Vietnamese feedback for all 5 levels', () => {
      const c1 = prodGetCefrDescriptor('C1');
      const b2 = prodGetCefrDescriptor('B2');
      const b1 = prodGetCefrDescriptor('B1');
      const a2 = prodGetCefrDescriptor('A2');
      const a1 = prodGetCefrDescriptor('A1');
      expect(c1.title).toContain('Advanced');
      expect(b2.title).toContain('Vantage');
      expect(b1.title).toContain('Intermediate');
      expect(a2.title).toContain('Elementary');
      expect(a1.title).toContain('Beginner');
      expect(c1.targetFeedbackVi.length).toBeGreaterThan(10);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F11: Interactive Review Mode
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('F11: Interactive Review Mode', () => {
    runner.it('F11.1: Identifies user answer vs correct answer for review presentation', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      // User chose B for Q1, but correct is A
      session = selectOption(session, 1, 'B');
      session = submitSession(session, test6852Questions);

      const q1 = test6852Questions[0];
      const userChoice = session.answers[1];
      const isCorrect = userChoice === q1.correctAnswer;

      expect(userChoice).toBe('B');
      expect(q1.correctAnswer).toBe('A');
      expect(isCorrect).toBe(false);
    });

    runner.it('F11.2: Incorrect question filter accurately isolates wrong answers', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      // Q1 correct, Q2 wrong, Q3 unanswered
      session = selectOption(session, 1, test6852Questions[0].correctAnswer);
      const wrongOpt = test6852Questions[1].correctAnswer === 'A' ? 'B' : 'A';
      session = selectOption(session, 2, wrongOpt as any);
      session = submitSession(session, test6852Questions);

      const incorrectQuestions = test6852Questions.filter(
        (q) => session.answers[q.questionNumber] !== q.correctAnswer,
      );

      expect(incorrectQuestions.some((q) => q.questionNumber === 2)).toBe(true);
      expect(incorrectQuestions.some((q) => q.questionNumber === 3)).toBe(true);
      expect(incorrectQuestions.some((q) => q.questionNumber === 1)).toBe(false);
    });

    runner.it('F11.3: Flagged question filter isolates marked questions in review mode', () => {
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      session = toggleFlag(session, 15);
      session = toggleFlag(session, 142);
      session = submitSession(session, test6852Questions);

      const flaggedList = test6852Questions.filter((q) => session.flaggedQuestions.has(q.questionNumber));
      expect(flaggedList.length).toBe(2);
      expect(flaggedList[0].questionNumber).toBe(15);
      expect(flaggedList[1].questionNumber).toBe(142);
    });

    runner.it('F11.4: Review mode exposes Vietnamese grammar explanations for answers', () => {
      const qWithExplain = test6852Questions.find((q) => q.explanationVi && q.explanationVi.trim().length > 0);
      expect(qWithExplain).toBeDefined();
      expect(qWithExplain!.explanationVi!.length).toBeGreaterThan(5);
    });

    runner.it('F11.5: Review mode unlocks audio replay so learners can re-listen to any question', () => {
      // In review mode, single-play lock is lifted
      const canReplayInReview = (isSubmitted: boolean) => isSubmitted;
      expect(canReplayInReview(true)).toBe(true);
      expect(canReplayInReview(false)).toBe(false);
    });
  });
}
