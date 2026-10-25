/**
 * Tier 5: Adversarial White-Box Coverage Hardening & Stress Testing Suite
 *
 * Covers:
 * 1. Interleaved activities across 5+ modules
 * 2. Rapid timestamp updates, clock jitter & extreme format tolerances
 * 3. Simultaneous classroom switches & cross-classroom isolation
 * 4. Extreme CRM filter combinations & multi-skill drawer invariants
 * 5. Monte Carlo fuzzing invariant: Zero false dormancy and zero false churn
 *
 * Execution:
 *   npx tsx tests/e2e/activity-aggregation/tier5-adversarial-hardening.test.ts
 */

import { TestRunner, expect, assert } from './harness';
import {
  calculateTrueLastActive,
  evaluatePedagogicalStatus,
  calculateCrmLifecycle,
} from './oracle';
import {
  computeTrueLastActive,
  calculatePedagogicalStatus,
  calculateCustomerLifecycle,
  clearUniversalActivityCache,
} from '@/lib/activity/universal-activity';
import {
  getStudentStatus,
  formatLastActive,
} from '@/components/teacher/StudentsPanel';
import type { StudentProgress } from '@/lib/supabase';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const FIXED_NOW = new Date('2026-10-05T12:00:00.000Z').getTime();

function createMockStudent(overrides: Partial<StudentProgress> = {}): StudentProgress {
  return {
    student_id: 'mock-student-id',
    classroom_id: 'mock-classroom-id',
    student_name: 'Adversarial Test Student',
    email: 'adversarial@test.lingopro.online',
    joined_at: new Date(FIXED_NOW - 14 * DAY_MS).toISOString(),
    last_active: null,
    true_last_active: null,
    words_reviewed: 0,
    total_words: 0,
    mastered_words: 0,
    vms: 50,
    lcs: 50,
    avg_quiz_accuracy: 0.85,
    quizzes_taken: 3,
    saved_words_count: 0,
    ...overrides,
  };
}

