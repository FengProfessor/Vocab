/**
 * Tier 4: Real-World Workload Scenarios Test Suite for TOEIC Real Exam Simulation
 * Verifies end-to-end user workflows and authentic exam simulations:
 * - S1: Full 200-Question Authentic ETS Exam Simulation (Start -> Progress -> Submit -> 990 Score -> Review)
 * - S2: 46-Question Part 5 & 6 Reading Mini-Test Practice with Instant Explanations
 * - S3: 100-Question Part 1-4 Listening Immersion Run with Audio Clustering
 * - S4: 54-Question Part 7 Commercial Reading Master Challenge (Single, Double, Triple Passages)
 * - S5: Browser Crash & Exam Session Resumption Workflow
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  assembleUnified200QTest,
  createExamSession,
  selectOption,
  toggleFlag,
  jumpToQuestion,
  tickTimer,
  submitSession,
  getPaletteState,
  serializeSession,
  deserializeSession,
  computeAudioGroupIndex,
  calculateToeicScore,
  ToeicUnifiedQuestion,
} from './test-harness';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  const questions = assembleUnified200QTest('6852');
  const part5And6Questions = questions.filter((q) => q.part === 5 || q.part === 6);
  const listeningQuestions = questions.filter((q) => q.section === 'listening');
  const part7Questions = questions.filter((q) => q.part === 7);

  // ──────────────────────────────────────────────────────────────────────────
  // S1: Full 200-Question Authentic ETS Exam Simulation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S1: Full 200-Question Authentic ETS Exam Simulation', () => {
    runner.it('S1.1: Complete 200Q exam run from initiation to score card and review mode', () => {
      // 1. Candidate initiates full simulation (Test 6852, 200 questions, 120 minutes)
      let session = createExamSession({
        examId: '6852',
        mode: 'real_exam',
        totalQuestions: 200,
        timeLimitSeconds: 7200,
      });

      expect(session.totalQuestions).toBe(200);
      expect(session.timeRemainingSeconds).toBe(7200);
      expect(session.currentQuestionNumber).toBe(1);

      // 2. Candidate works through Listening (Q1 to Q100)
      // Answer 80 Listening questions correctly, 10 incorrectly, leave 10 blank
      for (let qnum = 1; qnum <= 80; qnum++) {
        session = selectOption(session, qnum, questions[qnum - 1].correctAnswer);
        session = jumpToQuestion(session, qnum);
      }
      for (let qnum = 81; qnum <= 90; qnum++) {
        const wrong = questions[qnum - 1].correctAnswer === 'A' ? 'B' : 'A';
        session = selectOption(session, qnum, wrong as any);
      }
      // Flag Q15, Q42, Q78
      session = toggleFlag(session, 15);
      session = toggleFlag(session, 42);
      session = toggleFlag(session, 78);

      // 3. Candidate transitions to Reading (Q101 to Q200)
      // Answer 75 Reading questions correctly, 15 incorrectly, leave 10 blank
      for (let qnum = 101; qnum <= 175; qnum++) {
        session = selectOption(session, qnum, questions[qnum - 1].correctAnswer);
      }
      for (let qnum = 176; qnum <= 190; qnum++) {
        const wrong = questions[qnum - 1].correctAnswer === 'C' ? 'D' : 'C';
        session = selectOption(session, qnum, wrong as any);
      }
      // Flag Q180, Q195
      session = toggleFlag(session, 180);
      session = toggleFlag(session, 195);

      // 4. Simulate 105 minutes elapsed (6300 seconds)
      session = tickTimer(session, 6300);
      expect(session.timeRemainingSeconds).toBe(900); // 15 mins left

      // 5. Check submission modal counters
      const answeredCount = Object.keys(session.answers).length;
      const unansweredCount = session.totalQuestions - answeredCount;
      const flaggedCount = session.flaggedQuestions.size;

      expect(answeredCount).toBe(180); // 80+10 LC + 75+15 RC
      expect(unansweredCount).toBe(20);
      expect(flaggedCount).toBe(5);

      // 6. Candidate submits exam
      session = submitSession(session, questions);
      expect(session.isSubmitted).toBe(true);
      expect(session.scoreResult).toBeDefined();

      const score = session.scoreResult!;
      expect(score.rawListening).toBe(80);
      expect(score.rawReading).toBe(75);
      expect(score.rawTotal).toBe(155);

      // Barem check: 80 LC = 420; 75 RC = 340 -> Total = 760 (B2)
      expect(score.scaledListening).toBe(420);
      expect(score.scaledReading).toBe(340);
      expect(score.scaledTotal).toBe(760);
      expect(score.cefrLevel).toBe('B2');

      // 7. Verify Part 1 to 7 accuracy breakdown
      for (let p = 1; p <= 7; p++) {
        expect(score.partStats[p as any].total).toBeGreaterThan(0);
        expect(score.partStats[p as any].percentage).toBeGreaterThanOrEqual(0);
        expect(score.partStats[p as any].percentage).toBeLessThanOrEqual(100);
      }

      // 8. Review Mode navigation & filtering
      const wrongList = questions.filter(
        (q) => session.answers[q.questionNumber] !== q.correctAnswer,
      );
      expect(wrongList.length).toBe(45); // 10 wrong LC + 10 blank LC + 15 wrong RC + 10 blank RC

      // Verify Vietnamese explanation exists on questions in review mode
      const wrongWithExplain = wrongList.find((q) => q.explanationVi);
      expect(wrongWithExplain).toBeDefined();
      expect(wrongWithExplain!.explanationVi!.length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S2: 46-Question Part 5 & 6 Reading Mini-Test Practice
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S2: 46-Question Part 5 & 6 Reading Mini-Test Practice', () => {
    runner.it('S2.1: Practice session with 46 questions (30 Part 5 + 16 Part 6) and instant feedback', () => {
      expect(part5And6Questions.length).toBe(46);

      let session = createExamSession({
        examId: 'practice-reading-p5-p6',
        mode: 'practice_part',
        totalQuestions: 46,
        timeLimitSeconds: 1800, // 30 minutes
      });

      // Answer 20 questions in Part 5
      let correctCount = 0;
      for (let i = 0; i < 20; i++) {
        const q = part5And6Questions[i];
        session = selectOption(session, q.questionNumber, q.correctAnswer);
        correctCount += 1;
      }

      // Part 6 questions contain cloze passage text
      const part6Sample = part5And6Questions[30]; // First Part 6 question
      expect(part6Sample.part).toBe(6);
      expect(part6Sample.passage).toBeDefined();

      session = submitSession(session, part5And6Questions);
      expect(session.isSubmitted).toBe(true);
      expect(session.scoreResult!.partStats[5].correct).toBe(20);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S3: 100-Question Part 1-4 Listening Immersion Simulation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S3: 100-Question Part 1-4 Listening Immersion Simulation', () => {
    runner.it('S3.1: Full listening section (100 Qs) with audio clustering across Parts 1 to 4', () => {
      expect(listeningQuestions.length).toBe(100);

      // Part 1: 6 questions with images & individual audio
      for (let i = 0; i < 6; i++) {
        expect(listeningQuestions[i].part).toBe(1);
        expect(listeningQuestions[i].audioUrl).toBeDefined();
        expect(listeningQuestions[i].imageUrl).toBeDefined();
      }

      // Part 2: 25 questions with audio-only, 3 options
      for (let i = 6; i < 31; i++) {
        expect(listeningQuestions[i].part).toBe(2);
        expect(listeningQuestions[i].options.length).toBe(3);
      }

      // Part 3: 39 questions across 13 audio conversation clusters
      const p3Clusters = new Set<string>();
      for (let i = 31; i < 70; i++) {
        expect(listeningQuestions[i].part).toBe(3);
        p3Clusters.add(listeningQuestions[i].audioUrl!);
      }
      expect(p3Clusters.size).toBe(13);

      // Part 4: 30 questions across 10 audio talk clusters
      const p4Clusters = new Set<string>();
      for (let i = 70; i < 100; i++) {
        expect(listeningQuestions[i].part).toBe(4);
        p4Clusters.add(listeningQuestions[i].audioUrl!);
      }
      expect(p4Clusters.size).toBe(10);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S4: 54-Question Part 7 Commercial Reading Master Challenge
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S4: 54-Question Part 7 Commercial Reading Master Challenge', () => {
    runner.it('S4.1: Part 7 contains 54 reading questions spanning single and multi-passages', () => {
      expect(part7Questions.length).toBe(54);

      // Every question has 4 options and valid passage text
      for (const q of part7Questions) {
        expect(q.part).toBe(7);
        expect(q.options.length).toBe(4);
        expect(typeof q.passage).toBe('string');
        expect(q.passage!.length).toBeGreaterThan(30);
      }
    });

    runner.it('S4.2: Candidate scoring 50/54 in Part 7 earns high Reading scaled score', () => {
      const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
      for (let i = 0; i < 50; i++) {
        answers[part7Questions[i].questionNumber] = part7Questions[i].correctAnswer;
      }

      const score = calculateToeicScore(answers, part7Questions, 3000);
      expect(score.rawReading).toBe(50);
      expect(score.scaledReading).toBe(215); // Barem for 50 RC
      expect(score.partStats[7].percentage).toBe(93); // 50/54 = 92.59% -> 93%
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // S5: Browser Crash & Exam Session Resumption Workflow
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S5: Browser Crash & Exam Session Resumption Workflow', () => {
    runner.it('S5.1: Session state is safely restored after sudden browser crash and page reload', () => {
      const mockStorage = setupMockBrowserEnvironment();
      try {
        const full = assembleUnified200QTest('6852');
        const storageKey = 'toeic_active_exam_session';

        // Phase 1: Candidate is taking exam, answered 87 questions, 45 minutes left
        let session = createExamSession({
          examId: '6852',
          mode: 'real_exam',
          totalQuestions: 200,
          timeLimitSeconds: 7200,
        });

        for (let q = 1; q <= 87; q++) {
          session = selectOption(session, q, full[q - 1].correctAnswer);
        }
        session = toggleFlag(session, 12);
        session = toggleFlag(session, 35);
        session = toggleFlag(session, 80);
        session = jumpToQuestion(session, 88);
        session = tickTimer(session, 4500); // 4500s elapsed -> 2700s remaining (45 mins)

        // Background autosave trigger
        mockStorage.setItem(storageKey, serializeSession(session));

        // Phase 2: Browser crashes! In-memory session lost.
        session = null as any;

        // Phase 3: Candidate re-opens page -> Re-hydrate from storage
        const storedData = mockStorage.getItem(storageKey);
        expect(storedData).toBeDefined();

        const restoredSession = deserializeSession(storedData!);
        expect(restoredSession.examId).toBe('6852');
        expect(restoredSession.currentQuestionNumber).toBe(88);
        expect(restoredSession.timeRemainingSeconds).toBe(2700);
        expect(Object.keys(restoredSession.answers).length).toBe(87);
        expect(restoredSession.flaggedQuestions.has(12)).toBe(true);
        expect(restoredSession.flaggedQuestions.has(35)).toBe(true);
        expect(restoredSession.flaggedQuestions.has(80)).toBe(true);

        // Phase 4: Candidate resumes, finishes remaining questions, and submits
        let active = restoredSession;
        for (let q = 88; q <= 200; q++) {
          active = selectOption(active, q, full[q - 1].correctAnswer);
        }
        active = submitSession(active, full);

        expect(active.isSubmitted).toBe(true);
        expect(active.scoreResult!.scaledTotal).toBe(990); // All 200 answered correctly
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });
}
