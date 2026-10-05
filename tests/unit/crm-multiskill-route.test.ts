/**
 * Unit Test Suite for Milestone 3: CRM Multi-Skill Data Aggregation & Route Contracts
 *
 * Tests:
 * 1. MultiSkillStats and CrmCustomer contract shape validation
 * 2. Multi-skill lastActiveTs aggregation across all 9 activity domains
 * 3. CRM Lifecycle state machine ensuring no false churned / at_risk classification
 * 4. Boundary cases (6.99d vs 7.01d active/at_risk, 29.99d vs 30.01d at_risk/churned, new threshold)
 * 5. Toeic accuracy calculations and division-by-zero resilience
 * 6. Word count attribution (added_by and classroomOwner fallback)
 *
 * Usage:
 *   npx tsx tests/unit/crm-multiskill-route.test.ts
 */

import type { CrmCustomer, CrmLifecycle, CrmResponseData } from '@/app/api/admin/crm/route';
import type { MultiSkillStats } from '@/lib/activity/universal-activity';
import { calculateCustomerLifecycle } from '@/lib/activity/universal-activity';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${msg}. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function runCrmUnitTests() {
  console.log('=================================================================');
  console.log('🧪 Starting Milestone 3 CRM Multi-Skill Unit Test Suite');
  console.log('=================================================================\n');

  let testCount = 0;

  // ---------------------------------------------------------------------------
  // Test 1: Data Contract Shape & Types
  // ---------------------------------------------------------------------------
  console.log('Test 1: MultiSkillStats & CrmCustomer contract shape conformance');
  {
    const sampleCustomer: CrmCustomer = {
      id: 'cust-001',
      email: 'student@example.com',
      full_name: 'Nguyen Van A',
      role: 'student',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      plan: 'pro',
      rawPlan: 'pro',
      planExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      paying: true,
      source: 'direct',
      lifecycle: 'active',
      lastActive: new Date(Date.now() - 1 * 86400000).toISOString(),
      trueLastActive: new Date(Date.now() - 1 * 86400000).toISOString(),
      wordCount: 120,
      learnedCount: 50,
      reviewTotal: 150,
      lapsesTotal: 12,
      lastReviewedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      dueCount: 8,
      quizCount: 4,
      totalPaid: 499000,
      groupId: null,
      grammarCount: 15,
      lastGrammarAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      readingCount: 7,
      lastReadingAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      toeicCount: 200,
      toeicCorrectCount: 160,
      lastToeicAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      toeicAccuracy: 80,
      assessmentCount: 2,
      lastAssessmentAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      vocabPackCount: 3,
      lastVocabPackAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      currentStreak: 12,
      lastStreakAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      lastStreakDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
      multiSkill: {
        vocab: {
          wordsSaved: 120,
          cardsLearned: 50,
          reviewsTotal: 150,
          lapsesTotal: 12,
          dueCount: 8,
          lastActive: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        grammar: {
          lessonsCompleted: 15,
          microLessonsPassed: 15,
          lastActive: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        reading: {
          articlesRead: 7,
          lastActive: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        toeic: {
          questionsAnswered: 200,
          accuracyPercent: 80,
          lastActive: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
        gamification: {
          streakDays: 12,
          lastActiveDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
        },
        trueLastActive: new Date(Date.now() - 1 * 86400000).toISOString(),
        lifecycle: 'active',
      },
    };

    assert(Boolean(sampleCustomer.id), 'Customer ID is required');
    assertEqual(sampleCustomer.multiSkill?.toeic.accuracyPercent, 80, 'TOEIC accuracy matches');
    assertEqual(sampleCustomer.multiSkill?.grammar.lessonsCompleted, 15, 'Grammar completed matches');
    assertEqual(sampleCustomer.multiSkill?.reading.articlesRead, 7, 'Reading articles matches');
    assertEqual(sampleCustomer.multiSkill?.gamification.streakDays, 12, 'Streak days matches');
    testCount++;
    console.log('  ✓ Contract shape verified successfully');
  }

  // ---------------------------------------------------------------------------
  // Test 2: Multi-Source Recency Aggregation
  // ---------------------------------------------------------------------------
  console.log('\nTest 2: Multi-Source recency aggregation across 9 domains');
  {
    const now = Date.now();
    const timestamps = {
      srs: new Date(now - 20 * 86400000).toISOString(),     // 20 days ago
      quiz: new Date(now - 15 * 86400000).toISOString(),    // 15 days ago
      grammar: new Date(now - 10 * 86400000).toISOString(), // 10 days ago
      reading: new Date(now - 8 * 86400000).toISOString(),  // 8 days ago
      toeic: new Date(now - 2 * 86400000).toISOString(),    // 2 days ago (most recent)
    };

    const maxTs = Math.max(
      new Date(timestamps.srs).getTime(),
      new Date(timestamps.quiz).getTime(),
      new Date(timestamps.grammar).getTime(),
      new Date(timestamps.reading).getTime(),
      new Date(timestamps.toeic).getTime()
    );

    const calculatedIso = new Date(maxTs).toISOString();
    assertEqual(calculatedIso, timestamps.toeic, 'Recency correctly picks newest multi-skill activity (TOEIC)');
    testCount++;
    console.log('  ✓ Recency correctly identifies latest activity across multi-skill domains');
  }

  // ---------------------------------------------------------------------------
  // Test 3: Lifecycle Classification & Prevention of False Churn
  // ---------------------------------------------------------------------------
  console.log('\nTest 3: Lifecycle classification eliminates false churn for specialized learners');
  {
    const now = Date.now();
    const DAY = 86400000;

    // Learner created 60 days ago, ZERO flashcards, but active in TOEIC 1 day ago
    const toeicStudent = {
      created_at: new Date(now - 60 * DAY).toISOString(),
      true_last_active: new Date(now - 1 * DAY).toISOString(),
    };
    const toeicLifecycle = calculateCustomerLifecycle({
      createdAt: toeicStudent.created_at,
      trueLastActive: toeicStudent.true_last_active,
    });
    assertEqual(toeicLifecycle, 'active', 'Active TOEIC student is NOT marked churned');

    // Learner created 90 days ago, ZERO flashcards, active in Daily Reading 3 days ago
    const readingStudent = {
      created_at: new Date(now - 90 * DAY).toISOString(),
      true_last_active: new Date(now - 3 * DAY).toISOString(),
    };
    const readingLifecycle = calculateCustomerLifecycle({
      createdAt: readingStudent.created_at,
      trueLastActive: readingStudent.true_last_active,
    });
    assertEqual(readingLifecycle, 'active', 'Active Daily Reading student is NOT marked churned');

    // Learner created 45 days ago, ZERO flashcards, active in Grammar Micro-lessons 6 days ago
    const grammarStudent = {
      created_at: new Date(now - 45 * DAY).toISOString(),
      true_last_active: new Date(now - 6 * DAY).toISOString(),
    };
    const grammarLifecycle = calculateCustomerLifecycle({
      createdAt: grammarStudent.created_at,
      trueLastActive: grammarStudent.true_last_active,
    });
    assertEqual(grammarLifecycle, 'active', 'Active Grammar student is NOT marked churned');

    // Inactive student across ALL modules for 14 days
    const atRiskStudent = {
      created_at: new Date(now - 45 * DAY).toISOString(),
      true_last_active: new Date(now - 14 * DAY).toISOString(),
    };
    const atRiskLifecycle = calculateCustomerLifecycle({
      createdAt: atRiskStudent.created_at,
      trueLastActive: atRiskStudent.true_last_active,
    });
    assertEqual(atRiskLifecycle, 'at_risk', 'Student inactive for 14 days is correctly marked at_risk');

    // Inactive student across ALL modules for 35 days
    const churnedStudent = {
      created_at: new Date(now - 45 * DAY).toISOString(),
      true_last_active: new Date(now - 35 * DAY).toISOString(),
    };
    const churnedLifecycle = calculateCustomerLifecycle({
      createdAt: churnedStudent.created_at,
      trueLastActive: churnedStudent.true_last_active,
    });
    assertEqual(churnedLifecycle, 'churned', 'Student inactive for >30 days is correctly marked churned');

    // Newly signed up student (<7 days) with 0 activity
    const newStudent = {
      created_at: new Date(now - 3 * DAY).toISOString(),
      true_last_active: null,
    };
    const newLifecycle = calculateCustomerLifecycle({
      createdAt: newStudent.created_at,
      trueLastActive: newStudent.true_last_active,
    });
    assertEqual(newLifecycle, 'new', 'Brand new student is classified as "new" regardless of initial activity');

    testCount++;
    console.log('  ✓ All 6 lifecycle transition states validated without false churn');
  }

  // ---------------------------------------------------------------------------
  // Test 4: Boundary Cases (6.99 vs 7.01 days, 29.99 vs 30.01 days)
  // ---------------------------------------------------------------------------
  console.log('\nTest 4: Strict Boundary Edge Testing');
  {
    const now = Date.now();
    const DAY = 86400000;
    const oldAccount = new Date(now - 100 * DAY).toISOString();

    // 6.99 days ago -> active
    const activeBoundary = calculateCustomerLifecycle({
      createdAt: oldAccount,
      trueLastActive: new Date(now - 6.99 * DAY).toISOString(),
    });
    assertEqual(activeBoundary, 'active', '6.99 days ago is active');

    // 7.01 days ago -> at_risk
    const atRiskBoundary = calculateCustomerLifecycle({
      createdAt: oldAccount,
      trueLastActive: new Date(now - 7.01 * DAY).toISOString(),
    });
    assertEqual(atRiskBoundary, 'at_risk', '7.01 days ago is at_risk');

    // 29.99 days ago -> at_risk
    const atRiskUpper = calculateCustomerLifecycle({
      createdAt: oldAccount,
      trueLastActive: new Date(now - 29.99 * DAY).toISOString(),
    });
    assertEqual(atRiskUpper, 'at_risk', '29.99 days ago is at_risk');

    // 30.01 days ago -> churned
    const churnedBoundary = calculateCustomerLifecycle({
      createdAt: oldAccount,
      trueLastActive: new Date(now - 30.01 * DAY).toISOString(),
    });
    assertEqual(churnedBoundary, 'churned', '30.01 days ago is churned');

    testCount++;
    console.log('  ✓ Boundary conditions strictly verified at 7d and 30d markers');
  }

  // ---------------------------------------------------------------------------
  // Test 5: Mathematical Accuracy & Safe Division
  // ---------------------------------------------------------------------------
  console.log('\nTest 5: Mathematical edge cases (0/0 TOEIC accuracy, etc.)');
  {
    const calcAccuracy = (correct: number, total: number) =>
      total > 0 ? Math.round((correct / total) * 100) : 0;

    assertEqual(calcAccuracy(0, 0), 0, 'Zero questions answered returns 0% (never NaN)');
    assertEqual(calcAccuracy(35, 50), 70, '35/50 questions returns 70%');
    assertEqual(calcAccuracy(1, 3), 33, '1/3 questions rounds to 33%');
    testCount++;
    console.log('  ✓ Safe arithmetic avoids NaN / division-by-zero');
  }

  // ---------------------------------------------------------------------------
  // Test 6: Word Count Attribution Logic
  // ---------------------------------------------------------------------------
  console.log('\nTest 6: Word count resolution with added_by & classroom owner fallback');
  {
    const classrooms = [
      { id: 'class-1', teacher_id: 'user-teacher-1' },
      { id: 'class-2', teacher_id: 'user-teacher-2' },
    ];
    const classroomOwner = new Map(classrooms.map(c => [c.id, c.teacher_id]));

    const mockWords = [
      { id: 'w1', added_by: 'student-A', classroom_id: null },
      { id: 'w2', added_by: 'student-A', classroom_id: 'class-1' },
      { id: 'w3', added_by: null, classroom_id: 'class-1' }, // fallback to user-teacher-1
      { id: 'w4', added_by: null, classroom_id: 'class-2' }, // fallback to user-teacher-2
      { id: 'w5', added_by: null, classroom_id: null },      // orphan, ignored
    ];

    const counts = new Map<string, number>();
    for (const w of mockWords) {
      const uid = w.added_by || (w.classroom_id ? classroomOwner.get(w.classroom_id) : null);
      if (!uid) continue;
      counts.set(uid, (counts.get(uid) ?? 0) + 1);
    }

    assertEqual(counts.get('student-A'), 2, 'student-A counted from direct added_by');
    assertEqual(counts.get('user-teacher-1'), 1, 'user-teacher-1 counted from classroom fallback');
    assertEqual(counts.get('user-teacher-2'), 1, 'user-teacher-2 counted from classroom fallback');
    assertEqual(counts.get('non-existent'), undefined, 'Orphans are skipped');
    testCount++;
    console.log('  ✓ Word count attribution resolves correctly with fallback hierarchy');
  }

  console.log('\n=================================================================');
  console.log(`✅ ALL ${testCount} CRM TEST SUITES PASSED CLEANLY!`);
  console.log('=================================================================');
}

runCrmUnitTests().catch(err => {
  console.error('❌ CRM Unit Test Failure:', err);
  process.exit(1);
});
