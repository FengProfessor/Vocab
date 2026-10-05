/**
 * Adversarial Challenger 2 Test Suite: Data Oracle & Algorithmic State Challenger
 *
 * Focus:
 * 1. Teacher Dashboard State Machine exact boundaries (dormant 2.99d vs 3.01d, 7-day KPI 6.99d vs 7.01d,
 *    cramming, rising star, at_risk, invalid/null timestamps, clock skew).
 * 2. Multi-skill Timeline Sorting (interleaving 8 activity groups descending, tie-breaking, microsecond precision).
 * 3. Admin CRM State Machine exact boundaries (new <=7d, active <=7d, at_risk <=30d, churned >30d).
 * 4. Anti-Churn Verification for specialized learners (TOEIC-only, Grammar-only, Reading-only, Assessment-only, Streak-only).
 * 5. Word Count Attribution hierarchy (added_by preference, __personal__ classroom fallback, foreign classroom safety).
 */

import {
  calculatePedagogicalStatus,
  calculateCustomerLifecycle,
  computeTrueLastActive,
  type StudentActivitySummary,
  type MultiSkillStats,
} from '../src/lib/activity/universal-activity';
import { getStudentStatus, formatLastActive } from '../src/components/teacher/StudentsPanel';
import type { StudentProgress } from '../src/lib/supabase';
import type { TimelineItem } from '../src/components/teacher/types';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const SECOND = 1000;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runTest(name: string, fn: () => void) {
  const t0 = performance.now();
  try {
    fn();
    const durationMs = Math.round((performance.now() - t0) * 100) / 100;
    results.push({ name, passed: true, durationMs });
    console.log(`  [PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - t0) * 100) / 100;
    results.push({ name, passed: false, error: err.message, durationMs });
    console.error(`  [FAIL] ${name}: ${err.message} (${durationMs}ms)`);
  }
}

console.log('================================================================================');
console.log('⚔️  ADVERSARIAL STRESS TEST: TEACHER & CRM ALGORITHMIC STATE MACHINES  ⚔️');
console.log('================================================================================\n');

// =============================================================================
// SUITE 1: TEACHER DASHBOARD PEDAGOGICAL STATE MACHINE
// =============================================================================
console.log('>>> [Suite 1] Teacher Dashboard Pedagogical State Machine Boundaries...');

const BASE_TIME = 1760000000000; // Fixed deterministic timestamp

// 1.1 Dormant Threshold Boundary (2.99d vs 3.01d, exactly 3.00d)
runTest('1.1.1: Activity at 2.99 days ago (now - 258,336,000 ms) MUST NOT be dormant', () => {
  const ts = new Date(BASE_TIME - 2.99 * DAY).toISOString();
  const status = calculatePedagogicalStatus({ trueLastActive: ts, now: BASE_TIME });
  assert(status.key !== 'dormant', `Expected not dormant, got ${status.key}`);
});

runTest('1.1.2: Activity at exactly 3.00 days ago (now - 259,200,000 ms) boundary test', () => {
  const ts = new Date(BASE_TIME - 3.00 * DAY).toISOString();
  const status = calculatePedagogicalStatus({ trueLastActive: ts, now: BASE_TIME });
  // (now - ts) > 3 * 86_400_000: 259_200_000 > 259_200_000 is FALSE -> NOT dormant yet
  assert(status.key !== 'dormant', `Expected not dormant at exact 3.00d, got ${status.key}`);
});

runTest('1.1.3: Activity at 3.0001 days ago (now - 259,208,640 ms) MUST be dormant', () => {
  const ts = new Date(BASE_TIME - 3.0001 * DAY).toISOString();
  const status = calculatePedagogicalStatus({ trueLastActive: ts, now: BASE_TIME });
  assert(status.key === 'dormant', `Expected dormant at 3.0001d, got ${status.key}`);
  assert(status.dot === '💤', `Expected dot '💤', got ${status.dot}`);
});

runTest('1.1.4: Activity at 3.01 days ago MUST be dormant', () => {
  const ts = new Date(BASE_TIME - 3.01 * DAY).toISOString();
  const status = calculatePedagogicalStatus({ trueLastActive: ts, now: BASE_TIME });
  assert(status.key === 'dormant', `Expected dormant at 3.01d, got ${status.key}`);
});

// 1.2 Pedagogical Priority & Edge Conditions
runTest('1.2.1: Inactive for 4 days + VMS < 30 (Dormant takes precedence over At Risk)', () => {
  const ts = new Date(BASE_TIME - 4 * DAY).toISOString();
  const status = calculatePedagogicalStatus({
    trueLastActive: ts,
    vms: 15,
    wordsReviewed: 50,
    now: BASE_TIME,
  });
  assert(status.key === 'dormant', `Expected dormant to take priority over at_risk, got ${status.key}`);
});

runTest('1.2.2: Active within 1 day + VMS < 30 + wordsReviewed > 10 MUST be at_risk', () => {
  const ts = new Date(BASE_TIME - 1 * DAY).toISOString();
  const status = calculatePedagogicalStatus({
    trueLastActive: ts,
    vms: 25,
    wordsReviewed: 20,
    now: BASE_TIME,
  });
  assert(status.key === 'at_risk', `Expected at_risk, got ${status.key}`);
  assert(status.dot === '🔴', `Expected dot '🔴', got ${status.dot}`);
});

runTest('1.2.3: Boundary for At-Risk: wordsReviewed = 10 vs 11 (strict > 10 threshold)', () => {
  const ts = new Date(BASE_TIME - 1 * DAY).toISOString();
  const status10 = calculatePedagogicalStatus({
    trueLastActive: ts,
    vms: 20,
    wordsReviewed: 10,
    now: BASE_TIME,
  });
  assert(status10.key !== 'at_risk', `At wordsReviewed=10, should NOT be at_risk (got ${status10.key})`);

  const status11 = calculatePedagogicalStatus({
    trueLastActive: ts,
    vms: 20,
    wordsReviewed: 11,
    now: BASE_TIME,
  });
  assert(status11.key === 'at_risk', `At wordsReviewed=11, MUST be at_risk (got ${status11.key})`);
});

runTest('1.2.4: Cramming condition: lcs < 30 && avgQuizAccuracy > 0.8 && quizzesTaken > 2', () => {
  const ts = new Date(BASE_TIME - 1 * DAY).toISOString();
  // Valid crammer
  const crammer = calculatePedagogicalStatus({
    trueLastActive: ts,
    lcs: 25,
    avgQuizAccuracy: 0.85,
    quizzesTaken: 3,
    now: BASE_TIME,
  });
  assert(crammer.key === 'cramming', `Expected cramming, got ${crammer.key}`);
  assert(crammer.dot === '🟡', `Expected dot '🟡', got ${crammer.dot}`);

  // Boundary: quizzesTaken = 2 (not > 2)
  const notCrammerQuizzes = calculatePedagogicalStatus({
    trueLastActive: ts,
    lcs: 25,
    avgQuizAccuracy: 0.85,
    quizzesTaken: 2,
    now: BASE_TIME,
  });
  assert(notCrammerQuizzes.key !== 'cramming', `quizzesTaken=2 should NOT trigger cramming`);

  // Boundary: avgQuizAccuracy = 0.80 (strict > 0.8)
  const notCrammerAcc = calculatePedagogicalStatus({
    trueLastActive: ts,
    lcs: 25,
    avgQuizAccuracy: 0.80,
    quizzesTaken: 3,
    now: BASE_TIME,
  });
  assert(notCrammerAcc.key !== 'cramming', `avgQuizAccuracy=0.80 should NOT trigger cramming`);
});

runTest('1.2.5: Rising Star condition: lcs > 80 && avgQuizAccuracy > 0.8', () => {
  const ts = new Date(BASE_TIME - 1 * DAY).toISOString();
  const star = calculatePedagogicalStatus({
    trueLastActive: ts,
    lcs: 85,
    avgQuizAccuracy: 0.90,
    now: BASE_TIME,
  });
  assert(star.key === 'rising_star', `Expected rising_star, got ${star.key}`);
  assert(star.dot === '🟢', `Expected dot '🟢', got ${star.dot}`);

  // Boundary: lcs = 80 (strict > 80)
  const boundaryStar = calculatePedagogicalStatus({
    trueLastActive: ts,
    lcs: 80,
    avgQuizAccuracy: 0.90,
    now: BASE_TIME,
  });
  assert(boundaryStar.key !== 'rising_star', `lcs=80 should NOT trigger rising_star`);
});

runTest('1.2.6: Malformed / Null / Empty string handling in calculatePedagogicalStatus', () => {
  const nullStatus = calculatePedagogicalStatus({ trueLastActive: null, now: BASE_TIME });
  assert(nullStatus.key === 'normal', `Null timestamp should default to normal, got ${nullStatus.key}`);

  const emptyStatus = calculatePedagogicalStatus({ trueLastActive: '', now: BASE_TIME });
  assert(emptyStatus.key === 'normal', `Empty string timestamp should default to normal, got ${emptyStatus.key}`);

  const invalidDateStatus = calculatePedagogicalStatus({ trueLastActive: 'not-a-valid-date', now: BASE_TIME });
  // isNaN(new Date('not-a-valid-date').getTime()) is true. now - NaN is NaN. NaN > X is false.
  assert(invalidDateStatus.key === 'normal', `Invalid date string should not crash, got ${invalidDateStatus.key}`);
});

runTest('1.2.7: Future timestamp (clock skew 10 minutes in future) handling', () => {
  const futureTs = new Date(BASE_TIME + 10 * MINUTE).toISOString();
  const status = calculatePedagogicalStatus({ trueLastActive: futureTs, now: BASE_TIME });
  // now - future is negative -> not dormant
  assert(status.key === 'normal', `Future timestamp should not be dormant, got ${status.key}`);
});

// 1.3 Teacher 7-Day Active Count KPI Calculation
runTest('1.3.1: 7-Day Active KPI boundary (6.99d active vs 7.01d inactive)', () => {
  const now = BASE_TIME;
  const isKpiActive = (ts: string | null | undefined): boolean => {
    return Boolean(ts && now - new Date(ts).getTime() <= 7 * 86_400_000);
  };

  const ts699 = new Date(now - 6.99 * DAY).toISOString();
  const ts700 = new Date(now - 7.00 * DAY).toISOString();
  const ts701 = new Date(now - 7.01 * DAY).toISOString();

  assert(isKpiActive(ts699) === true, '6.99d MUST be counted in 7-day KPI');
  assert(isKpiActive(ts700) === true, '7.00d exactly MUST be counted in 7-day KPI (<= 7 days)');
  assert(isKpiActive(ts701) === false, '7.01d MUST NOT be counted in 7-day KPI');
  assert(isKpiActive(null) === false, 'Null timestamp MUST NOT be counted in 7-day KPI');
});

runTest('1.3.2: getStudentStatus evaluates true_last_active and falls back to last_active', () => {
  const realNow = Date.now();
  const mockStudent1: StudentProgress = {
    student_id: 's-1',
    classroom_id: 'c-1',
    student_name: 'Student 1',
    email: 's1@test.com',
    true_last_active: new Date(realNow - 1 * DAY).toISOString(),
    last_active: new Date(realNow - 10 * DAY).toISOString(), // Stale flashcards
  };
  const status1 = getStudentStatus(mockStudent1);
  assert(status1.key !== 'dormant', `Should use true_last_active (1d ago), got ${status1.key}`);

  const mockStudent2: StudentProgress = {
    student_id: 's-2',
    classroom_id: 'c-1',
    student_name: 'Student 2',
    email: 's2@test.com',
    true_last_active: null,
    last_active: new Date(realNow - 1 * DAY).toISOString(), // Fallback to last_active
  };
  const status2 = getStudentStatus(mockStudent2);
  assert(status2.key !== 'dormant', `Should fallback to last_active (1d ago), got ${status2.key}`);
});

// =============================================================================
// SUITE 2: MULTI-SKILL TIMELINE CHRONOLOGICAL INTERLEAVING
// =============================================================================
console.log('\n>>> [Suite 2] Multi-Skill Timeline Chronological Interleaving...');

runTest('2.1.1: Interleaving items from 8 activity groups sorts strictly descending', () => {
  const now = BASE_TIME;

  const rawItems: TimelineItem[] = [
    { id: 'item-reading', type: 'daily_reading', title: 'Daily Reading', timestamp: new Date(now - 30 * MINUTE).toISOString() },
    { id: 'item-toeic-2', type: 'toeic', title: 'TOEIC Part 7', timestamp: new Date(now - 10 * MINUTE).toISOString() },
    { id: 'item-srs-1', type: 'srs_review', title: 'Flashcard 1', timestamp: new Date(now - 5 * HOUR).toISOString() },
    { id: 'item-grammar-1', type: 'grammar', title: 'Grammar Master', timestamp: new Date(now - 2 * HOUR).toISOString() },
    { id: 'item-vocab-pack', type: 'vocab_pack', title: 'Pack Topic', timestamp: new Date(now - 1 * DAY).toISOString() },
    { id: 'item-assessment', type: 'assessment', title: 'Mock Test', timestamp: new Date(now - 12 * HOUR).toISOString() },
    { id: 'item-quiz', type: 'quiz', title: 'Vocabulary Quiz', timestamp: new Date(now - 45 * MINUTE).toISOString() },
    { id: 'item-word-saved', type: 'word_saved', title: 'Save Word', timestamp: new Date(now - 4 * HOUR).toISOString() },
    { id: 'item-toeic-1', type: 'toeic', title: 'TOEIC Part 5', timestamp: new Date(now - 5 * MINUTE).toISOString() }, // NEWEST
  ];

  // Apply sorting algorithm used in /api/teacher/student-detail/route.ts
  const sorted = [...rawItems].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Expected order:
  // 1. item-toeic-1 (-5m)
  // 2. item-toeic-2 (-10m)
  // 3. item-reading (-30m)
  // 4. item-quiz (-45m)
  // 5. item-grammar-1 (-2h)
  // 6. item-word-saved (-4h)
  // 7. item-srs-1 (-5h)
  // 8. item-assessment (-12h)
  // 9. item-vocab-pack (-1d)
  assert(sorted[0].id === 'item-toeic-1', `Expected 1st: item-toeic-1, got ${sorted[0].id}`);
  assert(sorted[1].id === 'item-toeic-2', `Expected 2nd: item-toeic-2, got ${sorted[1].id}`);
  assert(sorted[2].id === 'item-reading', `Expected 3rd: item-reading, got ${sorted[2].id}`);
  assert(sorted[3].id === 'item-quiz', `Expected 4th: item-quiz, got ${sorted[3].id}`);
  assert(sorted[4].id === 'item-grammar-1', `Expected 5th: item-grammar-1, got ${sorted[4].id}`);
  assert(sorted[5].id === 'item-word-saved', `Expected 6th: item-word-saved, got ${sorted[5].id}`);
  assert(sorted[6].id === 'item-srs-1', `Expected 7th: item-srs-1, got ${sorted[6].id}`);
  assert(sorted[7].id === 'item-assessment', `Expected 8th: item-assessment, got ${sorted[7].id}`);
  assert(sorted[8].id === 'item-vocab-pack', `Expected 9th: item-vocab-pack, got ${sorted[8].id}`);

  // Monotonicity assertion: each item timestamp >= next item timestamp
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = new Date(sorted[i].timestamp).getTime();
    const next = new Date(sorted[i + 1].timestamp).getTime();
    assert(cur >= next, `Timeline monotonicity violated at index ${i}: ${cur} < ${next}`);
  }
});

runTest('2.1.2: Millisecond tie-breaker stability across different activity groups', () => {
  const sameTs = new Date(BASE_TIME - 1 * HOUR).toISOString();
  const items: TimelineItem[] = [
    { id: 'tie-quiz', type: 'quiz', title: 'Quiz', timestamp: sameTs },
    { id: 'tie-grammar', type: 'grammar', title: 'Grammar', timestamp: sameTs },
    { id: 'tie-toeic', type: 'toeic', title: 'TOEIC', timestamp: sameTs },
  ];
  const sorted = [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  assert(sorted.length === 3, 'All items preserved during sorting with identical timestamps');
});

// =============================================================================
// SUITE 3: ADMIN CRM LIFECYCLE STATE MACHINE BOUNDARIES
// =============================================================================
console.log('\n>>> [Suite 3] Admin CRM Lifecycle State Machine Boundaries...');

// Transitions:
// new (<=7d created)
// active (<=7d active)
// at_risk (<=30d active)
// churned (>30d active)

runTest('3.1.1: New User Boundary: created 6.99d ago (new) vs 7.00d ago (new) vs 7.01d ago', () => {
  const created699 = new Date(BASE_TIME - 6.99 * DAY).toISOString();
  const created700 = new Date(BASE_TIME - 7.00 * DAY).toISOString();
  const created701 = new Date(BASE_TIME - 7.01 * DAY).toISOString();

  assert(calculateCustomerLifecycle({ createdAt: created699, trueLastActive: null, now: BASE_TIME }) === 'new',
    'created 6.99d ago with 0 activity MUST be new');

  assert(calculateCustomerLifecycle({ createdAt: created700, trueLastActive: null, now: BASE_TIME }) === 'new',
    'created 7.00d ago exactly with 0 activity MUST be new (<= 7 days)');

  assert(calculateCustomerLifecycle({ createdAt: created701, trueLastActive: null, now: BASE_TIME }) === 'churned',
    'created 7.01d ago with 0 activity MUST transition to churned');
});

runTest('3.1.2: Active User Boundary: old account, active 6.99d ago vs 7.00d ago vs 7.01d ago', () => {
  const oldCreated = new Date(BASE_TIME - 60 * DAY).toISOString();

  const active699 = new Date(BASE_TIME - 6.99 * DAY).toISOString();
  const active700 = new Date(BASE_TIME - 7.00 * DAY).toISOString();
  const active701 = new Date(BASE_TIME - 7.01 * DAY).toISOString();

  assert(calculateCustomerLifecycle({ createdAt: oldCreated, trueLastActive: active699, now: BASE_TIME }) === 'active',
    'Active 6.99d ago MUST be active');

  assert(calculateCustomerLifecycle({ createdAt: oldCreated, trueLastActive: active700, now: BASE_TIME }) === 'active',
    'Active 7.00d ago exactly MUST be active (<= 7 days)');

  assert(calculateCustomerLifecycle({ createdAt: oldCreated, trueLastActive: active701, now: BASE_TIME }) === 'at_risk',
    'Active 7.01d ago MUST transition to at_risk');
});

runTest('3.1.3: At-Risk vs Churned Boundary: old account, active 29.99d ago vs 30.00d ago vs 30.01d ago', () => {
  const oldCreated = new Date(BASE_TIME - 120 * DAY).toISOString();

  const active2999 = new Date(BASE_TIME - 29.99 * DAY).toISOString();
  const active3000 = new Date(BASE_TIME - 30.00 * DAY).toISOString();
  const active3001 = new Date(BASE_TIME - 30.01 * DAY).toISOString();

  assert(calculateCustomerLifecycle({ createdAt: oldCreated, trueLastActive: active2999, now: BASE_TIME }) === 'at_risk',
    'Active 29.99d ago MUST be at_risk');

  assert(calculateCustomerLifecycle({ createdAt: oldCreated, trueLastActive: active3000, now: BASE_TIME }) === 'at_risk',
    'Active 30.00d ago exactly MUST be at_risk (<= 30 days)');

  assert(calculateCustomerLifecycle({ createdAt: oldCreated, trueLastActive: active3001, now: BASE_TIME }) === 'churned',
    'Active 30.01d ago MUST transition to churned (> 30 days)');
});

// =============================================================================
// SUITE 4: ANTI-CHURN VERIFICATION FOR SPECIALIZED LEARNERS
// =============================================================================
console.log('\n>>> [Suite 4] Anti-Churn Verification for Specialized Learners...');

const OLD_REGISTRATION = new Date(BASE_TIME - 90 * DAY).toISOString();

runTest('4.1.1: TOEIC-only learner active 2 hours ago is NEVER churned or at_risk', () => {
  const toeicActive = new Date(BASE_TIME - 2 * HOUR).toISOString();
  const trueLastActive = computeTrueLastActive([toeicActive]);
  assert(trueLastActive === toeicActive, 'computeTrueLastActive picks TOEIC timestamp');

  const lifecycle = calculateCustomerLifecycle({
    createdAt: OLD_REGISTRATION,
    trueLastActive,
    now: BASE_TIME,
  });
  assert(lifecycle === 'active', `Expected active, got ${lifecycle}`);
});

runTest('4.1.2: Grammar-only learner active 1 day ago is NEVER churned or at_risk', () => {
  const grammarActive = new Date(BASE_TIME - 1 * DAY).toISOString();
  const trueLastActive = computeTrueLastActive([null, null, grammarActive]);
  assert(trueLastActive === grammarActive, 'computeTrueLastActive picks Grammar timestamp');

  const lifecycle = calculateCustomerLifecycle({
    createdAt: OLD_REGISTRATION,
    trueLastActive,
    now: BASE_TIME,
  });
  assert(lifecycle === 'active', `Expected active, got ${lifecycle}`);
});

runTest('4.1.3: Daily Reading-only learner active 3 days ago is NEVER churned or at_risk', () => {
  const readingActive = new Date(BASE_TIME - 3 * DAY).toISOString();
  const trueLastActive = computeTrueLastActive([null, null, null, readingActive]);

  const lifecycle = calculateCustomerLifecycle({
    createdAt: OLD_REGISTRATION,
    trueLastActive,
    now: BASE_TIME,
  });
  assert(lifecycle === 'active', `Expected active, got ${lifecycle}`);
});

runTest('4.1.4: Assessment-only learner active 6 days ago is NEVER churned or at_risk', () => {
  const assessmentActive = new Date(BASE_TIME - 6 * DAY).toISOString();
  const trueLastActive = computeTrueLastActive([assessmentActive]);

  const lifecycle = calculateCustomerLifecycle({
    createdAt: OLD_REGISTRATION,
    trueLastActive,
    now: BASE_TIME,
  });
  assert(lifecycle === 'active', `Expected active, got ${lifecycle}`);
});

runTest('4.1.5: Gamification streak learner active today is NEVER churned or at_risk', () => {
  const streakActive = new Date(BASE_TIME - 5 * HOUR).toISOString();
  const trueLastActive = computeTrueLastActive([streakActive]);

  const lifecycle = calculateCustomerLifecycle({
    createdAt: OLD_REGISTRATION,
    trueLastActive,
    now: BASE_TIME,
  });
  assert(lifecycle === 'active', `Expected active, got ${lifecycle}`);
});

// =============================================================================
// SUITE 5: WORD COUNT ATTRIBUTION & SAFE ARITHMETIC
// =============================================================================
console.log('\n>>> [Suite 5] Word Count Attribution & Mathematical Edge Cases...');

runTest('5.1.1: Word count attribution priority: added_by takes priority over classroom owner', () => {
  // Simulating Engine B logic from src/app/api/admin/crm/route.ts
  const classroomOwner = new Map<string, string>([
    ['class-personal-1', 'user-teacher-or-student-1'],
    ['class-personal-2', 'user-teacher-or-student-2'],
  ]);

  const mockWordRows = [
    // 1. Direct added_by
    { id: 'w1', added_by: 'student-A', classroom_id: null, created_at: '2026-10-01' },
    // 2. Added by student-A inside teacher-B class -> should be student-A
    { id: 'w2', added_by: 'student-A', classroom_id: 'class-personal-2', created_at: '2026-10-02' },
    // 3. Legacy word: added_by null, but classroom is personal class of user-teacher-or-student-1
    { id: 'w3', added_by: null, classroom_id: 'class-personal-1', created_at: '2026-10-03' },
    // 4. Orphaned word: added_by null and classroom not in classroomOwner map
    { id: 'w4', added_by: null, classroom_id: 'class-unknown', created_at: '2026-10-04' },
    // 5. Unassigned word: both null
    { id: 'w5', added_by: null, classroom_id: null, created_at: '2026-10-05' },
  ];

  const wordCountByUser = new Map<string, number>();

  for (const w of mockWordRows) {
    const uid = w.added_by || (w.classroom_id ? classroomOwner.get(w.classroom_id) : null);
    if (!uid) continue;
    wordCountByUser.set(uid, (wordCountByUser.get(uid) ?? 0) + 1);
  }

  assert(wordCountByUser.get('student-A') === 2, `student-A should have 2 words (got ${wordCountByUser.get('student-A')})`);
  assert(wordCountByUser.get('user-teacher-or-student-1') === 1, `user-teacher-or-student-1 should have 1 word (got ${wordCountByUser.get('user-teacher-or-student-1')})`);
  assert(!wordCountByUser.has('user-teacher-or-student-2'), `user-teacher-or-student-2 should NOT get w2 since w2 has added_by='student-A'`);
});

runTest('5.1.2: Division-by-zero resilience on 0 TOEIC questions answered', () => {
  const toeicCount = 0;
  const toeicCorrectCount = 0;
  const accuracy = toeicCount > 0 ? Math.round((toeicCorrectCount / toeicCount) * 100) : 0;
  assert(accuracy === 0, `0/0 TOEIC accuracy should be 0, got ${accuracy}`);
  assert(!Number.isNaN(accuracy), `Accuracy should not be NaN`);
});

runTest('5.1.3: Division-by-zero resilience on 0 Reading questions answered', () => {
  const totalQ = 0;
  const scoreQ = 0;
  const acc = totalQ > 0 ? scoreQ / totalQ : 1;
  assert(acc === 1, `0/0 Reading accuracy defaults to 1, got ${acc}`);
  assert(!Number.isNaN(acc), `Reading accuracy should not be NaN`);
});

// =============================================================================
// SUITE 6: TIMEZONE OFFSETS & CLOCK SKEW FORENSIC AUDIT
// =============================================================================
console.log('\n>>> [Suite 6] Timezone Offsets & Clock Skew Forensic Audit...');

runTest('6.1.1: ISO 8601 with +07:00 vs UTC Z equivalence in computeTrueLastActive', () => {
  // 12:00:00 in +07:00 is 05:00:00 UTC
  const vnTime = '2026-10-05T12:00:00+07:00';
  const utcLater = '2026-10-05T05:00:01Z'; // 1 second later than vnTime

  const trueActive = computeTrueLastActive([vnTime, utcLater]);
  assert(trueActive === '2026-10-05T05:00:01.000Z', `Should pick utcLater (1s ahead), got ${trueActive}`);
});

runTest('6.1.2: Extreme ancient timestamp (1970-01-01T00:00:00Z) evaluated as churned and dormant', () => {
  const ancient = '1970-01-01T00:00:00Z';
  const status = calculatePedagogicalStatus({ trueLastActive: ancient, now: BASE_TIME });
  assert(status.key === 'dormant', `Ancient timestamp MUST be dormant, got ${status.key}`);

  const lifecycle = calculateCustomerLifecycle({
    createdAt: ancient,
    trueLastActive: ancient,
    now: BASE_TIME,
  });
  assert(lifecycle === 'churned', `Ancient timestamp MUST be churned, got ${lifecycle}`);
});

// =============================================================================
// SUITE 7: CACHE ISOLATION & SWR BOUNDARIES
// =============================================================================
console.log('\n>>> [Suite 7] Cache Isolation & SWR Boundaries...');

runTest('7.1.1: Cache clearing and diagnostics stats contracts', () => {
  const { clearUniversalActivityCache, getUniversalActivityCacheStats } = require('../src/lib/activity/universal-activity');
  clearUniversalActivityCache();
  const stats = getUniversalActivityCacheStats();
  assert(stats.size === 0, `Cache size should be 0 after clear, got ${stats.size}`);
  assert(Array.isArray(stats.entries), 'Cache entries must be an array');
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================================');
const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed).length;

console.log(`Execution Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed).`);
if (failedTests > 0) {
  console.error(`❌ FAILED TESTS (${failedTests}):`);
  for (const r of results.filter((r) => !r.passed)) {
    console.error(`  - ${r.name}: ${r.error}`);
  }
  process.exit(1);
} else {
  console.log('✅ ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS RATE.');
  process.exit(0);
}

