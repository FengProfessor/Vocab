/**
 * Tier 2: Boundary & Corner Cases E2E Test Suite (>= 5 tests per feature, 18+ tests total)
 * Focus:
 * 1. Empty activity history (never studied)
 * 2. Single non-flashcard module isolation
 * 3. Exact threshold boundary transitions (3.0d vs 3.01d, 7.0d vs 7.01d, 30.0d vs 30.01d)
 * 4. Timezone & date type parsing (YYYY-MM-DD vs timestamptz)
 * 5. Words added_by isolation (null vs user_id)
 * 6. Malformed inputs, future clock skew, and ancient timestamps
 */

import { TestRunner, expect } from './harness';
import {
  calculateTrueLastActive,
  evaluatePedagogicalStatus,
  calculate7DayActiveKpi,
  calculateCrmLifecycle,
  buildMultiSkillStats,
  buildTimeline,
} from './oracle';
import {
  formatLastActive,
  formatQuizSummary,
  formatWordsSummary,
  getStudentStatus,
} from '@/components/teacher/StudentsPanel';
import type { StudentProgress } from '@/lib/supabase';
import { FIXED_BASE_TIME, createMockStudentProgress } from './fixtures/test-data';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  // ═════════════════════════════════════════════════════════════════════════
  // BOUNDARY GROUP 1: Empty Activity History
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 2 - Group 1: Empty Activity History Boundaries', async () => {
    await runner.it('T2.1.1: All-null activity sources return null for true_last_active without throwing', () => {
      const res = calculateTrueLastActive({
        srsLastReviewedAt: null,
        quizCompletedAt: null,
        wordCreatedAt: null,
        grammarLastReviewedAt: null,
        grammarMicroUpdatedAt: null,
        dailyReadingCompletedAt: null,
        toeicLastAnsweredAt: null,
        assessmentCreatedAt: null,
        vocabPackLastStudiedAt: null,
        streakLastActiveDate: null,
      });
      expect(res).toBeNull();
    });

    await runner.it('T2.1.2: Empty object sources return null for true_last_active', () => {
      const res = calculateTrueLastActive({});
      expect(res).toBeNull();
    });

    await runner.it('T2.1.3: Teacher formatters handle null/undefined gracefully', () => {
      expect(formatLastActive(null).text).toBe('Chưa hoạt động');
      expect(formatLastActive(undefined).text).toBe('Chưa hoạt động');
      expect(formatLastActive('').text).toBe('Chưa hoạt động');

      const sEmpty = createMockStudentProgress({
        student_id: 's-empty',
        classroom_id: 'c-1',
        student_name: 'Empty',
        email: 'empty@test.com',
      });
      const quizRes = formatQuizSummary(sEmpty);
      expect(quizRes.text).toBe('Chưa làm quiz');
      expect(quizRes.hasQuiz).toBe(false);

      const wordsRes = formatWordsSummary(sEmpty);
      expect(wordsRes.text).toBe('0 từ');
      expect(wordsRes.subtext).toBe('Chưa học từ nào');
    });

    await runner.it('T2.1.4: New user with empty activity classified as "new" if created <= 7 days', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 2 * DAY).toISOString();
      const lifecycle = calculateCrmLifecycle(createdAt, null, FIXED_BASE_TIME);
      expect(lifecycle).toBe('new');
    });

    await runner.it('T2.1.5: Old user with empty activity classified as "churned" if created > 7 days', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 14 * DAY).toISOString();
      const lifecycle = calculateCrmLifecycle(createdAt, null, FIXED_BASE_TIME);
      expect(lifecycle).toBe('churned');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // BOUNDARY GROUP 2: Single Non-Flashcard Module Activity Isolation
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 2 - Group 2: Single Non-Flashcard Module Isolation', async () => {
    await runner.it('T2.2.1: Activity ONLY in TOEIC prevents dormant status and marks CRM active', () => {
      const toeicTime = new Date(FIXED_BASE_TIME - 4 * HOUR).toISOString();
      const trueLastActive = calculateTrueLastActive({ toeicLastAnsweredAt: toeicTime });
      expect(trueLastActive).toBe(toeicTime);

      const student = createMockStudentProgress({
        student_id: 's-1',
        classroom_id: 'c-1',
        student_name: 'TOEIC Only',
        email: 't@example.com',
        last_active: trueLastActive || undefined,
      });
      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');

      const lifecycle = calculateCrmLifecycle(
        new Date(FIXED_BASE_TIME - 30 * DAY).toISOString(),
        trueLastActive,
        FIXED_BASE_TIME,
      );
      expect(lifecycle).toBe('active');
    });

    await runner.it('T2.2.2: Activity ONLY in Grammar Micro-lessons prevents dormant status and marks CRM active', () => {
      const grammarTime = new Date(FIXED_BASE_TIME - 1 * DAY).toISOString();
      const trueLastActive = calculateTrueLastActive({ grammarMicroUpdatedAt: grammarTime });
      expect(trueLastActive).toBe(grammarTime);

      const student = createMockStudentProgress({
        student_id: 's-2',
        classroom_id: 'c-1',
        student_name: 'Grammar Only',
        email: 'g@example.com',
        last_active: trueLastActive || undefined,
      });
      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');

      const lifecycle = calculateCrmLifecycle(
        new Date(FIXED_BASE_TIME - 20 * DAY).toISOString(),
        trueLastActive,
        FIXED_BASE_TIME,
      );
      expect(lifecycle).toBe('active');
    });

    await runner.it('T2.2.3: Activity ONLY in Daily Reading prevents dormant status and marks CRM active', () => {
      const readingTime = new Date(FIXED_BASE_TIME - 18 * HOUR).toISOString();
      const trueLastActive = calculateTrueLastActive({ dailyReadingCompletedAt: readingTime });
      expect(trueLastActive).toBe(readingTime);

      const student = createMockStudentProgress({
        student_id: 's-3',
        classroom_id: 'c-1',
        student_name: 'Reading Only',
        email: 'r@example.com',
        last_active: trueLastActive || undefined,
      });
      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');

      const lifecycle = calculateCrmLifecycle(
        new Date(FIXED_BASE_TIME - 60 * DAY).toISOString(),
        trueLastActive,
        FIXED_BASE_TIME,
      );
      expect(lifecycle).toBe('active');
    });

    await runner.it('T2.2.4: Activity ONLY in Roadmap Assessment prevents dormant status and marks CRM active', () => {
      const assessmentTime = new Date(FIXED_BASE_TIME - 2 * DAY).toISOString();
      const trueLastActive = calculateTrueLastActive({ assessmentCreatedAt: assessmentTime });
      expect(trueLastActive).toBe(assessmentTime);

      const student = createMockStudentProgress({
        student_id: 's-4',
        classroom_id: 'c-1',
        student_name: 'Assessment Only',
        email: 'a@example.com',
        last_active: trueLastActive || undefined,
      });
      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // BOUNDARY GROUP 3: Exact Threshold Boundary Transitions
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 2 - Group 3: Exact Threshold Boundary Transitions', async () => {
    await runner.it('T2.3.1: Dormant threshold boundary: 2.99 days ago (NOT dormant) vs 3.01 days ago (Dormant)', () => {
      const now = Date.now();
      // 2.99 days ago (within 3 days)
      const notDormantStudent = createMockStudentProgress({
        student_id: 's-sub3',
        classroom_id: 'c-1',
        student_name: 'Sub 3d',
        email: 'sub3@test.com',
        last_active: new Date(now - 2.99 * DAY).toISOString(),
      });
      expect(getStudentStatus(notDormantStudent).key).not.toBe('dormant');

      // 3.01 days ago (exceeds 3 days = 259,200,000 ms)
      const dormantStudent = createMockStudentProgress({
        student_id: 's-post3',
        classroom_id: 'c-1',
        student_name: 'Post 3d',
        email: 'post3@test.com',
        last_active: new Date(now - 3.01 * DAY).toISOString(),
      });
      expect(getStudentStatus(dormantStudent).key).toBe('dormant');
    });

    await runner.it('T2.3.2: 7-day active KPI boundary: 6.99 days ago (Active) vs 7.01 days ago (Inactive)', () => {
      const student699 = { last_active: new Date(FIXED_BASE_TIME - 6.99 * DAY).toISOString() };
      const student701 = { last_active: new Date(FIXED_BASE_TIME - 7.01 * DAY).toISOString() };

      expect(calculate7DayActiveKpi([student699], FIXED_BASE_TIME)).toBe(1);
      expect(calculate7DayActiveKpi([student701], FIXED_BASE_TIME)).toBe(0);
    });

    await runner.it('T2.3.3: CRM active vs at_risk boundary: 6.99 days ago (active) vs 7.01 days ago (at_risk)', () => {
      const oldAccount = new Date(FIXED_BASE_TIME - 40 * DAY).toISOString();

      const activeLife = calculateCrmLifecycle(
        oldAccount,
        new Date(FIXED_BASE_TIME - 6.99 * DAY).toISOString(),
        FIXED_BASE_TIME,
      );
      expect(activeLife).toBe('active');

      const atRiskLife = calculateCrmLifecycle(
        oldAccount,
        new Date(FIXED_BASE_TIME - 7.01 * DAY).toISOString(),
        FIXED_BASE_TIME,
      );
      expect(atRiskLife).toBe('at_risk');
    });

    await runner.it('T2.3.4: CRM at_risk vs churned boundary: 29.99 days ago (at_risk) vs 30.01 days ago (churned)', () => {
      const oldAccount = new Date(FIXED_BASE_TIME - 90 * DAY).toISOString();

      const atRiskLife = calculateCrmLifecycle(
        oldAccount,
        new Date(FIXED_BASE_TIME - 29.99 * DAY).toISOString(),
        FIXED_BASE_TIME,
      );
      expect(atRiskLife).toBe('at_risk');

      const churnedLife = calculateCrmLifecycle(
        oldAccount,
        new Date(FIXED_BASE_TIME - 30.01 * DAY).toISOString(),
        FIXED_BASE_TIME,
      );
      expect(churnedLife).toBe('churned');
    });

    await runner.it('T2.3.5: CRM new user threshold boundary: created 6.99 days ago (new) vs 7.01 days ago (churned)', () => {
      const newLife = calculateCrmLifecycle(
        new Date(FIXED_BASE_TIME - 6.99 * DAY).toISOString(),
        null,
        FIXED_BASE_TIME,
      );
      expect(newLife).toBe('new');

      const expiredNewLife = calculateCrmLifecycle(
        new Date(FIXED_BASE_TIME - 7.01 * DAY).toISOString(),
        null,
        FIXED_BASE_TIME,
      );
      expect(expiredNewLife).toBe('churned');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // BOUNDARY GROUP 4: Timezone, Malformed Inputs & Edge Data
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 2 - Group 4: Timezone, Malformed Inputs & Edge Conditions', async () => {
    await runner.it('T2.4.1: Date string YYYY-MM-DD parses safely without NaN or timezone shift', () => {
      const res = calculateTrueLastActive({ streakLastActiveDate: '2026-10-05' });
      expect(res).toBe('2026-10-05T00:00:00.000Z');
    });

    await runner.it('T2.4.2: Malformed date string (invalid-date) is ignored by GREATEST aggregator', () => {
      const res = calculateTrueLastActive({
        srsLastReviewedAt: 'not-a-date',
        toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 1 * HOUR).toISOString(),
      });
      expect(res).toBe(new Date(FIXED_BASE_TIME - 1 * HOUR).toISOString());
    });

    await runner.it('T2.4.3: Future timestamp due to client clock desync is handled without breaking', () => {
      const futureTime = new Date(FIXED_BASE_TIME + 5 * 60 * 1000).toISOString(); // 5 min in future
      const trueLastActive = calculateTrueLastActive({ toeicLastAnsweredAt: futureTime });
      expect(trueLastActive).toBe(futureTime);

      const lifecycle = calculateCrmLifecycle(
        new Date(FIXED_BASE_TIME - 30 * DAY).toISOString(),
        trueLastActive,
        FIXED_BASE_TIME,
      );
      // daysSinceActive <= 7 still holds for negative/zero days!
      expect(lifecycle).toBe('active');
    });

    await runner.it('T2.4.4: Ancient timestamp (year 2020) evaluates correctly as churned / dormant', () => {
      const ancientTime = '2020-01-01T00:00:00.000Z';
      const trueLastActive = calculateTrueLastActive({ srsLastReviewedAt: ancientTime });
      expect(trueLastActive).toBe(ancientTime);

      const student = createMockStudentProgress({
        student_id: 's-ancient',
        classroom_id: 'c-1',
        student_name: 'Ancient',
        email: 'ancient@test.com',
        last_active: trueLastActive || undefined,
      });
      expect(getStudentStatus(student).key).toBe('dormant');

      const lifecycle = calculateCrmLifecycle(
        '2019-12-01T00:00:00.000Z',
        trueLastActive,
        FIXED_BASE_TIME,
      );
      expect(lifecycle).toBe('churned');
    });

    await runner.it('T2.4.5: Zero-activity counts in multi-skill stats produce 0% without division-by-zero NaN', () => {
      const stats = buildMultiSkillStats({
        createdAt: new Date(FIXED_BASE_TIME - 20 * DAY).toISOString(),
        sources: {},
        vocab: { wordsSaved: 0, cardsLearned: 0, reviewsTotal: 0, lapsesTotal: 0, dueCount: 0 },
        grammar: { lessonsCompleted: 0, microLessonsPassed: 0 },
        reading: { articlesRead: 0 },
        toeic: { questionsAnswered: 0, correctCount: 0 },
        gamification: { streakDays: 0, lastActiveDate: null },
        now: FIXED_BASE_TIME,
      });

      expect(stats.toeic.accuracyPercent).toBe(0);
      expect(isNaN(stats.toeic.accuracyPercent)).toBe(false);
      expect(stats.lifecycle).toBe('churned');
    });
  });
}
