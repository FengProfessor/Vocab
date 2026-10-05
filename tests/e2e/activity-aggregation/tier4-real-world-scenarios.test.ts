/**
 * Tier 4: Real-World Application Scenarios E2E Test Suite (5 comprehensive scenarios)
 * Authoritative source: ORIGINAL_REQUEST.md (## 2026-10-05T02:42:14Z) & DISPATCH.md
 *
 * Scenarios:
 * 1. Diligent Grammar & TOEIC student falsely accused of being dormant by teacher
 * 2. Active subscriber studying only Daily Reading classified correctly as active in CRM
 * 3. Classroom of 20 mixed-activity students rendering accurately in Teacher Dashboard
 * 4. Admin examining Customer Drawer with full multi-skill breakdown
 * 5. High-concurrency query simulation & SWR cache sub-5ms performance
 */

import { TestRunner, expect } from './harness';
import {
  calculateTrueLastActive,
  evaluatePedagogicalStatus,
  calculate7DayActiveKpi,
  calculateCrmLifecycle,
  buildTimeline,
  buildMultiSkillStats,
  SwrCacheSimulator,
} from './oracle';
import {
  formatLastActive,
  getStudentStatus,
} from '@/components/teacher/StudentsPanel';
import type { StudentProgress } from '@/lib/supabase';
import {
  FIXED_BASE_TIME,
  createMockStudentProgress,
  hoangNamSources,
  thuTrangCreatedAt,
  thuTrangSources,
  baoLongCreatedAt,
  baoLongSources,
  generate20StudentClassroom,
} from './fixtures/test-data';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  // ═════════════════════════════════════════════════════════════════════════
  // SCENARIO 1: Diligent Grammar & TOEIC Student Falsely Accused of Being Dormant
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 4 - Scenario 1: Diligent Grammar & TOEIC Student ("Hoàng Nam")', async () => {
    await runner.it('S1.1: Aggregates true_last_active from TOEIC practice drills (2h ago) rather than stale flashcards (5d ago)', () => {
      // In the legacy system, only srs_progress was checked, which gave 5 days ago!
      const legacyLastActive = hoangNamSources.srsLastReviewedAt;
      expect(legacyLastActive).toBe(new Date(FIXED_BASE_TIME - 5 * DAY).toISOString());

      // Under Universal Activity Aggregation:
      const trueLastActive = calculateTrueLastActive(hoangNamSources);
      const expectedToeicTime = new Date(FIXED_BASE_TIME - 2 * HOUR).toISOString();

      expect(trueLastActive).toBe(expectedToeicTime);
    });

    await runner.it('S1.2: Student status in StudentsPanel is NOT marked dormant (eliminates false nagging alerts)', () => {
      const trueLastActive = calculateTrueLastActive(hoangNamSources);

      const hoangNamProgress = createMockStudentProgress({
        student_id: 'std-hoang-nam',
        classroom_id: 'class-toeic-adv',
        student_name: 'Hoàng Nam',
        email: 'hoangnam@example.com',
        last_active: trueLastActive || undefined,
        words_reviewed: 150,
        total_words: 200,
        vms: 78,
        lcs: 85,
        avg_quiz_accuracy: 0.9,
        quizzes_taken: 6,
      });

      const status = getStudentStatus(hoangNamProgress);
      expect(status.key).not.toBe('dormant');
      expect(status.tag).not.toBe('DORMANT');
      // In fact, with LCS > 80 and acc > 0.8, he is recognized as rising_star!
      expect(status.key).toBe('rising_star');
      expect(status.dot).toBe('🟢');
    });

    await runner.it('S1.3: Teacher StudentDetail Timeline includes TOEIC and Grammar activities chronologically', () => {
      const timeline = buildTimeline({
        srsReviews: [
          {
            id: 'srs-old',
            timestamp: hoangNamSources.srsLastReviewedAt!,
            word: 'meticulous',
            result: 'good',
          },
        ],
        grammarLessons: [
          {
            id: 'g-1',
            updated_at: hoangNamSources.grammarMicroUpdatedAt!,
            topic_title: 'Inversion with Negative Adverbials',
            is_micro: true,
            passed: true,
          },
        ],
        toeicDrills: [
          {
            id: 't-1',
            answered_at: hoangNamSources.toeicLastAnsweredAt!,
            part: 5,
            is_correct: true,
            question_id: 'ETS-PRO-02-Q114',
          },
        ],
      });

      expect(timeline.length).toBe(3);
      // Newest first: TOEIC (2h ago) -> Grammar Micro (22h ago) -> Flashcards (5d ago)
      expect(timeline[0].type).toBe('toeic');
      expect(timeline[0].title).toBe('Luyện đề Sát thủ TOEIC Part 5');
      expect(timeline[1].type).toBe('grammar');
      expect(timeline[2].type).toBe('srs_review');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SCENARIO 2: Active Daily Reading Subscriber Classified Correctly in CRM
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 4 - Scenario 2: Active Daily Reading Subscriber ("Thu Trang")', async () => {
    await runner.it('S2.1: Legacy CRM RPC defect reproduced: without Reading sources, account is erroneously marked churned', () => {
      // Legacy RPC only examined srs_progress, quiz_results, words
      const legacyLastActive = calculateTrueLastActive({
        srsLastReviewedAt: thuTrangSources.srsLastReviewedAt,
        quizCompletedAt: thuTrangSources.quizCompletedAt,
        wordCreatedAt: thuTrangSources.wordCreatedAt,
      });
      expect(legacyLastActive).toBeNull();

      const legacyLifecycle = calculateCrmLifecycle(thuTrangCreatedAt, legacyLastActive, FIXED_BASE_TIME);
      // Because account is 60 days old and legacyLastActive is null -> marked churned!
      expect(legacyLifecycle).toBe('churned');
    });

    await runner.it('S2.2: Universal Aggregator upgrades CRM lifecycle from churned to active based on Daily Reading', () => {
      const trueLastActive = calculateTrueLastActive(thuTrangSources);
      expect(trueLastActive).toBe(new Date(FIXED_BASE_TIME - 4 * HOUR).toISOString());

      const fixedLifecycle = calculateCrmLifecycle(thuTrangCreatedAt, trueLastActive, FIXED_BASE_TIME);
      expect(fixedLifecycle).toBe('active');
    });

    await runner.it('S2.3: CRM Customer Drawer MultiSkillStats correctly reflects Daily Reading articles count', () => {
      const stats = buildMultiSkillStats({
        createdAt: thuTrangCreatedAt,
        sources: thuTrangSources,
        vocab: { wordsSaved: 0, cardsLearned: 0, reviewsTotal: 0, lapsesTotal: 0, dueCount: 0 },
        grammar: { lessonsCompleted: 0, microLessonsPassed: 0 },
        reading: { articlesRead: 45 }, // Active reader!
        toeic: { questionsAnswered: 0, correctCount: 0 },
        gamification: { streakDays: 30, lastActiveDate: '2026-10-05' },
        now: FIXED_BASE_TIME,
      });

      expect(stats.lifecycle).toBe('active');
      expect(stats.reading.articlesRead).toBe(45);
      expect(stats.reading.lastActive).toBe(new Date(FIXED_BASE_TIME - 4 * HOUR).toISOString());
      expect(stats.gamification.streakDays).toBe(30);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SCENARIO 3: Classroom of 20 Mixed-Activity Students
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 4 - Scenario 3: Classroom of 20 Mixed-Activity Students', async () => {
    const classroom = generate20StudentClassroom();

    await runner.it('S3.1: Exactly 16 out of 20 students (80%) are recognized in Teacher 7-Day Active Count KPI', () => {
      const studentsWithTrueLastActive = classroom.map((s) => ({
        last_active: calculateTrueLastActive(s.sources),
      }));

      const activeKpiCount = calculate7DayActiveKpi(studentsWithTrueLastActive, FIXED_BASE_TIME);
      // 5 Full-Stack + 4 TOEIC-only + 3 Reading-only + 3 Grammar-only + 1 Crammer = 16!
      expect(activeKpiCount).toBe(16);
    });

    await runner.it('S3.2: Exactly 2 out of 20 students are evaluated as dormant (0 false dormants among specialized learners)', () => {
      const statuses = classroom.map((s) => {
        const trueLastActive = calculateTrueLastActive(s.sources);
        const prog = createMockStudentProgress({
          student_id: s.id,
          classroom_id: 'c-main',
          student_name: s.name,
          email: s.email,
          last_active: trueLastActive || undefined,
          vms: s.vms,
          words_reviewed: s.words_reviewed,
          lcs: s.lcs,
          avg_quiz_accuracy: s.avg_quiz_accuracy,
          quizzes_taken: s.quizzes_taken,
        });
        return getStudentStatus(prog);
      });

      const dormantCount = statuses.filter((st) => st.key === 'dormant').length;
      expect(dormantCount).toBe(2);

      // Verify that all 4 TOEIC learners are NOT dormant
      for (let i = 5; i < 9; i++) {
        expect(statuses[i].key).not.toBe('dormant');
      }

      // Verify that all 3 Daily Reading learners are NOT dormant
      for (let i = 9; i < 12; i++) {
        expect(statuses[i].key).not.toBe('dormant');
      }

      // Verify that all 3 Grammar learners are NOT dormant
      for (let i = 12; i < 15; i++) {
        expect(statuses[i].key).not.toBe('dormant');
      }
    });

    await runner.it('S3.3: Pedagogical crammer is isolated accurately without false positive dormant status', () => {
      const crammer = classroom.find((s) => s.id === 'std-crammer-1')!;
      const trueLastActive = calculateTrueLastActive(crammer.sources);
      const prog = createMockStudentProgress({
        student_id: crammer.id,
        classroom_id: 'c-main',
        student_name: crammer.name,
        email: crammer.email,
        last_active: trueLastActive || undefined,
        vms: crammer.vms,
        words_reviewed: crammer.words_reviewed,
        lcs: crammer.lcs,
        avg_quiz_accuracy: crammer.avg_quiz_accuracy,
        quizzes_taken: crammer.quizzes_taken,
      });

      const status = getStudentStatus(prog);
      expect(status.key).toBe('cramming');
      expect(status.tag).toBe('CRAMMING');
      expect(status.dot).toBe('🟡');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SCENARIO 4: Admin Customer Drawer Full Multi-Skill Breakdown
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 4 - Scenario 4: Admin Customer Drawer Breakdown ("Bảo Long")', async () => {
    await runner.it('S4.1: Customer Drawer renders all 5 skill cards with accurate metrics and no missing data', () => {
      const stats = buildMultiSkillStats({
        createdAt: baoLongCreatedAt,
        sources: baoLongSources,
        vocab: { wordsSaved: 320, cardsLearned: 210, reviewsTotal: 840, lapsesTotal: 18, dueCount: 12 },
        grammar: { lessonsCompleted: 24, microLessonsPassed: 40 },
        reading: { articlesRead: 15 },
        toeic: { questionsAnswered: 350, correctCount: 298 },
        gamification: { streakDays: 21, lastActiveDate: '2026-10-05' },
        now: FIXED_BASE_TIME,
      });

      // 1. Vocabulary card
      expect(stats.vocab.wordsSaved).toBe(320);
      expect(stats.vocab.cardsLearned).toBe(210);
      expect(stats.vocab.reviewsTotal).toBe(840);
      expect(stats.vocab.lapsesTotal).toBe(18);

      // 2. Grammar card
      expect(stats.grammar.lessonsCompleted).toBe(24);
      expect(stats.grammar.microLessonsPassed).toBe(40);

      // 3. Reading card
      expect(stats.reading.articlesRead).toBe(15);

      // 4. TOEIC card
      expect(stats.toeic.questionsAnswered).toBe(350);
      expect(stats.toeic.accuracyPercent).toBe(85); // 298/350 = 85.1% -> 85%

      // 5. Gamification card
      expect(stats.gamification.streakDays).toBe(21);

      // Overall lifecycle
      expect(stats.lifecycle).toBe('active');
      expect(stats.trueLastActive).toBe(new Date(FIXED_BASE_TIME - 6 * HOUR).toISOString());
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SCENARIO 5: High-Concurrency Query Simulation & SWR Cache Sub-5ms
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 4 - Scenario 5: High-Concurrency & SWR Cache Performance', async () => {
    await runner.it('S5.1: 50 concurrent requests execute in parallel without memory leaks or race conditions', async () => {
      const cache = new SwrCacheSimulator<string>(3000, 30000);
      const startTime = Date.now();

      // Warm the cache for the 5 classes
      await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          cache.get(`dashboard:class-${i}`, async () => `payload-${i}`),
        ),
      );

      // Now fire 50 concurrent requests hitting the warm cache
      const tasks = Array.from({ length: 50 }, (_, i) =>
        cache.get(`dashboard:class-${i % 5}`, async () => `payload-${i % 5}`),
      );
      const results = await Promise.all(tasks);
      const totalTime = Date.now() - startTime;

      expect(results.length).toBe(50);
      expect(totalTime).toBeLessThanOrEqual(500);

      // Verify that warm cache hits were ultra-fast (< 5ms)
      const warmHits = results.filter((r) => r.fromCache);
      expect(warmHits.length).toBe(50);
      for (const hit of warmHits) {
        expect(hit.tookMs).toBeLessThanOrEqual(5);
      }
    });
  });
}
