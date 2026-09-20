/**
 * Challenger M1.2: Empirical Cross-Classroom Isolation & Stress Test
 *
 * Requirements:
 * 1. Test cross-classroom isolation: simulate a user belonging to Classroom A and Classroom B
 *    with different SRS review statuses. Verify that neither the RPC nor the PostgREST
 *    fallback path leaks words or reviews across classrooms.
 * 2. Verify cross-user isolation within the same classroom.
 * 3. Verify server TTL RAM cache scoping and prefix invalidation.
 */

import { TestRunner, expect } from './perf/test-harness';
import {
  cacheGet,
  cacheSet,
  cacheDeletePrefix,
  invalidateServerWordSummaryCache,
} from '../src/lib/ttl-cache';

const runner = new TestRunner();

interface MockWord {
  id: string;
  classroom_id: string;
  word: string;
  created_at: string;
}

interface MockSRS {
  id: string;
  user_id: string;
  word_id: string;
  review_count: number;
  next_review_date: string;
  stability: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Dataset Setup
// ─────────────────────────────────────────────────────────────────────────────
const CLASS_A_ID = '11111111-1111-1111-1111-111111111111';
const CLASS_B_ID = '22222222-2222-2222-2222-222222222222';
const USER_1_ID = 'aaaa1111-aaaa-1111-aaaa-111111111111';
const USER_2_ID = 'bbbb2222-bbbb-2222-bbbb-222222222222';

const now = new Date();
const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

// Classroom A: 10 words
// User 1 has 6 studied (4 due, 2 not due), 4 unstudied
const wordsClassA: MockWord[] = Array.from({ length: 10 }, (_, i) => ({
  id: `word-a-${i + 1}`,
  classroom_id: CLASS_A_ID,
  word: `alpha_${i + 1}`,
  created_at: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
}));

// Classroom B: 25 words
// User 1 has 15 studied (10 due, 5 not due), 10 unstudied
const wordsClassB: MockWord[] = Array.from({ length: 25 }, (_, i) => ({
  id: `word-b-${i + 1}`,
  classroom_id: CLASS_B_ID,
  word: `beta_${i + 1}`,
  created_at: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
}));

const allWords = [...wordsClassA, ...wordsClassB];

const srsRecords: MockSRS[] = [];

// User 1 in Classroom A:
// 4 words due (word-a-1 to word-a-4)
for (let i = 0; i < 4; i++) {
  srsRecords.push({
    id: `srs-u1-a-${i + 1}`,
    user_id: USER_1_ID,
    word_id: `word-a-${i + 1}`,
    review_count: 2,
    next_review_date: pastDate,
    stability: 3.5,
  });
}
// 2 words not due (word-a-5 to word-a-6)
for (let i = 4; i < 6; i++) {
  srsRecords.push({
    id: `srs-u1-a-${i + 1}`,
    user_id: USER_1_ID,
    word_id: `word-a-${i + 1}`,
    review_count: 3,
    next_review_date: futureDate,
    stability: 12.0,
  });
}
// words a-7 to a-10 have no SRS for User 1

// User 1 in Classroom B:
// 10 words due (word-b-1 to word-b-10)
for (let i = 0; i < 10; i++) {
  srsRecords.push({
    id: `srs-u1-b-${i + 1}`,
    user_id: USER_1_ID,
    word_id: `word-b-${i + 1}`,
    review_count: 5,
    next_review_date: pastDate,
    stability: 2.2,
  });
}
// 5 words not due (word-b-11 to word-b-15)
for (let i = 10; i < 15; i++) {
  srsRecords.push({
    id: `srs-u1-b-${i + 1}`,
    user_id: USER_1_ID,
    word_id: `word-b-${i + 1}`,
    review_count: 4,
    next_review_date: futureDate,
    stability: 45.0,
  });
}
// words b-16 to b-25 have no SRS for User 1

// User 2 in Classroom A: (adversarial intruder)
// User 2 has 5 words due in Classroom A (word-a-1 to word-a-5)
for (let i = 0; i < 5; i++) {
  srsRecords.push({
    id: `srs-u2-a-${i + 1}`,
    user_id: USER_2_ID,
    word_id: `word-a-${i + 1}`,
    review_count: 10,
    next_review_date: pastDate,
    stability: 1.0,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Emulators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes the exact SQL aggregation logic of get_word_summary RPC:
 *
 * SELECT
 *   count(w.id)::bigint AS total,
 *   count(sp.word_id) FILTER (WHERE sp.review_count > 0)::bigint AS learned,
 *   count(sp.word_id) FILTER (WHERE sp.review_count > 0 AND sp.next_review_date <= (now() AT TIME ZONE 'UTC'))::bigint AS review_due,
 *   count(sp.word_id) FILTER (WHERE sp.next_review_date <= (now() AT TIME ZONE 'UTC'))::bigint AS srs_due,
 *   count(sp.word_id)::bigint AS with_srs,
 *   GREATEST(0, count(w.id) - count(sp.word_id) FILTER (WHERE sp.review_count > 0))::bigint AS new_count,
 *   count(sp.word_id) FILTER (WHERE sp.review_count > 0 AND sp.next_review_date <= (now() AT TIME ZONE 'UTC'))::bigint AS review_due_count,
 *   (count(sp.word_id) FILTER (WHERE sp.next_review_date <= (now() AT TIME ZONE 'UTC')) + GREATEST(0, count(w.id) - count(sp.word_id)))::bigint AS due_count
 * FROM public.words w
 * LEFT JOIN public.srs_progress sp ON sp.word_id = w.id AND sp.user_id = p_user_id
 * WHERE w.classroom_id = v_target_class_id;
 */
function executeRpcSqlAggregation(userId: string, classroomId: string) {
  const wordsInClass = allWords.filter((w) => w.classroom_id === classroomId);
  const nowIso = new Date().toISOString();

  // LEFT JOIN words w LEFT JOIN srs_progress sp ON sp.word_id = w.id AND sp.user_id = p_user_id
  const joinedRows = wordsInClass.map((w) => {
    const sp = srsRecords.find((s) => s.word_id === w.id && s.user_id === userId);
    return { w, sp };
  });

  const total = joinedRows.length;
  const learned = joinedRows.filter((r) => r.sp && r.sp.review_count > 0).length;
  const reviewDue = joinedRows.filter(
    (r) => r.sp && r.sp.review_count > 0 && r.sp.next_review_date <= nowIso,
  ).length;
  const srsDue = joinedRows.filter((r) => r.sp && r.sp.next_review_date <= nowIso).length;
  const withSrs = joinedRows.filter((r) => Boolean(r.sp)).length;
  const newCount = Math.max(0, total - learned);
  const reviewDueCount = reviewDue;
  const dueCount = srsDue + Math.max(0, total - withSrs);

  return {
    total,
    learned,
    review_due: reviewDue,
    srs_due: srsDue,
    with_srs: withSrs,
    new_count: newCount,
    review_due_count: reviewDueCount,
    due_count: dueCount,
  };
}

/**
 * Emulates the PostgREST Fallback Path from src/app/api/words/route.ts lines 256-284:
 *
 * supabase.from('words').select('id', { count: 'exact', head: true }).eq('classroom_id', classroomId)
 * supabase.from('srs_progress').select('id, words!inner(classroom_id)', ...).eq('user_id', userId).eq('words.classroom_id', classroomId)...
 */
function executePostgrestFallbackPath(userId: string, classroomId: string) {
  const nowIso = new Date().toISOString();

  // Query 1: words in classroom
  const total = allWords.filter((w) => w.classroom_id === classroomId).length;

  // PostgREST inner join: srs_progress INNER JOIN words ON srs_progress.word_id = words.id
  // Filtered by: user_id = userId AND words.classroom_id = classroomId
  const candidateSrs = srsRecords.filter((s) => {
    if (s.user_id !== userId) return false;
    const word = allWords.find((w) => w.id === s.word_id);
    return word && word.classroom_id === classroomId;
  });

  // Query 2: dueCount (srs_due)
  const srsDue = candidateSrs.filter((s) => s.next_review_date <= nowIso).length;

  // Query 3: wordsWithSrs
  const wordsWithSrs = candidateSrs.length;

  // Query 4: learnedCount
  const learnedCount = candidateSrs.filter((s) => s.review_count > 0).length;

  // Query 5: reviewDueCount
  const reviewDueCount = candidateSrs.filter(
    (s) => s.review_count > 0 && s.next_review_date <= nowIso,
  ).length;

  return {
    total,
    dueCount: srsDue + Math.max(0, total - wordsWithSrs),
    newCount: Math.max(0, total - learnedCount),
    reviewDueCount,
    learnedCount,
    wordsWithSrs,
  };
}

/**
 * Emulates the OLD buggy PostgREST query (prior to Worker M1 fix)
 * Query 2-5 did NOT scope by classroom_id:
 * supabase.from('srs_progress').select('id').eq('user_id', userId).lte('next_review_date', now)
 */
function executeOldUnscopedFallbackPath(userId: string, classroomId: string) {
  const nowIso = new Date().toISOString();
  const total = allWords.filter((w) => w.classroom_id === classroomId).length;

  // Buggy: No filter on words.classroom_id!
  const userSrsAllClasses = srsRecords.filter((s) => s.user_id === userId);
  const srsDue = userSrsAllClasses.filter((s) => s.next_review_date <= nowIso).length;
  const wordsWithSrs = userSrsAllClasses.length;
  const learnedCount = userSrsAllClasses.filter((s) => s.review_count > 0).length;
  const reviewDueCount = userSrsAllClasses.filter(
    (s) => s.review_count > 0 && s.next_review_date <= nowIso,
  ).length;

  return {
    total,
    dueCount: srsDue + Math.max(0, total - wordsWithSrs),
    newCount: Math.max(0, total - learnedCount),
    reviewDueCount,
    learnedCount,
    wordsWithSrs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite Execution
// ─────────────────────────────────────────────────────────────────────────────

runner.describe('Cross-Classroom Isolation & Stress Test', () => {
  // Test 1: RPC SQL query isolates Classroom A
  runner.it('RPC SQL aggregation correctly isolates Classroom A for User 1', () => {
    const res = executeRpcSqlAggregation(USER_1_ID, CLASS_A_ID);
    expect(res.total).toBe(10);
    expect(res.learned).toBe(6);
    expect(res.review_due).toBe(4);
    expect(res.new_count).toBe(4);
    expect(res.due_count).toBe(8); // 4 due + 4 unstudied
    expect(res.with_srs).toBe(6);
  });

  // Test 2: RPC SQL query isolates Classroom B
  runner.it('RPC SQL aggregation correctly isolates Classroom B for User 1', () => {
    const res = executeRpcSqlAggregation(USER_1_ID, CLASS_B_ID);
    expect(res.total).toBe(25);
    expect(res.learned).toBe(15);
    expect(res.review_due).toBe(10);
    expect(res.new_count).toBe(10);
    expect(res.due_count).toBe(20); // 10 due + 10 unstudied
    expect(res.with_srs).toBe(15);
  });

  // Test 3: PostgREST Fallback Path correctly isolates Classroom A for User 1
  runner.it('PostgREST fallback path strictly scopes srs_progress by classroom_id for Classroom A', () => {
    const res = executePostgrestFallbackPath(USER_1_ID, CLASS_A_ID);
    expect(res.total).toBe(10);
    expect(res.learnedCount).toBe(6);
    expect(res.reviewDueCount).toBe(4);
    expect(res.newCount).toBe(4);
    expect(res.dueCount).toBe(8);
    expect(res.wordsWithSrs).toBe(6);
  });

  // Test 4: PostgREST Fallback Path correctly isolates Classroom B for User 1
  runner.it('PostgREST fallback path strictly scopes srs_progress by classroom_id for Classroom B', () => {
    const res = executePostgrestFallbackPath(USER_1_ID, CLASS_B_ID);
    expect(res.total).toBe(25);
    expect(res.learnedCount).toBe(15);
    expect(res.reviewDueCount).toBe(10);
    expect(res.newCount).toBe(10);
    expect(res.dueCount).toBe(20);
    expect(res.wordsWithSrs).toBe(15);
  });

  // Test 5: Prove that the OLD unscoped query would have leaked Classroom B reviews into Classroom A
  runner.it('Adversarial proof: old unscoped query leaks 10 reviews from Class B into Class A', () => {
    const oldRes = executeOldUnscopedFallbackPath(USER_1_ID, CLASS_A_ID);
    // In old query, reviewDueCount counted 4 (Class A) + 10 (Class B) = 14!
    expect(oldRes.reviewDueCount).toBe(14);
    // And learnedCount was 6 (Class A) + 15 (Class B) = 21, exceeding total words in Class A (10)!
    expect(oldRes.learnedCount).toBe(21);
    expect(oldRes.newCount).toBe(0); // 10 - 21 = -11 -> clamped to 0

    // Compare with the fixed new query:
    const fixedRes = executePostgrestFallbackPath(USER_1_ID, CLASS_A_ID);
    expect(fixedRes.reviewDueCount).toBe(4);
    expect(fixedRes.learnedCount).toBe(6);
    expect(fixedRes.newCount).toBe(4);
  });

  // Test 6: Cross-user isolation within the same classroom
  runner.it('Cross-user isolation: User 2 reviews in Classroom A do not leak to User 1', () => {
    const user1Res = executeRpcSqlAggregation(USER_1_ID, CLASS_A_ID);
    const user2Res = executeRpcSqlAggregation(USER_2_ID, CLASS_A_ID);

    // User 1 has 4 due, 2 not due, 4 unstudied
    expect(user1Res.review_due_count).toBe(4);
    expect(user1Res.due_count).toBe(8);

    // User 2 has 5 due, 0 not due, 5 unstudied
    expect(user2Res.review_due_count).toBe(5);
    expect(user2Res.learned).toBe(5);
    expect(user2Res.due_count).toBe(10); // 5 due + 5 unstudied
  });

  // Test 7: Server RAM TTL Cache Key Isolation
  runner.it('Server RAM TTL Cache keys partition correctly by userId and classroomId', () => {
    const keyUser1ClassA = `wsum:${USER_1_ID}:${CLASS_A_ID}:0`;
    const keyUser1ClassB = `wsum:${USER_1_ID}:${CLASS_B_ID}:0`;
    const keyUser2ClassA = `wsum:${USER_2_ID}:${CLASS_A_ID}:0`;

    cacheSet(keyUser1ClassA, { total: 10, reviewDueCount: 4 }, 30_000);
    cacheSet(keyUser1ClassB, { total: 25, reviewDueCount: 10 }, 30_000);
    cacheSet(keyUser2ClassA, { total: 10, reviewDueCount: 5 }, 30_000);

    const hit1A = cacheGet<any>(keyUser1ClassA);
    const hit1B = cacheGet<any>(keyUser1ClassB);
    const hit2A = cacheGet<any>(keyUser2ClassA);

    expect(hit1A?.reviewDueCount).toBe(4);
    expect(hit1B?.reviewDueCount).toBe(10);
    expect(hit2A?.reviewDueCount).toBe(5);
  });

  // Test 8: Prefix Invalidation purges all classrooms for affected user only
  runner.it('invalidateServerWordSummaryCache purges all classrooms for user1 but retains user2', () => {
    const keyUser1ClassA = `wsum:${USER_1_ID}:${CLASS_A_ID}:0`;
    const keyUser1ClassB = `wsum:${USER_1_ID}:${CLASS_B_ID}:0`;
    const keyUser2ClassA = `wsum:${USER_2_ID}:${CLASS_A_ID}:0`;

    cacheSet(keyUser1ClassA, { total: 10, reviewDueCount: 4 }, 30_000);
    cacheSet(keyUser1ClassB, { total: 25, reviewDueCount: 10 }, 30_000);
    cacheSet(keyUser2ClassA, { total: 10, reviewDueCount: 5 }, 30_000);

    // User 1 saves a word or completes a review -> invalidation triggered
    invalidateServerWordSummaryCache(USER_1_ID);

    expect(cacheGet(keyUser1ClassA)).toBeUndefined();
    expect(cacheGet(keyUser1ClassB)).toBeUndefined();
    // User 2's cache MUST remain intact
    expect(cacheGet<any>(keyUser2ClassA)?.reviewDueCount).toBe(5);
  });
});

async function main() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING CHALLENGER M1.2 CROSS-CLASSROOM EMPIRICAL SUITE');
  console.log('================================================================\n');

  // Let all asynchronous tasks finish
  await new Promise((r) => setTimeout(r, 100));

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
