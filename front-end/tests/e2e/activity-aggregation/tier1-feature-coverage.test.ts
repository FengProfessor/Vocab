/**
 * Tier 1: Feature Coverage E2E Test Suite (>= 5 tests per feature, 25+ tests total)
 * Focus:
 * 1. Universal 9-Source Activity Aggregation & true_last_active calculation
 * 2. Teacher Stats API & 7-Day Active Count KPI
 * 3. Teacher StudentsPanel Pedagogical Status Fix (dormant, at_risk, cramming, rising_star)
 * 4. Teacher StudentDetail Timeline Multi-Skill Groups Formatting
 * 5. Admin CRM Multi-Skill Integration & Accurate Customer Lifecycle
 */

import { TestRunner, expect } from './harness';
import {
  calculateTrueLastActive,
  buildStudentActivitySummary,
  evaluatePedagogicalStatus,
  calculate7DayActiveKpi,
  calculateCrmLifecycle,
  buildTimeline,
  buildMultiSkillStats,
} from './oracle';
import {
  validateStudentActivitySummary,
  validateTimelineItem,
  validateMultiSkillStats,
} from './contracts';
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

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  // ═════════════════════════════════════════════════════════════════════════
  // FEATURE 1: Universal 9-Source Activity Aggregation
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 1 - Feature 1: Universal 9-Source Activity Aggregation', async () => {
    await runner.it('T1.1.1: SRS flashcard review establishes true_last_active when sole activity', () => {
      const ts = new Date(FIXED_BASE_TIME - 3 * HOUR).toISOString();
      const res = calculateTrueLastActive({ srsLastReviewedAt: ts });
      expect(res).toBe(ts);
    });

    await runner.it('T1.1.2: Quiz completion establishes true_last_active when sole activity', () => {
      const ts = new Date(FIXED_BASE_TIME - 2 * HOUR).toISOString();
      const res = calculateTrueLastActive({ quizCompletedAt: ts });
      expect(res).toBe(ts);
    });

    await runner.it('T1.1.3: Word creation establishes true_last_active when sole activity', () => {
      const ts = new Date(FIXED_BASE_TIME - 4 * HOUR).toISOString();
      const res = calculateTrueLastActive({ wordCreatedAt: ts });
      expect(res).toBe(ts);
    });

    await runner.it('T1.1.4: Grammar FSRS & Micro-lessons establish true_last_active', () => {
      const ts = new Date(FIXED_BASE_TIME - 1 * HOUR).toISOString();
      const res = calculateTrueLastActive({ grammarLastReviewedAt: ts });
      expect(res).toBe(ts);

      const microTs = new Date(FIXED_BASE_TIME - 30 * 60 * 1000).toISOString();
      const resMicro = calculateTrueLastActive({ grammarMicroUpdatedAt: microTs });
      expect(resMicro).toBe(microTs);
    });

    await runner.it('T1.1.5: Daily Reading completion establishes true_last_active', () => {
      const ts = new Date(FIXED_BASE_TIME - 5 * HOUR).toISOString();
      const res = calculateTrueLastActive({ dailyReadingCompletedAt: ts });
      expect(res).toBe(ts);
    });

    await runner.it('T1.1.6: TOEIC practice question history establishes true_last_active', () => {
      const ts = new Date(FIXED_BASE_TIME - 10 * 60 * 1000).toISOString(); // 10 mins ago
      const res = calculateTrueLastActive({ toeicLastAnsweredAt: ts });
      expect(res).toBe(ts);
    });

    await runner.it('T1.1.7: Roadmap assessment & Mock Test establishes true_last_active', () => {
      const ts = new Date(FIXED_BASE_TIME - 6 * HOUR).toISOString();
      const res = calculateTrueLastActive({ assessmentCreatedAt: ts });
      expect(res).toBe(ts);
    });

    await runner.it('T1.1.8: Vocab pack study establishes true_last_active', () => {
      const ts = new Date(FIXED_BASE_TIME - 8 * HOUR).toISOString();
      const res = calculateTrueLastActive({ vocabPackLastStudiedAt: ts });
      expect(res).toBe(ts);
    });

    await runner.it('T1.1.9: Gamification streak date (YYYY-MM-DD) establishes true_last_active as UTC timestamptz', () => {
      const dateStr = '2026-10-05';
      const res = calculateTrueLastActive({ streakLastActiveDate: dateStr });
      expect(res).toBe('2026-10-05T00:00:00.000Z');
    });

    await runner.it('T1.1.10: GREATEST selects the latest timestamp across multiple simultaneous activity sources', () => {
      const oldestSrs = new Date(FIXED_BASE_TIME - 5 * DAY).toISOString();
      const midGrammar = new Date(FIXED_BASE_TIME - 2 * DAY).toISOString();
      const newestToeic = new Date(FIXED_BASE_TIME - 1 * HOUR).toISOString();

      const res = calculateTrueLastActive({
        srsLastReviewedAt: oldestSrs,
        grammarLastReviewedAt: midGrammar,
        toeicLastAnsweredAt: newestToeic,
      });
      expect(res).toBe(newestToeic);
    });

    await runner.it('T1.1.11: StudentActivitySummary complies strictly with Interface Contract 1', () => {
      const summary = buildStudentActivitySummary({
        userId: 'u-12345',
        sources: {
          srsLastReviewedAt: new Date(FIXED_BASE_TIME - 2 * DAY).toISOString(),
          toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 30 * 60 * 1000).toISOString(),
        },
        wordCount: 42,
        totalActivitiesCount: 15,
      });

      const validation = validateStudentActivitySummary(summary);
      expect(validation.valid).toBe(true);
      expect(summary.trueLastActive).toBe(new Date(FIXED_BASE_TIME - 30 * 60 * 1000).toISOString());
      expect(summary.wordCount).toBe(42);
      expect(summary.totalActivitiesCount).toBe(15);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // FEATURE 2: Teacher Stats API & 7-Day Active Count KPI
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 1 - Feature 2: Teacher Stats API & 7-Day Active Count KPI', async () => {
    await runner.it('T1.2.1: 7-day active KPI counts students whose true_last_active is within 7 days', () => {
      const students = [
        { last_active: new Date(FIXED_BASE_TIME - 1 * DAY).toISOString() },
        { last_active: new Date(FIXED_BASE_TIME - 5 * DAY).toISOString() },
        { last_active: new Date(FIXED_BASE_TIME - 6.9 * DAY).toISOString() },
        { last_active: new Date(FIXED_BASE_TIME - 8 * DAY).toISOString() }, // inactive > 7d
        { last_active: null }, // inactive
      ];
      const count = calculate7DayActiveKpi(students, FIXED_BASE_TIME);
      expect(count).toBe(3);
    });

    await runner.it('T1.2.2: Students active ONLY in TOEIC are counted in Teacher 7-day active KPI', () => {
      const toeicOnlyStudent = {
        last_active: calculateTrueLastActive({
          srsLastReviewedAt: null,
          quizCompletedAt: null,
          toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 4 * HOUR).toISOString(),
        }),
      };
      const count = calculate7DayActiveKpi([toeicOnlyStudent], FIXED_BASE_TIME);
      expect(count).toBe(1);
    });

    await runner.it('T1.2.3: Students active ONLY in Grammar are counted in Teacher 7-day active KPI', () => {
      const grammarOnlyStudent = {
        last_active: calculateTrueLastActive({
          srsLastReviewedAt: null,
          grammarLastReviewedAt: new Date(FIXED_BASE_TIME - 2 * DAY).toISOString(),
        }),
      };
      const count = calculate7DayActiveKpi([grammarOnlyStudent], FIXED_BASE_TIME);
      expect(count).toBe(1);
    });

    await runner.it('T1.2.4: Students active ONLY in Daily Reading are counted in Teacher 7-day active KPI', () => {
      const readingOnlyStudent = {
        last_active: calculateTrueLastActive({
          srsLastReviewedAt: null,
          dailyReadingCompletedAt: new Date(FIXED_BASE_TIME - 12 * HOUR).toISOString(),
        }),
      };
      const count = calculate7DayActiveKpi([readingOnlyStudent], FIXED_BASE_TIME);
      expect(count).toBe(1);
    });

    await runner.it('T1.2.5: Formatters handle true_last_active timestamps consistently with Vietnam relative formats', () => {
      const todayIso = new Date(FIXED_BASE_TIME).toISOString();
      const resToday = formatLastActive(todayIso);
      expect(resToday.text).toContain('Hôm nay');
      expect(resToday.isToday).toBe(true);

      const yesterdayIso = new Date(FIXED_BASE_TIME - 1 * DAY).toISOString();
      const resYesterday = formatLastActive(yesterdayIso);
      expect(resYesterday.isYesterday).toBe(true);

      const nullRes = formatLastActive(null);
      expect(nullRes.text).toBe('Chưa hoạt động');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // FEATURE 3: Teacher StudentsPanel Pedagogical Status Fix
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 1 - Feature 3: Teacher StudentsPanel Pedagogical Status Fix', async () => {
    await runner.it('T1.3.1: Active TOEIC learner is NOT tagged dormant (solves false dormant defect)', () => {
      // Inactive in flashcards for 10 days, but did TOEIC 3 hours ago
      const trueLastActive = calculateTrueLastActive({
        srsLastReviewedAt: new Date(FIXED_BASE_TIME - 10 * DAY).toISOString(),
        toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 3 * HOUR).toISOString(),
      });

      const student = createMockStudentProgress({
        student_id: 's-toeic-1',
        classroom_id: 'c-1',
        student_name: 'Minh TOEIC',
        email: 'minh@example.com',
        last_active: trueLastActive || undefined,
        words_reviewed: 50,
        total_words: 60,
        vms: 65,
        lcs: 70,
        avg_quiz_accuracy: 0.85,
        quizzes_taken: 4,
      });

      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');
      expect(status.tag).not.toBe('DORMANT');
    });

    await runner.it('T1.3.2: Active Grammar learner is NOT tagged dormant', () => {
      const trueLastActive = calculateTrueLastActive({
        srsLastReviewedAt: null,
        grammarLastReviewedAt: new Date(FIXED_BASE_TIME - 1 * DAY).toISOString(),
      });

      const student = createMockStudentProgress({
        student_id: 's-gram-1',
        classroom_id: 'c-1',
        student_name: 'Lan Grammar',
        email: 'lan@example.com',
        last_active: trueLastActive || undefined,
        words_reviewed: 30,
        total_words: 30,
        vms: 70,
        lcs: 75,
        avg_quiz_accuracy: 0.8,
        quizzes_taken: 3,
      });

      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');
    });

    await runner.it('T1.3.3: Active Reading learner is NOT tagged dormant', () => {
      const trueLastActive = calculateTrueLastActive({
        srsLastReviewedAt: null,
        dailyReadingCompletedAt: new Date(FIXED_BASE_TIME - 18 * HOUR).toISOString(),
      });

      const student = createMockStudentProgress({
        student_id: 's-read-1',
        classroom_id: 'c-1',
        student_name: 'Trang Reading',
        email: 'trang@example.com',
        last_active: trueLastActive || undefined,
        words_reviewed: 20,
        total_words: 20,
        vms: 60,
        lcs: 70,
        avg_quiz_accuracy: 0.8,
        quizzes_taken: 2,
      });

      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');
    });

    await runner.it('T1.3.4: Student truly inactive across ALL modules for > 3 days IS tagged dormant', () => {
      const trueLastActive = calculateTrueLastActive({
        srsLastReviewedAt: new Date(Date.now() - 5 * DAY).toISOString(),
        toeicLastAnsweredAt: new Date(Date.now() - 6 * DAY).toISOString(),
      });

      const student = createMockStudentProgress({
        student_id: 's-dormant-1',
        classroom_id: 'c-1',
        student_name: 'Quang Vắng',
        email: 'quang@example.com',
        last_active: trueLastActive || undefined,
        words_reviewed: 20,
        total_words: 30,
        vms: 50,
        lcs: 40,
        avg_quiz_accuracy: 0.7,
        quizzes_taken: 2,
      });

      const status = getStudentStatus(student);
      expect(status.key).toBe('dormant');
      expect(status.tag).toBe('DORMANT');
      expect(status.dot).toBe('💤');
    });

    await runner.it('T1.3.5: At-risk status correctly evaluated when vms < 30 and words_reviewed > 10', () => {
      const student = createMockStudentProgress({
        student_id: 's-risk-1',
        classroom_id: 'c-1',
        student_name: 'Ngọc Cần Củng Cố',
        email: 'ngoc@example.com',
        last_active: new Date().toISOString(), // active today (not dormant)
        words_reviewed: 50,
        vms: 22, // vms < 30
        lcs: 50,
      });
      const status = getStudentStatus(student);
      expect(status.key).toBe('at_risk');
      expect(status.tag).toBe('AT RISK');
    });

    await runner.it('T1.3.6: Cramming status correctly evaluated when lcs < 30 and acc > 0.8 and quizzes > 2', () => {
      const student = createMockStudentProgress({
        student_id: 's-cram-1',
        classroom_id: 'c-1',
        student_name: 'Đức Học Dồn',
        email: 'duc@example.com',
        last_active: new Date().toISOString(),
        words_reviewed: 40,
        vms: 50,
        lcs: 15, // lcs < 30
        avg_quiz_accuracy: 0.9, // acc > 0.8
        quizzes_taken: 5, // quizzes > 2
      });
      const status = getStudentStatus(student);
      expect(status.key).toBe('cramming');
      expect(status.tag).toBe('CRAMMING');
    });

    await runner.it('T1.3.7: Rising star status correctly evaluated when lcs > 80 and acc > 0.8', () => {
      const student = createMockStudentProgress({
        student_id: 's-star-1',
        classroom_id: 'c-1',
        student_name: 'Bảo Tích Cực',
        email: 'bao@example.com',
        last_active: new Date().toISOString(),
        words_reviewed: 80,
        vms: 85,
        lcs: 92, // lcs > 80
        avg_quiz_accuracy: 0.95, // acc > 0.8
        quizzes_taken: 6,
      });
      const status = getStudentStatus(student);
      expect(status.key).toBe('rising_star');
      expect(status.tag).toBe('RISING STAR');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // FEATURE 4: Teacher StudentDetail Timeline 6-Group Formatting
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 1 - Feature 4: Teacher StudentDetail Timeline Multi-Skill Groups', async () => {
    await runner.it('T1.4.1: Timeline ingests SRS review items with custom badge', () => {
      const items = buildTimeline({
        srsReviews: [
          { id: '1', timestamp: new Date(FIXED_BASE_TIME - HOUR).toISOString(), word: 'ubiquitous', result: 'good' },
        ],
      });
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('srs_review');
      expect(items[0].title).toContain('ubiquitous');
      expect(items[0].badge).toBe('GOOD');
      expect(items[0].badgeVariant).toBe('emerald');
    });

    await runner.it('T1.4.2: Timeline ingests Quiz items with accuracy and score badges', () => {
      const items = buildTimeline({
        quizzes: [
          {
            id: 'q1',
            completed_at: new Date(FIXED_BASE_TIME - 2 * HOUR).toISOString(),
            quiz_type: 'grammar',
            score: 9,
            total_questions: 10,
            accuracy: 0.9,
          },
        ],
      });
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('quiz');
      expect(items[0].badge).toBe('9/10 (90%)');
      expect(items[0].badgeVariant).toBe('emerald');
    });

    await runner.it('T1.4.3: Timeline ingests Word saved items with POS and translation', () => {
      const items = buildTimeline({
        savedWords: [
          {
            id: 'w1',
            created_at: new Date(FIXED_BASE_TIME - 3 * HOUR).toISOString(),
            word: 'meticulous',
            pos: 'adj',
            translation: 'tỉ mỉ',
          },
        ],
      });
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('word_saved');
      expect(items[0].title).toBe('Lưu từ mới: "meticulous"');
      expect(items[0].badge).toBe('Đã lưu');
    });

    await runner.it('T1.4.4: Timeline ingests Grammar lessons & micro-lessons', () => {
      const items = buildTimeline({
        grammarLessons: [
          {
            id: 'g1',
            updated_at: new Date(FIXED_BASE_TIME - 4 * HOUR).toISOString(),
            topic_title: 'Present Perfect vs Past Simple',
            is_micro: true,
            passed: true,
            score: 100,
          },
        ],
      });
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('grammar');
      expect(items[0].title).toContain('Micro-lesson: Present Perfect vs Past Simple');
      expect(items[0].badge).toBe('Hoàn thành');
    });

    await runner.it('T1.4.5: Timeline ingests Daily Reading completions', () => {
      const items = buildTimeline({
        dailyReadings: [
          {
            id: 'dr1',
            completed_at: new Date(FIXED_BASE_TIME - 5 * HOUR).toISOString(),
            article_title: 'The Future of Renewable Energy',
            score: 5,
            total_questions: 5,
          },
        ],
      });
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('daily_reading');
      expect(items[0].badge).toBe('5/5 đúng');
    });

    await runner.it('T1.4.6: Timeline ingests TOEIC practice drills', () => {
      const items = buildTimeline({
        toeicDrills: [
          {
            id: 't1',
            answered_at: new Date(FIXED_BASE_TIME - 6 * HOUR).toISOString(),
            part: 5,
            is_correct: true,
            question_id: 'ETS-PRO-01-Q105',
          },
        ],
      });
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('toeic');
      expect(items[0].title).toBe('Luyện đề Sát thủ TOEIC Part 5');
      expect(items[0].badge).toBe('Chính xác');
    });

    await runner.it('T1.4.7: Timeline strictly sorts multi-skill activities newest first', () => {
      const items = buildTimeline({
        srsReviews: [{ id: '1', timestamp: new Date(FIXED_BASE_TIME - 5 * HOUR).toISOString(), word: 'w1', result: 'good' }],
        toeicDrills: [{ id: '2', answered_at: new Date(FIXED_BASE_TIME - 1 * HOUR).toISOString(), part: 5, is_correct: true, question_id: 'q1' }],
        dailyReadings: [{ id: '3', completed_at: new Date(FIXED_BASE_TIME - 2 * HOUR).toISOString(), article_title: 'art', score: 3, total_questions: 3 }],
      });
      expect(items.length).toBe(3);
      expect(items[0].type).toBe('toeic'); // 1 hour ago
      expect(items[1].type).toBe('daily_reading'); // 2 hours ago
      expect(items[2].type).toBe('srs_review'); // 5 hours ago

      for (const item of items) {
        const val = validateTimelineItem(item);
        expect(val.valid).toBe(true);
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // FEATURE 5: Admin CRM Multi-Skill Integration & Accurate Customer Lifecycle
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 1 - Feature 5: Admin CRM Multi-Skill Integration & Customer Lifecycle', async () => {
    await runner.it('T1.5.1: Customer created <= 7 days ago is classified as "new"', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 3 * DAY).toISOString();
      const lifecycle = calculateCrmLifecycle(createdAt, null, FIXED_BASE_TIME);
      expect(lifecycle).toBe('new');
    });

    await runner.it('T1.5.2: Older account with activity <= 7 days in TOEIC is classified as "active"', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 45 * DAY).toISOString();
      const trueLastActive = calculateTrueLastActive({
        srsLastReviewedAt: null,
        toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 2 * DAY).toISOString(),
      });
      const lifecycle = calculateCrmLifecycle(createdAt, trueLastActive, FIXED_BASE_TIME);
      expect(lifecycle).toBe('active');
    });

    await runner.it('T1.5.3: Older account with activity <= 7 days in Reading is classified as "active"', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 60 * DAY).toISOString();
      const trueLastActive = calculateTrueLastActive({
        dailyReadingCompletedAt: new Date(FIXED_BASE_TIME - 12 * HOUR).toISOString(),
      });
      const lifecycle = calculateCrmLifecycle(createdAt, trueLastActive, FIXED_BASE_TIME);
      expect(lifecycle).toBe('active');
    });

    await runner.it('T1.5.4: Account inactive for 8 to 30 days is classified as "at_risk"', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 50 * DAY).toISOString();
      const trueLastActive = new Date(FIXED_BASE_TIME - 15 * DAY).toISOString();
      const lifecycle = calculateCrmLifecycle(createdAt, trueLastActive, FIXED_BASE_TIME);
      expect(lifecycle).toBe('at_risk');
    });

    await runner.it('T1.5.5: Account inactive for > 30 days is classified as "churned"', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 90 * DAY).toISOString();
      const trueLastActive = new Date(FIXED_BASE_TIME - 40 * DAY).toISOString();
      const lifecycle = calculateCrmLifecycle(createdAt, trueLastActive, FIXED_BASE_TIME);
      expect(lifecycle).toBe('churned');
    });

    await runner.it('T1.5.6: Account created > 7 days ago with 0 activities is classified as "churned"', () => {
      const createdAt = new Date(FIXED_BASE_TIME - 14 * DAY).toISOString();
      const lifecycle = calculateCrmLifecycle(createdAt, null, FIXED_BASE_TIME);
      expect(lifecycle).toBe('churned');
    });

    await runner.it('T1.5.7: MultiSkillStats contract validation passes for complete multi-skill breakdown', () => {
      const stats = buildMultiSkillStats({
        createdAt: new Date(FIXED_BASE_TIME - 40 * DAY).toISOString(),
        sources: {
          toeicLastAnsweredAt: new Date(FIXED_BASE_TIME - 1 * DAY).toISOString(),
          dailyReadingCompletedAt: new Date(FIXED_BASE_TIME - 3 * DAY).toISOString(),
        },
        vocab: { wordsSaved: 100, cardsLearned: 50, reviewsTotal: 200, lapsesTotal: 10, dueCount: 5 },
        grammar: { lessonsCompleted: 12, microLessonsPassed: 25 },
        reading: { articlesRead: 18 },
        toeic: { questionsAnswered: 150, correctCount: 135 },
        gamification: { streakDays: 7, lastActiveDate: '2026-10-04' },
        now: FIXED_BASE_TIME,
      });

      const validation = validateMultiSkillStats(stats);
      expect(validation.valid).toBe(true);
      expect(stats.lifecycle).toBe('active');
      expect(stats.toeic.accuracyPercent).toBe(90);
      expect(stats.grammar.lessonsCompleted).toBe(12);
      expect(stats.reading.articlesRead).toBe(18);
    });
  });
}
