/**
 * Tier 4: Real-World Scenarios Test Suite for VSTEP Standardized Exam Engine
 *
 * Exercises authentic, complete candidate journeys and multi-step integration workflows:
 * - S1.1: Complete Learner Full Simulation Workflow (Start -> Answer -> Flag -> Timeout -> Score -> Review)
 * - S1.2: Multi-Round Practice Session (3 consecutive rounds with 0% question overlap in 'unseen' mode)
 * - S1.3: Spaced Repetition Remediation Workflow (Mistakes mode re-test -> 0 mistakes remaining)
 * - S1.4: Skill Progress Reset Workflow (Partial reset preserves other skills)
 * - S1.5: Cyber Attack Defense Simulation (Honeypot trap -> Silent Data Poisoning -> Bot persistence)
 * - S1.6: Guest-First Practice to Certificate Sync Simulation
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  oracleCompositeScore,
} from './test-harness';

import {
  loadRawVstepExam,
  loadVstepExamSafe,
  getVstepQuestionExplanation,
  loadVstepSkillPractice,
} from '../../src/lib/vstep-test-loader';

import {
  calculateVstepScore,
  calculateListeningScore,
  calculateReadingScore,
  getCefrDescription,
} from '../../src/lib/vstep-scoring';

import {
  generateVstepSessionToken,
  verifyVstepSessionToken,
  isVstepHoneypot,
  flagClientAsBot,
  isClientFlaggedAsBot,
  poisonVstepQuestion,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
} from '../../src/lib/vstep-anti-scraping';

import {
  VSTEP_HISTORY_STORAGE_KEY,
  getVstepHistory,
  recordVstepQuestionAnswer,
  batchRecordVstepAnswers,
  getAnsweredVstepQuestionIds,
  getIncorrectVstepQuestionIds,
  getVstepProgressStats,
  resetVstepSkillProgress,
  resetAllVstepProgress,
} from '../../src/lib/vstep-history';

import { VstepExam, VstepScoreResult, VstepQuestion } from '../../src/lib/vstep-types';

export async function runTier4Tests(runner: TestRunner) {
  runner.beforeEach(() => {
    setupMockBrowserEnvironment();
    resetAllVstepProgress();
  });

  runner.afterEach(() => {
    teardownMockBrowserEnvironment();
  });

  await runner.describe('Tier 4: Scenario 1 — Complete Candidate Exam & Practice Workflows', async () => {
    // S1.1
    await runner.it('S1.1: Complete Candidate Full Simulation: Start -> Answer 50/75 -> Flag 5 -> Auto-Submit -> Score Certificate -> Review', () => {
      const candidateIp = '103.15.22.84';
      const testId = 'vstep-mock-01';

      // 1. Candidate initiates exam room
      const safeExam = loadVstepExamSafe(testId);
      expect(safeExam).not.toBeNull();
      expect(safeExam!.duration).toBe(172);

      // Session token issued by server
      const sessionToken = generateVstepSessionToken(candidateIp, testId, 10800);
      expect(verifyVstepSessionToken(sessionToken, candidateIp, testId)).toBe(true);

      // 2. Candidate answers questions across Listening and Reading
      const rawExam = loadRawVstepExam(testId);
      expect(rawExam).not.toBeNull();

      const candidateAnswers: Record<string, number> = {};
      const flaggedQuestions = new Set<string>();

      // Candidate answers 25 Listening questions (first 25), flags 3
      const listeningQuestions: VstepQuestion[] = [];
      rawExam?.sections.find((s) => s.type === 'listening')?.tasks.forEach((t) => {
        if (t.questions) listeningQuestions.push(...t.questions);
      });
      expect(listeningQuestions.length).toBe(35);

      for (let i = 0; i < 25; i++) {
        const q = listeningQuestions[i];
        // 20 correct, 5 incorrect
        candidateAnswers[q.id] = i < 20 ? (q.answer ?? 0) : ((q.answer ?? 0) + 1) % 4;
        if (i >= 20 && i < 23) {
          flaggedQuestions.add(q.id);
        }
      }

      // Candidate answers 25 Reading questions (first 25), flags 2
      const readingQuestions: VstepQuestion[] = [];
      rawExam?.sections.find((s) => s.type === 'reading')?.tasks.forEach((t) => {
        if (t.questions) readingQuestions.push(...t.questions);
      });
      expect(readingQuestions.length).toBe(40);

      for (let i = 0; i < 25; i++) {
        const q = readingQuestions[i];
        // 20 correct, 5 incorrect
        candidateAnswers[q.id] = i < 20 ? (q.answer ?? 0) : ((q.answer ?? 0) + 1) % 4;
        if (i >= 20 && i < 22) {
          flaggedQuestions.add(q.id);
        }
      }

      // 25 unanswered questions remain (10 in listening, 15 in reading)
      expect(Object.keys(candidateAnswers).length).toBe(50);
      expect(flaggedQuestions.size).toBe(5);

      // 3. Timer elapses: candidate auto-submits payload to server
      let listeningCorrect = 0;
      let listeningTotal = 35;
      let readingCorrect = 0;
      let readingTotal = 40;

      listeningQuestions.forEach((q) => {
        if (candidateAnswers[q.id] !== undefined && candidateAnswers[q.id] === q.answer) {
          listeningCorrect++;
        }
      });
      readingQuestions.forEach((q) => {
        if (candidateAnswers[q.id] !== undefined && candidateAnswers[q.id] === q.answer) {
          readingCorrect++;
        }
      });

      expect(listeningCorrect).toBe(20);
      expect(readingCorrect).toBe(20);

      // 4. Server computes score certificate
      const scoreResult: VstepScoreResult = calculateVstepScore({
        listeningCorrect,
        listeningTotal,
        readingCorrect,
        readingTotal,
      });

      // Listening: 20/35 * 10 = 5.714 -> rounded to 5.5
      expect(scoreResult.listeningScore).toBe(5.5);
      // Reading: 20/40 * 10 = 5.0 -> 5.0
      expect(scoreResult.readingScore).toBe(5.0);
      // Overall: (5.5 + 5.0) / 2 = 5.25 -> rounded to 5.5 (B1)
      expect(scoreResult.overallScore).toBe(5.5);
      expect(scoreResult.cefrLevel).toBe('B1');

      const desc = getCefrDescription(scoreResult.cefrLevel);
      expect(desc.titleVi).toContain('B1');

      // 5. Candidate enters Review Mode and checks explanation of flagged question
      const flaggedQId = Array.from(flaggedQuestions)[0];
      const explanation = getVstepQuestionExplanation(testId, flaggedQId);
      expect(explanation).not.toBeNull();
      expect(typeof explanation?.answer).toBe('number');
    });

    // S1.2
    await runner.it('S1.2: Multi-Round Practice Session: 3 consecutive rounds in unseen mode maintain 0% duplicate questions', () => {
      // Round 1: Learner answers 5 questions
      const r1Questions = ['R1Q1', 'R1Q2', 'R1Q3', 'R1Q4', 'R1Q5'];
      for (const qId of r1Questions) {
        recordVstepQuestionAnswer({
          questionId: qId,
          skill: 'reading',
          part: 'passage1',
          isCorrect: true,
        });
      }

      // Round 2: Learner requests next practice set with Round 1 questions excluded
      const answeredR1 = Array.from(getAnsweredVstepQuestionIds('reading'));
      expect(answeredR1.length).toBe(5);

      const r2Practice = loadVstepSkillPractice('reading', 'unseen', answeredR1);
      expect(r2Practice).not.toBeNull();

      const r2QuestionIds: string[] = [];
      r2Practice?.sections[0].tasks.forEach((t) => {
        t.questions?.forEach((q) => r2QuestionIds.push(q.id));
      });

      // Verify 0% overlap with Round 1
      for (const r1Id of r1Questions) {
        expect(r2QuestionIds.includes(r1Id)).toBe(false);
      }

      // Learner answers 5 more questions in Round 2
      const r2Answered = r2QuestionIds.slice(0, 5);
      for (const qId of r2Answered) {
        recordVstepQuestionAnswer({
          questionId: qId,
          skill: 'reading',
          part: 'passage1',
          isCorrect: true,
        });
      }

      // Round 3: Learner requests Round 3 with all answered questions excluded
      const answeredR1AndR2 = Array.from(getAnsweredVstepQuestionIds('reading'));
      expect(answeredR1AndR2.length).toBe(10);

      const r3Practice = loadVstepSkillPractice('reading', 'unseen', answeredR1AndR2);
      expect(r3Practice).not.toBeNull();

      const r3QuestionIds: string[] = [];
      r3Practice?.sections[0].tasks.forEach((t) => {
        t.questions?.forEach((q) => r3QuestionIds.push(q.id));
      });

      // Verify 0% overlap with both Round 1 and Round 2
      for (const prevId of answeredR1AndR2) {
        expect(r3QuestionIds.includes(prevId)).toBe(false);
      }
    });

    // S1.3
    await runner.it('S1.3: Spaced Repetition Remediation: candidate attempts 20 Qs, makes 6 mistakes, remediates all 6 -> 0 mistakes left', () => {
      // Step 1: Candidate answers 20 questions, making 6 mistakes
      const initialBatch: Array<{ questionId: string; skill: 'reading'; part: string; isCorrect: boolean }> = [];
      for (let i = 1; i <= 20; i++) {
        const isMistake = i <= 6; // First 6 are wrong
        initialBatch.push({
          questionId: `R_DRILL_${i}`,
          skill: 'reading',
          part: 'p1',
          isCorrect: !isMistake,
        });
      }
      batchRecordVstepAnswers(initialBatch);

      let mistakes = getIncorrectVstepQuestionIds('reading');
      expect(mistakes.size).toBe(6);

      let stats = getVstepProgressStats('reading', 40);
      expect(stats.answeredCount).toBe(20);
      expect(stats.mistakeCount).toBe(6);
      expect(stats.correctCount).toBe(14);

      // Step 2: Candidate focuses on mistakes: re-answers all 6 mistakes correctly
      for (const qId of Array.from(mistakes)) {
        recordVstepQuestionAnswer({
          questionId: qId,
          skill: 'reading',
          part: 'p1',
          isCorrect: true,
        });
      }

      // Step 3: Verify mistakes cleared
      mistakes = getIncorrectVstepQuestionIds('reading');
      expect(mistakes.size).toBe(0);

      stats = getVstepProgressStats('reading', 40);
      expect(stats.answeredCount).toBe(20);
      expect(stats.mistakeCount).toBe(0);
      expect(stats.correctCount).toBe(20);

      // Attempt counts must be 2 for the remediated questions
      const history = getVstepHistory();
      expect(history['R_DRILL_1'].attemptCount).toBe(2);
      expect(history['R_DRILL_1'].isCorrect).toBe(true);
      expect(history['R_DRILL_7'].attemptCount).toBe(1);
    });

    // S1.4
    await runner.it('S1.4: Skill Progress Reset: resetting Listening clears Listening while Reading remains intact', () => {
      batchRecordVstepAnswers([
        { questionId: 'L1', skill: 'listening', part: 'part1', isCorrect: true },
        { questionId: 'L2', skill: 'listening', part: 'part1', isCorrect: false },
        { questionId: 'R1', skill: 'reading', part: 'passage1', isCorrect: true },
        { questionId: 'R2', skill: 'reading', part: 'passage1', isCorrect: true },
      ]);

      expect(getAnsweredVstepQuestionIds('listening').size).toBe(2);
      expect(getAnsweredVstepQuestionIds('reading').size).toBe(2);

      // Reset listening progress
      resetVstepSkillProgress('listening');

      expect(getAnsweredVstepQuestionIds('listening').size).toBe(0);
      expect(getAnsweredVstepQuestionIds('reading').size).toBe(2);

      const lStats = getVstepProgressStats('listening', 35);
      expect(lStats.answeredCount).toBe(0);
      expect(lStats.percentage).toBe(0);

      const rStats = getVstepProgressStats('reading', 40);
      expect(rStats.answeredCount).toBe(2);
      expect(rStats.percentage).toBe(Math.round((2 / 40) * 100));
    });

    // S1.5
    await runner.it('S1.5: Cyber Attack Defense: scraper bot hits canary honeypot -> receives silent poisoned exam', () => {
      const maliciousIp = '185.220.101.5';
      const canaryId = 'vstep-canary-honeypot';

      // 1. Honeypot check flags malicious query
      expect(isVstepHoneypot(canaryId)).toBe(true);
      flagClientAsBot(maliciousIp, `Triggered canary: ${canaryId}`);
      expect(isClientFlaggedAsBot(maliciousIp)).toBe(true);

      // 2. System returns poisoned exam (HTTP 200 OK facade with bad data)
      const raw = loadRawVstepExam('vstep-mock-01');
      expect(raw).not.toBeNull();

      const sampleQ = raw!.sections[0].tasks[0].questions![0];
      const poisoned = poisonVstepQuestion(sampleQ);

      expect(poisoned.answer).not.toBe(sampleQ.answer);
      expect(poisoned.explanationVi).not.toBe(sampleQ.explanationVi);

      // 3. Flagged bot status persists across subsequent requests
      expect(isClientFlaggedAsBot(maliciousIp)).toBe(true);
    });

    // S1.6
    await runner.it('S1.6: Guest-First Practice to LocalStorage Persistence and Retrieval', () => {
      // 1. Guest user takes listening practice
      const guestAnswers = [
        { questionId: 'G_L1', skill: 'listening' as const, part: 'p1', isCorrect: true, selectedOption: 0 },
        { questionId: 'G_L2', skill: 'listening' as const, part: 'p1', isCorrect: true, selectedOption: 1 },
        { questionId: 'G_L3', skill: 'listening' as const, part: 'p1', isCorrect: false, selectedOption: 2 },
      ];

      batchRecordVstepAnswers(guestAnswers);

      // 2. Verify localStorage has valid JSON string
      const rawStored = localStorage.getItem(VSTEP_HISTORY_STORAGE_KEY);
      expect(rawStored).not.toBeNull();
      const parsed = JSON.parse(rawStored!);
      expect(parsed['G_L1'].isCorrect).toBe(true);
      expect(parsed['G_L3'].isCorrect).toBe(false);

      // 3. Calculate score
      const stats = getVstepProgressStats('listening', 35);
      expect(stats.answeredCount).toBe(3);
      expect(stats.correctCount).toBe(2);
      expect(stats.mistakeCount).toBe(1);
    });
  });
}

// Standalone execution support
if (require.main === module) {
  const runner = new TestRunner();
  runTier4Tests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\n🏁 Tier 4 Finished: ${stats.passed}/${stats.total} passed (${stats.failed} failed)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
