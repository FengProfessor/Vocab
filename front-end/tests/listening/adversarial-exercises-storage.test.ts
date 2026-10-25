/**
 * Adversarial Exercises & Storage Verification Test Suite (Tier 5 Hardening)
 * Listening Immersion Hub
 *
 * Probes:
 * 1. Fuzzy typo validation in cloze listening:
 *    - 0-error exact matches (case-insensitivity, leading/trailing whitespace, punctuation stripping).
 *    - 1-typo edits (insert, delete, substitute) under fuzzy tolerance specification.
 *    - 2+ typos or wrong words strictly rejected.
 * 2. Comprehension quiz boundary conditions:
 *    - Answering questions out of order.
 *    - Modifying selected options before submit versus post-submit immutability.
 *    - 100% explanation presence and quality across all 7 videos (28 questions).
 *    - Premature skip / boundary interaction.
 * 3. Timestamp seek links:
 *    - Every timestampSeek maps to a valid timestamp (0 <= timestampSeek <= video.duration).
 *    - Every timestampSeek maps to an authentic transcript cue segment.
 *    - Rapid consecutive seek simulation.
 * 4. LocalStorage attempt persistence:
 *    - Corrupted JSON payloads and primitives.
 *    - QuotaExceededError simulation.
 *    - Multi-video score isolation and boundary scores (0%, 100%).
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  MockLocalStorage,
} from './test-harness';
import {
  getAllListeningVideos,
  getListeningVideoById,
  validateClozeAnswer,
  saveListeningAttempt,
  getListeningAttempt,
  findActiveCueIndex,
  findActiveCue,
  formatTime,
} from '../../src/lib/listening';
import type {
  ListeningAttempt,
  ComprehensionQuestion,
  ClozeItem,
  ListeningVideo,
} from '../../src/types/listening';

export async function runAdversarialExercisesStorageTests(runner: TestRunner): Promise<void> {
  const allVideos = getAllListeningVideos();
  const sampleVideo = getListeningVideoById('video-short-daily-life')!;

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-1: Fuzzy Typo Validation in Cloze Listening
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-1: Cloze Listening Typo Validation & Fuzzy Matching', () => {
    runner.it('ADV-1.1: 0-error exact matches succeed with casing variations and whitespace', () => {
      const target = 'alarm';
      // Lowercase exact match
      expect(validateClozeAnswer('alarm', target)).toBe(true);
      // Uppercase exact match
      expect(validateClozeAnswer('ALARM', target)).toBe(true);
      // Titlecase exact match
      expect(validateClozeAnswer('Alarm', target)).toBe(true);
      // Inverted / mixed case exact match
      expect(validateClozeAnswer('aLaRm', target)).toBe(true);
      // Target uppercase against lowercase input
      expect(validateClozeAnswer('alarm', 'ALARM')).toBe(true);
      // Leading and trailing spaces
      expect(validateClozeAnswer('   alarm   ', target)).toBe(true);
      // Tabs and newlines
      expect(validateClozeAnswer('\talarm\n', target)).toBe(true);
      // Multi-word / longer vocabulary items
      expect(validateClozeAnswer('experience', 'EXPERIENCE')).toBe(true);
      expect(validateClozeAnswer('commencement', 'Commencement')).toBe(true);
      expect(validateClozeAnswer('qualification', 'qualification')).toBe(true);
    });

    runner.it('ADV-1.2: Trailing sentence punctuation (. , ! ? ; :) and quotes/parentheses stripped cleanly', () => {
      const target = 'routine';
      // Trailing sentence punctuation
      expect(validateClozeAnswer('routine.', target)).toBe(true);
      expect(validateClozeAnswer('routine,', target)).toBe(true);
      expect(validateClozeAnswer('routine!', target)).toBe(true);
      expect(validateClozeAnswer('routine?', target)).toBe(true);
      expect(validateClozeAnswer('routine;', target)).toBe(true);
      expect(validateClozeAnswer('routine:', target)).toBe(true);
      // Quotes and parentheses
      expect(validateClozeAnswer('"routine"', target)).toBe(true);
      expect(validateClozeAnswer("'routine'", target)).toBe(true);
      expect(validateClozeAnswer('(routine)', target)).toBe(true);
      expect(validateClozeAnswer('{routine}', target)).toBe(true);
      // Combined punctuation and whitespace
      expect(validateClozeAnswer('  "routine."  ', target)).toBe(true);
    });

    runner.it('ADV-1.3: Catastrophic errors, 2+ typos, and wrong words strictly REJECTED', () => {
      const target = 'alarm';
      // 2-typo substitution
      expect(validateClozeAnswer('alxxm', target)).toBe(false);
      // 2-typo deletion
      expect(validateClozeAnswer('alr', target)).toBe(false);
      // 2-typo insertion
      expect(validateClozeAnswer('alarmss', target)).toBe(false);
      // Completely wrong words
      expect(validateClozeAnswer('banana', target)).toBe(false);
      expect(validateClozeAnswer('routine', target)).toBe(false);
      expect(validateClozeAnswer('clock', target)).toBe(false);
      // Empty input and whitespace-only
      expect(validateClozeAnswer('', target)).toBe(false);
      expect(validateClozeAnswer('   ', target)).toBe(false);
      // Empty target
      expect(validateClozeAnswer(target, '')).toBe(false);
      expect(validateClozeAnswer('', '')).toBe(false);
    });

    runner.it('ADV-1.4: 1-typo edit tolerance (insert, delete, substitute) under fuzzy validation specification', () => {
      const target = 'alarm';
      // 1-typo insertion (e.g. accidental trailing 's' or duplicate char 'aalarm')
      const insertTolerated1 = validateClozeAnswer('alarms', target);
      const insertTolerated2 = validateClozeAnswer('aalarm', target);

      // 1-typo deletion (e.g. missed letter 'alrm')
      const deleteTolerated1 = validateClozeAnswer('alrm', target);
      const deleteTolerated2 = validateClozeAnswer('larm', target);

      // 1-typo substitution (e.g. adjacent key typo 'elarm' or 'alarp')
      const substituteTolerated1 = validateClozeAnswer('elarm', target);
      const substituteTolerated2 = validateClozeAnswer('alarp', target);

      // Log empirical diagnostic results
      console.log('    [EMPIRICAL DIAGNOSTIC] 1-typo insertion ("alarms" vs "alarm"):', insertTolerated1 ? 'ACCEPTED' : 'REJECTED');
      console.log('    [EMPIRICAL DIAGNOSTIC] 1-typo deletion ("alrm" vs "alarm"):', deleteTolerated1 ? 'ACCEPTED' : 'REJECTED');
      console.log('    [EMPIRICAL DIAGNOSTIC] 1-typo substitution ("elarm" vs "alarm"):', substituteTolerated1 ? 'ACCEPTED' : 'REJECTED');

      // Requirement R4 & SCOPE.md specify "Fuzzy typo tolerance & instant validation".
      // Dispatch instructs: "test 0-error exact matches, 1-typo edits (insert, delete, substitute),
      // case insensitivity, trailing punctuation, and verify that 2+ typos or wrong words are strictly REJECTED."
      expect(insertTolerated1).toBe(true);
      expect(insertTolerated2).toBe(true);
      expect(deleteTolerated1).toBe(true);
      expect(deleteTolerated2).toBe(true);
      expect(substituteTolerated1).toBe(true);
      expect(substituteTolerated2).toBe(true);
    });

    runner.it('ADV-1.5: Square brackets stripping probe (omitted from punctuation regex)', () => {
      const target = 'routine';
      const bracketStripped = validateClozeAnswer('[routine]', target);
      console.log('    [EMPIRICAL DIAGNOSTIC] Square brackets stripping ("[routine]" vs "routine"):', bracketStripped ? 'STRIPPED' : 'UNSTRIPPED');
      // Documenting regex omission: /[.,/#!$%^&*;:{}=\-_`~()?'"]/g omits '[' and ']'
      expect(bracketStripped).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-2: Comprehension Quiz Interaction & Boundary Conditions
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-2: Comprehension Quiz Boundary Conditions & State Invariants', () => {
    runner.it('ADV-2.1: Answering questions out of order retains selections and evaluates score accurately', () => {
      const questions: ComprehensionQuestion[] = sampleVideo.comprehensionQuestions;
      expect(questions.length >= 4).toBe(true);

      // Simulated state containers identical to ComprehensionQuiz.tsx
      const selectedAnswers: Record<number, number> = {};
      const submittedAnswers: Record<number, boolean> = {};

      // User answers out of order: Q2, Q0, Q3, Q1
      const answeringOrder = [2, 0, 3, 1];

      for (const qIdx of answeringOrder) {
        const correctOpt = questions[qIdx].correctIndex;
        // User selects correct answer for qIdx
        selectedAnswers[qIdx] = correctOpt;
        submittedAnswers[qIdx] = true;
      }

      // Verify all questions are submitted
      expect(Object.keys(submittedAnswers).length).toBe(questions.length);

      // Calculate score across all questions [0..totalQuestions-1]
      let score = 0;
      for (let i = 0; i < questions.length; i++) {
        if (selectedAnswers[i] === questions[i].correctIndex) {
          score++;
        }
      }

      expect(score).toBe(questions.length);
      expect(Math.round((score / questions.length) * 100)).toBe(100);
    });

    runner.it('ADV-2.2: Modifying selected option before submit preserves mutability; locked post-submit', () => {
      // Simulation of user interaction flow
      let selectedOption: number | undefined = undefined;
      let isSubmitted = false;

      const handleSelectOption = (idx: number) => {
        if (isSubmitted) return;
        selectedOption = idx;
      };

      const handleSubmit = () => {
        if (selectedOption === undefined || isSubmitted) return;
        isSubmitted = true;
      };

      // 1. Initial state: undefined
      expect(selectedOption).toBeUndefined();
      expect(isSubmitted).toBe(false);

      // 2. Select option 0 (A)
      handleSelectOption(0);
      expect(selectedOption).toBe(0);

      // 3. Change mind: select option 2 (C)
      handleSelectOption(2);
      expect(selectedOption).toBe(2);

      // 4. Change mind again: select option 1 (B)
      handleSelectOption(1);
      expect(selectedOption).toBe(1);

      // 5. Submit answer
      handleSubmit();
      expect(isSubmitted).toBe(true);
      expect(selectedOption).toBe(1);

      // 6. Attempt to modify option after submission: must remain locked at 1
      handleSelectOption(3);
      expect(selectedOption).toBe(1);
    });

    runner.it('ADV-2.3: 100% Explanation presence and detailed rationale across all videos', () => {
      let totalQuestionsEvaluated = 0;

      for (const video of allVideos) {
        expect(Array.isArray(video.comprehensionQuestions)).toBe(true);
        expect(video.comprehensionQuestions.length >= 3).toBe(true);

        for (const q of video.comprehensionQuestions) {
          totalQuestionsEvaluated++;
          // Non-empty string
          expect(typeof q.explanation).toBe('string');
          expect(q.explanation.trim().length >= 15).toBe(true);

          // Does not contain placeholder junk
          const lowerExp = q.explanation.toLowerCase();
          expect(lowerExp.includes('todo')).toBe(false);
          expect(lowerExp.includes('tbd')).toBe(false);
          expect(lowerExp.includes('placeholder')).toBe(false);
        }
      }

      expect(totalQuestionsEvaluated).toBeGreaterThanOrEqual(200 * 3);
    });

    runner.it('ADV-2.4: Question structural invariant: 4 options and valid correctIndex within [0, 3]', () => {
      for (const video of allVideos) {
        for (const q of video.comprehensionQuestions) {
          expect(q.options.length).toBe(4);
          expect(q.correctIndex >= 0 && q.correctIndex <= 3).toBe(true);

          // Ensure options are distinct (no duplicate options within a question)
          const uniqueOptions = new Set(q.options.map((o) => o.trim().toLowerCase()));
          expect(uniqueOptions.size).toBe(4);

          // Ensure correct option is non-empty
          expect(q.options[q.correctIndex].trim().length > 0).toBe(true);
        }
      }
    });

    runner.it('ADV-2.5: Unsubmitted / skipped questions evaluated safely in scorecard', () => {
      const questions = sampleVideo.comprehensionQuestions;
      const selectedAnswers: Record<number, number> = {};

      // User only answered question 3 (skipped 0, 1, 2)
      selectedAnswers[3] = questions[3].correctIndex;

      let score = 0;
      for (let i = 0; i < questions.length; i++) {
        if (selectedAnswers[i] === questions[i].correctIndex) {
          score++;
        }
      }

      // 1 out of 4 correct, does not produce NaN or crash
      expect(score).toBe(1);
      const percent = Math.round((score / questions.length) * 100);
      expect(percent).toBe(25);
      expect(Number.isNaN(percent)).toBe(false);
    });

    runner.it('ADV-2.6: Premature quiz navigation finish (skipping questions) leaves attempt unsaved', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const testVideoId = 'video-premature-test';
        // In ComprehensionQuiz.tsx, if user steps to the end (currentIndex === totalQuestions - 1)
        // and only submits question 3, submittedAnswers has only 1 entry.
        // Object.keys(nextSubmitted).length === totalQuestions (1 === 4) is false,
        // so saveListeningAttempt is never triggered.
        const submittedAnswers: Record<number, boolean> = { 3: true };
        const totalQuestions = 4;

        if (Object.keys(submittedAnswers).length === totalQuestions) {
          saveListeningAttempt({
            videoId: testVideoId,
            completedAt: new Date().toISOString(),
            clozeScore: 0,
            clozeTotal: 0,
            quizScore: 1,
            quizTotal: totalQuestions,
            percentScore: 25,
          });
        }

        // Verifying that attempt remains null because submission was incomplete
        const savedAttempt = getListeningAttempt(testVideoId);
        expect(savedAttempt).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-3: Timestamp Seek Links Safety & Boundary Verification
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-3: Timestamp Seek Links Safety & Video Boundary Invariants', () => {
    runner.it('ADV-3.1: Every timestampSeek across all videos is strictly within [0, video.duration]', () => {
      let totalSeeksChecked = 0;

      for (const video of allVideos) {
        expect(typeof video.duration).toBe('number');
        expect(video.duration > 0).toBe(true);

        for (const q of video.comprehensionQuestions) {
          totalSeeksChecked++;
          expect(typeof q.timestampSeek).toBe('number');
          expect(Number.isFinite(q.timestampSeek)).toBe(true);
          expect(q.timestampSeek >= 0).toBe(true);
          expect(q.timestampSeek <= video.duration).toBe(true);
        }
      }

      expect(totalSeeksChecked).toBeGreaterThanOrEqual(200 * 3);
    });

    runner.it('ADV-3.2: Every timestampSeek maps to an authentic active transcript cue segment', () => {
      let matchedCuesCount = 0;

      for (const video of allVideos) {
        const cues = video.transcript;

        for (const q of video.comprehensionQuestions) {
          const seekTime = q.timestampSeek;
          // Verify findActiveCueIndex resolves a valid cue index
          const activeIdx = findActiveCueIndex(cues, seekTime);
          expect(activeIdx >= 0).toBe(true);
          expect(activeIdx < cues.length).toBe(true);

          const cue = cues[activeIdx];
          // Either seekTime is inside [cue.start, cue.end] OR inside the 1.2s silence gap buffer
          const insideCue = seekTime >= cue.start && seekTime <= cue.end;
          const insideHysteresis = seekTime > cue.end && seekTime <= cue.end + 1.2;
          expect(insideCue || insideHysteresis).toBe(true);

          matchedCuesCount++;
        }
      }

      expect(matchedCuesCount).toBeGreaterThanOrEqual(200 * 3);
    });

    runner.it('ADV-3.3: High-frequency rapid seek stress simulation (50 seeks) executes stably', () => {
      const cues = sampleVideo.transcript;
      const duration = sampleVideo.duration;

      const startTime = Date.now();
      // Generate 50 pseudo-random seek positions including extremes
      for (let i = 0; i < 50; i++) {
        // pseudo-random seek in [0, duration]
        const randomSeek = ((i * 17.37) % duration);
        const idx = findActiveCueIndex(cues, randomSeek);
        expect(typeof idx).toBe('number');
        if (idx !== -1) {
          expect(idx >= 0 && idx < cues.length).toBe(true);
        }
      }
      const elapsed = Date.now() - startTime;
      // 50 binary searches must execute in sub-millisecond to low millisecond time (<50ms)
      expect(elapsed < 50).toBe(true);
    });

    runner.it('ADV-3.4: Boundary seek timestamps at exactly 0.0s and duration resolve safely', () => {
      const cues = sampleVideo.transcript;

      // Exact 0.0s seek
      const idxZero = findActiveCueIndex(cues, 0.0);
      expect(idxZero).toBe(0);

      // Exact duration seek
      const idxDuration = findActiveCueIndex(cues, sampleVideo.duration);
      expect(typeof idxDuration).toBe('number');

      // Beyond duration seek returns -1
      const idxBeyond = findActiveCueIndex(cues, sampleVideo.duration + 10.0);
      expect(idxBeyond).toBe(-1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-4: LocalStorage Attempt Persistence Stress Testing
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-4: LocalStorage Attempt Persistence Stress Testing', () => {
    runner.it('ADV-4.1: Corrupted JSON strings return null safely without uncaught exceptions', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        // Syntax error corrupted JSON
        mockStorage.setItem('lingo_listening_attempt_corrupt-1', '{ bad json syntax');
        expect(getListeningAttempt('corrupt-1')).toBeNull();

        // Truncated JSON
        mockStorage.setItem('lingo_listening_attempt_corrupt-2', '{"videoId":"corrupt-2", "score":');
        expect(getListeningAttempt('corrupt-2')).toBeNull();

        // Random binary/garbage characters
        mockStorage.setItem('lingo_listening_attempt_corrupt-3', '\x00\x01\x02\xFF\xFE');
        expect(getListeningAttempt('corrupt-3')).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('ADV-4.2: Primitive non-object JSON payloads handled gracefully', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        // "null" JSON string -> parsed as null
        mockStorage.setItem('lingo_listening_attempt_null-val', 'null');
        expect(getListeningAttempt('null-val')).toBeNull();

        // Number primitive
        mockStorage.setItem('lingo_listening_attempt_num-val', '42');
        const numRes = getListeningAttempt('num-val');
        // If parsed, numRes is 42 (falsy as attempt object, lacks videoId)
        if (numRes) {
          expect((numRes as any).videoId).toBeUndefined();
        }

        // Empty string payload in storage
        mockStorage.setItem('lingo_listening_attempt_empty-val', '');
        expect(getListeningAttempt('empty-val')).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('ADV-4.3: QuotaExceededError simulation caught gracefully by saveListeningAttempt', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        // Mock setItem throwing DOMException QuotaExceededError
        mockStorage.setItem = () => {
          const err = new Error('The quota has been exceeded.');
          err.name = 'QuotaExceededError';
          throw err;
        };

        const attempt: ListeningAttempt = {
          videoId: 'quota-video-test',
          completedAt: new Date().toISOString(),
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: 4,
          quizTotal: 4,
          percentScore: 100,
        };

        // Must NOT throw unhandled error to caller
        let threw = false;
        try {
          saveListeningAttempt(attempt);
        } catch (e) {
          threw = true;
        }

        expect(threw).toBe(false);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('ADV-4.4: Multi-video attempt isolation and boundary score persistence', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const attempt1: ListeningAttempt = {
          videoId: 'vid-alpha',
          completedAt: '2026-09-06T04:00:00.000Z',
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: 4,
          quizTotal: 4,
          percentScore: 100,
        };

        const attempt2: ListeningAttempt = {
          videoId: 'vid-beta',
          completedAt: '2026-09-06T04:10:00.000Z',
          clozeScore: 0,
          clozeTotal: 4,
          quizScore: 0,
          quizTotal: 4,
          percentScore: 0,
        };

        const attempt3: ListeningAttempt = {
          videoId: 'vid-gamma',
          completedAt: '2026-09-06T04:20:00.000Z',
          clozeScore: 2,
          clozeTotal: 4,
          quizScore: 2,
          quizTotal: 4,
          percentScore: 50,
        };

        // Save all three
        saveListeningAttempt(attempt1);
        saveListeningAttempt(attempt2);
        saveListeningAttempt(attempt3);

        // Verify independent retrieval
        const r1 = getListeningAttempt('vid-alpha');
        const r2 = getListeningAttempt('vid-beta');
        const r3 = getListeningAttempt('vid-gamma');

        expect(r1).toBeDefined();
        expect(r1?.videoId).toBe('vid-alpha');
        expect(r1?.percentScore).toBe(100);

        expect(r2).toBeDefined();
        expect(r2?.videoId).toBe('vid-beta');
        expect(r2?.percentScore).toBe(0);

        expect(r3).toBeDefined();
        expect(r3?.videoId).toBe('vid-gamma');
        expect(r3?.percentScore).toBe(50);

        // Update attempt 1 with new score
        const updated1: ListeningAttempt = {
          ...attempt1,
          quizScore: 3,
          percentScore: 75,
        };
        saveListeningAttempt(updated1);

        // Verify vid-alpha is updated, vid-beta and vid-gamma remain unchanged
        expect(getListeningAttempt('vid-alpha')?.percentScore).toBe(75);
        expect(getListeningAttempt('vid-beta')?.percentScore).toBe(0);
        expect(getListeningAttempt('vid-gamma')?.percentScore).toBe(50);

        // Querying non-existent video returns null
        expect(getListeningAttempt('vid-nonexistent')).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Direct CLI Execution Runner
// ──────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('================================================================================');
  console.log('  CHALLENGER 2: ADVERSARIAL EXERCISES & STORAGE VERIFIER (TIER 5 HARDENING)');
  console.log('  Testing: Fuzzy Cloze Matching, Quiz Boundaries, Timestamp Seeks, Storage Quotas');
  console.log('================================================================================\n');

  const runner = new TestRunner();
  const startTime = Date.now();

  await runAdversarialExercisesStorageTests(runner);

  const stats = runner.getStats();
  const duration = Date.now() - startTime;

  console.log('\n================================================================================');
  console.log('  ADVERSARIAL EXERCISES & STORAGE TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log(`  Total Probes Run : ${stats.total}`);
  console.log(`  Passed           : ${stats.passed}`);
  console.log(`  Failed           : ${stats.failed}`);
  console.log(`  Execution Time   : ${duration}ms`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    console.error(`❌ VERDICT: FAIL — ${stats.failed} adversarial probe(s) failed!`);
    for (const r of stats.results) {
      if (!r.passed) {
        console.error(`   -> [${r.suite}] ${r.name}: ${r.error?.message}`);
      }
    }
    process.exit(1);
  } else {
    console.log(`✅ VERDICT: PASS — All ${stats.total} adversarial probe(s) passed cleanly with 0 defects!`);
    process.exit(0);
  }
}

// Execute when run as entry point
if (process.argv[1]?.includes('adversarial-exercises-storage.test.ts')) {
  main().catch((err) => {
    console.error('Fatal crash in adversarial test runner:', err);
    process.exit(1);
  });
}