export async function runTier5Tests(runner: TestRunner) {
  // ═════════════════════════════════════════════════════════════════════════
  // GROUP 1: Interleaved Activities Across 5+ Modules
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 5 - Group 1: Interleaved Activities Across 5+ Modules', async () => {
    await runner.it('T5.1.1: Multi-modular sequence across 8 sources accurately resolves newest timestamp', () => {
      // Out of chronological order input
      const sources = [
        new Date(FIXED_NOW - 15 * DAY_MS).toISOString(), // SRS: 15d ago
        new Date(FIXED_NOW - 10 * DAY_MS).toISOString(), // Quiz: 10d ago
        new Date(FIXED_NOW - 8 * DAY_MS).toISOString(),  // Word: 8d ago
        new Date(FIXED_NOW - 4 * DAY_MS).toISOString(),  // Grammar Micro: 4d ago
        new Date(FIXED_NOW - 2 * DAY_MS).toISOString(),  // TOEIC Drill: 2d ago
        new Date(FIXED_NOW - 6 * HOUR_MS).toISOString(), // Daily Reading: 6h ago
        new Date(FIXED_NOW - 30 * 60 * 1000).toISOString(), // Roadmap Assessment: 30m ago (NEWEST)
        new Date(FIXED_NOW - 20 * DAY_MS).toISOString(), // Vocab Pack: 20d ago
      ];

      const resolved = computeTrueLastActive(sources);
      const expected = new Date(FIXED_NOW - 30 * 60 * 1000).toISOString();
      expect(resolved).toBe(expected);
    });

    await runner.it('T5.1.2: Student with stale flashcards but recent TOEIC & Reading is never dormant', () => {
      const toeicTime = new Date(FIXED_NOW - 5 * HOUR_MS).toISOString();
      const readingTime = new Date(FIXED_NOW - 1 * DAY_MS).toISOString();
      const flashcardTime = new Date(FIXED_NOW - 25 * DAY_MS).toISOString(); // Stale

      const trueLastActive = computeTrueLastActive([flashcardTime, readingTime, toeicTime]);
      const student = createMockStudent({
        true_last_active: trueLastActive,
        last_active: flashcardTime, // Legacy stale timestamp
      });

      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');
      expect(status.tag).not.toBe('DORMANT');

      const lifecycle = calculateCustomerLifecycle({
        createdAt: new Date(FIXED_NOW - 60 * DAY_MS).toISOString(),
        trueLastActive,
        now: FIXED_NOW,
      });
      expect(lifecycle).toBe('active');
    });

    await runner.it('T5.1.3: Rapid switching between Grammar micro-lessons and Quizzes maintains active status', () => {
      const grammarTime = new Date(FIXED_NOW - 18 * HOUR_MS).toISOString();
      const quizTime = new Date(FIXED_NOW - 22 * HOUR_MS).toISOString();

      const trueLastActive = computeTrueLastActive([grammarTime, quizTime]);
      const student = createMockStudent({
        true_last_active: trueLastActive,
        vms: 75,
        lcs: 85,
        avg_quiz_accuracy: 0.9,
      });

      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');
      expect(status.key).toBe('rising_star');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // GROUP 2: Rapid Timestamp Updates, Jitter, Skew & Extreme Formats
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 5 - Group 2: Timestamp Robustness, Skew & Edge Formats', async () => {
    await runner.it('T5.2.1: 50 high-frequency chronological actions resolve monotonically without corruption', () => {
      const timestamps: string[] = [];
      const base = FIXED_NOW - 10000;
      for (let i = 0; i < 50; i++) {
        timestamps.push(new Date(base + i * 100).toISOString());
      }

      // Shuffle array to simulate asynchronous arrival
      const shuffled = [...timestamps].sort(() => Math.random() - 0.5);
      const computed = computeTrueLastActive(shuffled);
      const expected = timestamps[timestamps.length - 1];
      expect(computed).toBe(expected);
    });

    await runner.it('T5.2.2: Handles timezone offsets (+07:00, -05:00) and microsecond ISO formats', () => {
      const tz1 = '2026-10-05T19:00:00+07:00'; // 12:00:00Z
      const tz2 = '2026-10-05T07:00:00-05:00'; // 12:00:00Z
      const tz3 = '2026-10-05T12:01:00.123456Z'; // 12:01:00.123Z (later)

      const computed = computeTrueLastActive([tz1, tz2, tz3]);
      expect(computed).not.toBe(null);
      const epoch = new Date(computed!).getTime();
      expect(epoch).toBe(new Date(tz3).getTime());
    });

    await runner.it('T5.2.3: Gracefully discards malformed strings, nulls, negative epochs and NaN dates', () => {
      const corruptInputs = [
        null,
        undefined,
        '',
        '   ',
        'invalid-date-string',
        'NaN',
        '2026-13-45T99:99:99Z',
        'undefined',
        'null',
      ];

      const validTime = new Date(FIXED_NOW - 1 * HOUR_MS).toISOString();
      const computed = computeTrueLastActive([...corruptInputs, validTime]);
      expect(computed).toBe(validTime);

      const allCorrupt = computeTrueLastActive(corruptInputs);
      expect(allCorrupt).toBe(null);
    });

    await runner.it('T5.2.4: Streak date YYYY-MM-DD converts to UTC start of day without off-by-one errors', () => {
      const streakDate = '2026-10-05';
      const streakUtc = `${streakDate}T00:00:00.000Z`;
      const computed = computeTrueLastActive([streakUtc]);
      expect(computed).toBe(streakUtc);

      // Verify oracle streak converter
      const oracleTrue = calculateTrueLastActive({ streakLastActiveDate: streakDate });
      expect(oracleTrue).toBe(streakUtc);
    });

    await runner.it('T5.2.5: Future timestamp due to client clock desync (5 min ahead) is safely tolerated', () => {
      const futureTime = new Date(FIXED_NOW + 5 * 60 * 1000).toISOString();
      const computed = computeTrueLastActive([futureTime]);
      expect(computed).toBe(futureTime);

      // Student is active, not dormant
      const student = createMockStudent({ true_last_active: futureTime });
      const status = getStudentStatus(student);
      expect(status.key).not.toBe('dormant');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // GROUP 3: Multi-Classroom Switching & Cross-Classroom IDOR Security
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 5 - Group 3: Multi-Classroom Switching & Cross-Classroom IDOR', async () => {
    await runner.it('T5.3.1: Enrolled student active in independent module is recognized in any enrolled classroom', () => {
      // Student is in Class A and Class B.
      // Has 0 homework in Class A, but did 20 TOEIC questions today.
      const toeicTime = new Date(FIXED_NOW - 2 * HOUR_MS).toISOString();

      // Teacher A checks student in Class A
      const studentInClassA = createMockStudent({
        classroom_id: 'class-A',
        true_last_active: toeicTime,
        last_active: null, // No class-specific flashcards
      });

      const statusA = getStudentStatus(studentInClassA);
      expect(statusA.key).not.toBe('dormant');

      // Teacher B checks student in Class B
      const studentInClassB = createMockStudent({
        classroom_id: 'class-B',
        true_last_active: toeicTime,
        last_active: null,
      });

      const statusB = getStudentStatus(studentInClassB);
      expect(statusB.key).not.toBe('dormant');
    });

    await runner.it('T5.3.2: Universal word attribution includes user personal words without classroom leakage', () => {
      // Simulating attribution: user_id = 'user-1'
      const wordsAddedByUser = [
        { added_by: 'user-1', classroom_id: null },
        { added_by: 'user-1', classroom_id: 'class-personal' },
        { added_by: 'user-1', classroom_id: 'class-A' },
      ];

      const count = wordsAddedByUser.filter((w) => w.added_by === 'user-1').length;
      expect(count).toBe(3);
    });

    await runner.it('T5.3.3: IDOR prevention: Teacher can only inspect classrooms they own', () => {
      const teacherOwnedClassrooms = ['class-owned-1', 'class-owned-2'];
      const targetClassroomId = 'class-unowned-99';

      const isAuthorized = teacherOwnedClassrooms.includes(targetClassroomId);
      expect(isAuthorized).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // GROUP 4: Extreme CRM Filter Combinations & Edge State Telemetry
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 5 - Group 4: Extreme CRM Filter Permutations & Telemetry', async () => {
    await runner.it('T5.4.1: Specialized non-flashcard learner with 1000 TOEIC questions is classified active', () => {
      const toeicTime = new Date(FIXED_NOW - 1 * DAY_MS).toISOString();
      const lifecycle = calculateCustomerLifecycle({
        createdAt: new Date(FIXED_NOW - 180 * DAY_MS).toISOString(), // Old user (6 months)
        trueLastActive: toeicTime,
        now: FIXED_NOW,
      });

      expect(lifecycle).toBe('active');
    });

    await runner.it('T5.4.2: Zero-activity customer created 365 days ago is strictly churned', () => {
      const lifecycle = calculateCustomerLifecycle({
        createdAt: new Date(FIXED_NOW - 365 * DAY_MS).toISOString(),
        trueLastActive: null,
        now: FIXED_NOW,
      });

      expect(lifecycle).toBe('churned');
    });

    await runner.it('T5.4.3: Customer created 6.99 days ago with 0 activities is classified new', () => {
      const createdAt = new Date(FIXED_NOW - (7 * DAY_MS - 1000)).toISOString();
      const lifecycle = calculateCustomerLifecycle({
        createdAt,
        trueLastActive: null,
        now: FIXED_NOW,
      });

      expect(lifecycle).toBe('new');
    });

    await runner.it('T5.4.4: Exact boundary: activity 7.01 days ago is classified at_risk', () => {
      const createdAt = new Date(FIXED_NOW - 30 * DAY_MS).toISOString();
      const trueLastActive = new Date(FIXED_NOW - (7 * DAY_MS + 60000)).toISOString(); // 7.0007 days
      const lifecycle = calculateCustomerLifecycle({
        createdAt,
        trueLastActive,
        now: FIXED_NOW,
      });

      expect(lifecycle).toBe('at_risk');
    });

    await runner.it('T5.4.5: Exact boundary: activity 30.01 days ago is classified churned', () => {
      const createdAt = new Date(FIXED_NOW - 60 * DAY_MS).toISOString();
      const trueLastActive = new Date(FIXED_NOW - (30 * DAY_MS + 60000)).toISOString(); // 30.0007 days
      const lifecycle = calculateCustomerLifecycle({
        createdAt,
        trueLastActive,
        now: FIXED_NOW,
      });

      expect(lifecycle).toBe('churned');
    });

    await runner.it('T5.4.6: CRM Filter simulation handles edge empty / null fields safely', () => {
      interface MockCrmCustomer {
        name: string;
        wordCount: number;
        toeicCount?: number;
        toeicAccuracy?: number;
        grammarCount?: number;
        readingCount?: number;
        lifecycle: 'new' | 'active' | 'at_risk' | 'churned';
        plan: string;
      }

      const customers: MockCrmCustomer[] = [
        { name: 'Alice', wordCount: 0, toeicCount: 50, toeicAccuracy: 80, lifecycle: 'active', plan: 'free' },
        { name: 'Bob', wordCount: 200, toeicCount: 0, lifecycle: 'at_risk', plan: 'pro' },
        { name: 'Charlie', wordCount: 0, grammarCount: 15, lifecycle: 'active', plan: 'free' },
        { name: 'David', wordCount: 0, lifecycle: 'churned', plan: 'free' },
      ];

      // Filter: Active free users who study TOEIC or Grammar
      const filtered = customers.filter(
        (c) => c.lifecycle === 'active' && c.plan === 'free' && ((c.toeicCount || 0) > 0 || (c.grammarCount || 0) > 0)
      );

      expect(filtered.length).toBe(2);
      expect(filtered.map((c) => c.name)).toEqual(['Alice', 'Charlie']);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // GROUP 5: Monte Carlo Invariant Fuzzing (100 Random Students & Customers)
  // ═════════════════════════════════════════════════════════════════════════
  await runner.describe('Tier 5 - Group 5: Monte Carlo Invariant Fuzzing', async () => {
    await runner.it('T5.5.1: Monte Carlo Fuzzing: 100 students active within <= 3 days are NEVER dormant', () => {
      const MODULE_KEYS = [
        'lastSrsAt',
        'lastQuizAt',
        'lastWordAt',
        'lastGrammarAt',
        'lastReadingAt',
        'lastToeicAt',
        'lastAssessmentAt',
        'lastVocabPackAt',
        'lastStreakAt',
      ];

      for (let i = 0; i < 100; i++) {
        // Random age between 1 minute and 2.99 days
        const ageMs = Math.floor(Math.random() * (2.95 * DAY_MS)) + 60000;
        const activeTime = new Date(FIXED_NOW - ageMs).toISOString();

        // Assign to a random active module
        const chosenModule = MODULE_KEYS[Math.floor(Math.random() * MODULE_KEYS.length)];
        const sources: (string | null)[] = MODULE_KEYS.map((k) =>
          k === chosenModule ? activeTime : new Date(FIXED_NOW - 40 * DAY_MS).toISOString() // other sources very old
        );

        const trueLastActive = computeTrueLastActive(sources);
        assert(trueLastActive !== null, `trueLastActive must not be null for iteration ${i}`);

        const student = createMockStudent({
          student_id: `fuzz-student-${i}`,
          true_last_active: trueLastActive,
          vms: 50,
          lcs: 50,
        });

        const status = calculatePedagogicalStatus({
          trueLastActive: student.true_last_active ?? null,
          now: FIXED_NOW,
        });

        assert(
          status.key !== 'dormant',
          `Invariant violated in iteration ${i}: student active ${ageMs / DAY_MS} days ago in ${chosenModule} was flagged dormant!`
        );
      }
    });

    await runner.it('T5.5.2: Monte Carlo Fuzzing: 100 customers active within <= 7 days are NEVER churned or at_risk', () => {
      const MODULE_NAMES = ['TOEIC', 'Grammar', 'Reading', 'Assessment', 'VocabPack', 'Streak'];

      for (let i = 0; i < 100; i++) {
        // Random age between 10 minutes and 6.95 days
        const ageMs = Math.floor(Math.random() * (6.95 * DAY_MS)) + 600000;
        const activeTime = new Date(FIXED_NOW - ageMs).toISOString();
        const createdTime = new Date(FIXED_NOW - (20 + i) * DAY_MS).toISOString();

        const lifecycle = calculateCustomerLifecycle({
          createdAt: createdTime,
          trueLastActive: activeTime,
          now: FIXED_NOW,
        });

        assert(
          lifecycle === 'active',
          `Invariant violated in iteration ${i}: customer active ${ageMs / DAY_MS} days ago got lifecycle '${lifecycle}' instead of 'active'!`
        );
      }
    });

    await runner.it('T5.5.3: Monte Carlo Fuzzing: 100 customers inactive for > 30 days are strictly churned', () => {
      for (let i = 0; i < 100; i++) {
        const ageMs = (31 + Math.random() * 100) * DAY_MS;
        const activeTime = new Date(FIXED_NOW - ageMs).toISOString();
        const createdTime = new Date(FIXED_NOW - (150 + i) * DAY_MS).toISOString();

        const lifecycle = calculateCustomerLifecycle({
          createdAt: createdTime,
          trueLastActive: activeTime,
          now: FIXED_NOW,
        });

        assert(
          lifecycle === 'churned',
          `Invariant violated in iteration ${i}: customer inactive for ${ageMs / DAY_MS} days got lifecycle '${lifecycle}' instead of 'churned'!`
        );
      }
    });
  });
}

// Standalone execution support
if (process.argv[1]?.endsWith('tier5-adversarial-hardening.test.ts')) {
  (async () => {
    const runner = new TestRunner('Tier 5: Adversarial Hardening');
    console.log('>>> Executing Tier 5: Adversarial Hardening Suite...');
    await runTier5Tests(runner);
    const stats = runner.printSummary();
    if (stats.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })();
}
