/**
 * TOEIC Speaking Ecosystem & AI Tutor Verification Suite
 * File: tests/toeic/speaking.test.ts
 */

import { TestRunner, expect } from './test-harness';
import {
  TOEIC_SPEAKING_TESTS,
  getToeicSpeakingTestById,
} from '../../src/data/toeic/speaking';
import { AI_SPEAKING_TOPICS } from '../../src/data/speaking/ai-topics';

export async function runToeicSpeakingTests(runner: TestRunner): Promise<void> {
  runner.describe('TOEIC Speaking: Tier 1 - Exam Structure & Question Completeness', () => {
    runner.it('TSP-1.1: At least 1 full official TOEIC Speaking exam exists with 11 questions', () => {
      expect(TOEIC_SPEAKING_TESTS.length >= 1).toBe(true);
      const test = TOEIC_SPEAKING_TESTS[0];
      expect(test.totalQuestions).toBe(11);
      expect(test.questions.length).toBe(11);
    });

    runner.it('TSP-1.2: Q1 and Q2 are Read Aloud with 45s prep, 45s speak, and valid stimulusText', () => {
      const test = TOEIC_SPEAKING_TESTS[0];
      const q1 = test.questions[0];
      const q2 = test.questions[1];

      expect(q1.questionType).toBe('read_aloud');
      expect(q1.prepTimeSeconds).toBe(45);
      expect(q1.speakTimeSeconds).toBe(45);
      expect(q1.stimulusText !== undefined).toBe(true);
      expect(q1.stimulusText!.length > 50).toBe(true);

      expect(q2.questionType).toBe('read_aloud');
      expect(q2.prepTimeSeconds).toBe(45);
      expect(q2.speakTimeSeconds).toBe(45);
      expect(q2.stimulusText !== undefined).toBe(true);
    });

    runner.it('TSP-1.3: Q3 and Q4 are Describe Picture with 45s prep, 30s speak, and imageContext', () => {
      const test = TOEIC_SPEAKING_TESTS[0];
      const q3 = test.questions[2];
      const q4 = test.questions[3];

      expect(q3.questionType).toBe('describe_picture');
      expect(q3.prepTimeSeconds).toBe(45);
      expect(q3.speakTimeSeconds).toBe(30);
      expect(q3.imageContext !== undefined).toBe(true);
      expect(q3.imageContext!.suggestedFocus.length >= 3).toBe(true);

      expect(q4.questionType).toBe('describe_picture');
      expect(q4.prepTimeSeconds).toBe(45);
      expect(q4.speakTimeSeconds).toBe(30);
      expect(q4.imageContext !== undefined).toBe(true);
    });

    runner.it('TSP-1.4: Q5-7 are Respond to Questions with 3s prep and 15s/15s/30s speak times', () => {
      const test = TOEIC_SPEAKING_TESTS[0];
      const q5 = test.questions[4];
      const q6 = test.questions[5];
      const q7 = test.questions[6];

      expect(q5.questionType).toBe('respond_questions');
      expect(q5.prepTimeSeconds).toBe(3);
      expect(q5.speakTimeSeconds).toBe(15);

      expect(q6.questionType).toBe('respond_questions');
      expect(q6.prepTimeSeconds).toBe(3);
      expect(q6.speakTimeSeconds).toBe(15);

      expect(q7.questionType).toBe('respond_questions');
      expect(q7.prepTimeSeconds).toBe(3);
      expect(q7.speakTimeSeconds).toBe(30);
    });

    runner.it('TSP-1.5: Q8-10 are Information Schedule with valid scheduleData and 15s/15s/30s speak times', () => {
      const test = TOEIC_SPEAKING_TESTS[0];
      const q8 = test.questions[7];
      const q9 = test.questions[8];
      const q10 = test.questions[9];

      expect(q8.questionType).toBe('information_schedule');
      expect(q8.speakTimeSeconds).toBe(15);
      expect(q8.scheduleData !== undefined).toBe(true);
      expect(q8.scheduleData!.entries.length >= 4).toBe(true);

      expect(q9.questionType).toBe('information_schedule');
      expect(q9.speakTimeSeconds).toBe(15);

      expect(q10.questionType).toBe('information_schedule');
      expect(q10.speakTimeSeconds).toBe(30);
    });

    runner.it('TSP-1.6: Q11 is Express Opinion with 45s prep, 60s speak, and robust OREO responses', () => {
      const test = TOEIC_SPEAKING_TESTS[0];
      const q11 = test.questions[10];

      expect(q11.questionType).toBe('express_opinion');
      expect(q11.prepTimeSeconds).toBe(45);
      expect(q11.speakTimeSeconds).toBe(60);
      expect(q11.sampleAnswerLevel8.length > 200).toBe(true);
    });
  });

  runner.describe('TOEIC Speaking: Tier 2 - Pedagogical Models & Rubrics', () => {
    runner.it('TSP-2.1: Every question has Level 6 and Level 8 model answers and detailed rubrics', () => {
      const test = TOEIC_SPEAKING_TESTS[0];
      for (const q of test.questions) {
        expect(q.sampleAnswerLevel6.length > 20).toBe(true);
        expect(q.sampleAnswerLevel8.length > 25).toBe(true);
        expect(q.scoringRubricVi.pronunciationAndStress.length > 10).toBe(true);
        expect(q.scoringRubricVi.grammarAndVocabulary.length > 10).toBe(true);
        expect(q.scoringRubricVi.coherenceAndRelevance.length > 10).toBe(true);
        expect(q.keyTipsVi.length >= 1).toBe(true);
        expect(q.keyVocabulary.length >= 2).toBe(true);
      }
    });

    runner.it('TSP-2.2: Helper lookup getToeicSpeakingTestById functions correctly', () => {
      const test = getToeicSpeakingTestById('toeic-speaking-actual-01');
      expect(test).toBeDefined();
      expect(test!.titleVi).toBe('Đề thi thử TOEIC Speaking thực chiến 1');
    });
  });

  runner.describe('TOEIC Speaking: Tier 3 - AI Speaking Tutor Scenario Diversity', () => {
    runner.it('TSP-3.1: AI Speaking topics include at least 20 real-world scenarios', () => {
      expect(AI_SPEAKING_TOPICS.length >= 20).toBe(true);
    });

    runner.it('TSP-3.2: AI Speaking covers all 5 essential categories across A2, B1, B2, C1', () => {
      const categories = new Set(AI_SPEAKING_TOPICS.map((t) => t.category));
      expect(categories.has('workplace')).toBe(true);
      expect(categories.has('academic')).toBe(true);
      expect(categories.has('daily_travel')).toBe(true);
      expect(categories.has('debates')).toBe(true);
      expect(categories.has('exam_prep')).toBe(true);

      const levels = new Set(AI_SPEAKING_TOPICS.map((t) => t.level));
      expect(levels.has('A2')).toBe(true);
      expect(levels.has('B1')).toBe(true);
      expect(levels.has('B2')).toBe(true);
      expect(levels.has('C1')).toBe(true);
    });

    runner.it('TSP-3.3: Every AI topic has tailored initial greeting and suggested starters', () => {
      for (const topic of AI_SPEAKING_TOPICS) {
        expect(topic.initialGreeting.length > 20).toBe(true);
        expect(topic.suggestedStarters.length >= 2).toBe(true);
        expect(topic.keyVocabulary.length >= 2).toBe(true);
      }
    });
  });
}

if (process.argv[1]?.includes('speaking.test')) {
  const r = new TestRunner();
  runToeicSpeakingTests(r).then(() => {
    const stats = r.getStats();
    console.log(
      `\nTOEIC Speaking Suite Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`
    );
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
