/**
 * Challenger 2: Adversarial Stress Test Suite for Milestone M3.1
 * Migration: supabase/migrations/20260927_cross_classroom_due_words_and_tz.sql
 *
 * Covers:
 * - Case 1: Unenrolled student data leakage & user_classes isolation
 * - Case 2: 1000-user scalability, grouping & NULL/duplicate handling in push_actual_due_counts
 * - Case 3: Boundary values of next_review_date (exact equal, 1ms before, 1ms after) & timezone comparison
 * - Case 4: Static SQL contract, security definitions & syntax validity
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, expect } from './perf/test-harness';

const runner = new TestRunner();

// ============================================================================
// Relational Models (exact mirrors of PostgreSQL schema)
// ============================================================================

interface Classroom {
  id: string;
  name: string;
  teacher_id: string;
}

interface Enrollment {
  student_id: string;
  classroom_id: string;
}

interface Word {
  id: string;
  classroom_id: string;
  word: string;
  translation: string | null;
  ipa?: string | null;
  pos?: string | null;
  example?: string | null;
  example_vi?: string | null;
  synonyms?: string[];
  antonyms?: string[];
  image_url?: string | null;
}

interface SrsProgress {
  id: string;
  user_id: string;
  word_id: string;
  review_count: number;
  next_review_date: string; // ISO 8601 timestamptz
  stability?: number;
}

// ============================================================================
// Exact SQL Logic Simulators mirroring PostgreSQL Functions
// ============================================================================

class PostgresSimulationEngine {
  classrooms: Classroom[] = [];
  enrollments: Enrollment[] = [];
  words: Word[] = [];
  srsProgress: SrsProgress[] = [];

  clear() {
    this.classrooms = [];
    this.enrollments = [];
    this.words = [];
    this.srsProgress = [];
  }

  /**
   * CTE: user_classes
   * SELECT c.id FROM public.classrooms c WHERE c.teacher_id = p_user_id
   * UNION
   * SELECT e.classroom_id AS id FROM public.enrollments e WHERE e.student_id = p_user_id
   */
  getUserClasses(userId: string): Set<string> {
    const classIds = new Set<string>();
    for (const c of this.classrooms) {
      if (c.teacher_id === userId) {
        classIds.add(c.id);
      }
    }
    for (const e of this.enrollments) {
      if (e.student_id === userId) {
        classIds.add(e.classroom_id);
      }
    }
    return classIds;
  }

  /**
   * Simulates public.get_due_words_list as implemented in the migration
   */
  getDueWordsList(
    userId: string,
    classroomId: string | null = null,
    limit: number = 50,
    evalNow: Date = new Date(),
    authUid: string = userId,
    authRole: string = 'authenticated'
  ) {
    // Auth check: (coalesce(auth.role(), '') = 'service_role' OR auth.uid() = p_user_id)
    if (authRole !== 'service_role' && authUid !== userId) {
      return [];
    }

    const userClasses = this.getUserClasses(userId);
    const evalNowIso = evalNow.toISOString();

    const wordsMap = new Map<string, Word>(this.words.map((w) => [w.id, w]));

    const matches = this.srsProgress
      .filter((s) => {
        if (s.user_id !== userId) return false;
        const w = wordsMap.get(s.word_id);
        if (!w) return false;

        // WHERE clause from migration:
        // w.classroom_id IN (SELECT id FROM user_classes)
        // AND (p_classroom_id IS NULL OR w.classroom_id = p_classroom_id)
        if (!userClasses.has(w.classroom_id)) return false;
        if (classroomId !== null && w.classroom_id !== classroomId) return false;

        if (s.review_count <= 0) return false;
        if (s.next_review_date > evalNowIso) return false;

        if (!w.translation || w.translation.trim() === '') return false;
        const trLower = w.translation.toLowerCase();
        if (trLower.includes('failed')) return false;
        if (trLower.includes('analyzing')) return false;
        if (w.translation.includes('⏳')) return false;

        return true;
      })
      .sort((a, b) => (a.next_review_date < b.next_review_date ? -1 : 1));

    // LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 0), 100)
    const effectiveLimit = Math.min(Math.max(limit ?? 50, 0), 100);
    const limited = matches.slice(0, effectiveLimit);

    return limited.map((s) => {
      const w = wordsMap.get(s.word_id)!;
      return {
        id: w.id,
        word: w.word,
        translation: w.translation!,
        ipa: w.ipa ?? null,
        pos: w.pos ?? null,
        example: w.example ?? null,
        example_vi: w.example_vi ?? null,
        synonyms: w.synonyms ?? [],
        antonyms: w.antonyms ?? [],
        image_url: w.image_url ?? null,
        review_count: s.review_count,
        classroom_id: w.classroom_id,
      };
    });
  }

  /**
   * Simulates public.get_word_summary as implemented in the migration
   */
  getWordSummary(
    userId: string,
    classroomId: string | null = null,
    evalNow: Date = new Date(),
    authUid: string = userId,
    authRole: string = 'authenticated'
  ) {
    if (authRole !== 'service_role' && authUid !== userId) {
      throw new Error('Forbidden: errcode 42501');
    }

    const userClasses = this.getUserClasses(userId);
    const evalNowIso = evalNow.toISOString();

    // Words scoped according to:
    // w.classroom_id IN (SELECT id FROM user_classes)
    // AND (p_classroom_id IS NULL OR w.classroom_id = p_classroom_id)
    const scopedWords = this.words.filter((w) => {
      if (!userClasses.has(w.classroom_id)) return false;
      if (classroomId !== null && w.classroom_id !== classroomId) return false;
      return true;
    });

    const srsByUserAndWord = new Map<string, SrsProgress>();
    for (const sp of this.srsProgress) {
      if (sp.user_id === userId) {
        srsByUserAndWord.set(sp.word_id, sp);
      }
    }

    let total = scopedWords.length;
    let learned = 0;
    let reviewDue = 0;
    let srsDue = 0;
    let withSrs = 0;
    const levelBuckets = [0, 0, 0, 0, 0, 0];

    for (const w of scopedWords) {
      const sp = srsByUserAndWord.get(w.id);

      if (sp) {
        withSrs++;
        if (sp.review_count > 0) learned++;

        const tr = w.translation ?? '';
        const trLower = tr.toLowerCase();
        const validTrans =
          w.translation !== null &&
          w.translation.trim() !== '' &&
          !trLower.includes('failed') &&
          !trLower.includes('analyzing') &&
          !tr.includes('⏳');

        if (validTrans && sp.next_review_date <= evalNowIso) {
          if (sp.review_count > 0) reviewDue++;
          srsDue++;
        }

        const stab = sp.stability ?? 0;
        if (stab < 2) levelBuckets[0]++;
        else if (stab < 5) levelBuckets[1]++;
        else if (stab < 10) levelBuckets[2]++;
        else if (stab < 30) levelBuckets[3]++;
        else if (stab < 90) levelBuckets[4]++;
        else levelBuckets[5]++;
      } else {
        // sp is null -> bucket 0
        levelBuckets[0]++;
      }
    }

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
      level_counts: levelBuckets,
    };
  }

  /**
   * Simulates public.push_actual_due_counts as implemented in the migration
   */
  pushActualDueCounts(
    userIds: string[],
    evalNow: Date = new Date()
  ): Array<{ user_id: string; due_count: number }> {
    // WITH candidates AS (SELECT DISTINCT unnest(p_user_ids) AS user_id)
    const candidates = Array.from(new Set(userIds.filter((id) => id != null)));
    if (candidates.length === 0) return [];

    const evalNowIso = evalNow.toISOString();
    const candidateSet = new Set(candidates);

    // user_classes CTE:
    // SELECT c.teacher_id AS user_id, c.id AS cid FROM classrooms c JOIN candidates ...
    // UNION
    // SELECT e.student_id AS user_id, e.classroom_id AS cid FROM enrollments e JOIN candidates ...
    const userClasses = new Set<string>(); // key: `${userId}:${cid}`
    for (const c of this.classrooms) {
      if (candidateSet.has(c.teacher_id)) {
        userClasses.add(`${c.teacher_id}:${c.id}`);
      }
    }
    for (const e of this.enrollments) {
      if (candidateSet.has(e.student_id)) {
        userClasses.add(`${e.student_id}:${e.classroom_id}`);
      }
    }

    const wordsMap = new Map<string, Word>(this.words.map((w) => [w.id, w]));

    // actual_due CTE:
    // FROM srs_progress sp
    // JOIN candidates c ON c.user_id = sp.user_id
    // JOIN words w ON w.id = sp.word_id
    // JOIN user_classes uc ON uc.user_id = sp.user_id AND uc.cid = w.classroom_id
    // WHERE sp.review_count > 0 AND sp.next_review_date <= p_now ...
    // GROUP BY sp.user_id
    const actualDueMap = new Map<string, Set<string>>(); // userId -> Set of due word_ids

    for (const sp of this.srsProgress) {
      if (!candidateSet.has(sp.user_id)) continue;
      if (sp.review_count <= 0) continue;
      if (sp.next_review_date > evalNowIso) continue;

      const w = wordsMap.get(sp.word_id);
      if (!w) continue;

      const userClassKey = `${sp.user_id}:${w.classroom_id}`;
      if (!userClasses.has(userClassKey)) continue;

      if (!w.translation || w.translation.trim() === '') continue;
      const trLower = w.translation.toLowerCase();
      if (trLower.includes('failed')) continue;
      if (trLower.includes('analyzing')) continue;
      if (w.translation.includes('⏳')) continue;

      if (!actualDueMap.has(sp.user_id)) {
        actualDueMap.set(sp.user_id, new Set());
      }
      actualDueMap.get(sp.user_id)!.add(sp.word_id);
    }

    // SELECT c.user_id, COALESCE(d.due_count, 0)::bigint AS due_count
    // FROM candidates c LEFT JOIN actual_due d ON d.user_id = c.user_id
    return candidates.map((userId) => ({
      user_id: userId,
      due_count: actualDueMap.get(userId)?.size ?? 0,
    }));
  }
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING CHALLENGER 2: ADVERSARIAL STRESS TEST SUITE (M3.1)');
  console.log('================================================================\n');

  const engine = new PostgresSimulationEngine();

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 1: Unenrolled Student & Data Leakage Stress Test
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CASE 1: Unenrolled Student Data Leakage & user_classes Scoping', () => {});
  const USER_ALICE = '00000000-0000-0000-0000-000000000001';
  const TEACHER_BOB = '00000000-0000-0000-0000-000000000002';

  const CLASS_PERSONAL = '11111111-1111-1111-1111-111111111111'; // Alice's owned
  const CLASS_ACTIVE = '22222222-2222-2222-2222-222222222222';   // Alice enrolled
  const CLASS_UNENROLLED = '33333333-3333-3333-3333-333333333333'; // Alice UNENROLLED from

  const testTime = new Date('2026-09-27T10:00:00.000Z');
  const pastTime = new Date('2026-09-26T10:00:00.000Z').toISOString();

  await runner.it('1.1: push_actual_due_counts strictly ignores words from unenrolled classroom', () => {
    engine.clear();

    // Classrooms
    engine.classrooms = [
      { id: CLASS_PERSONAL, name: '__personal__', teacher_id: USER_ALICE },
      { id: CLASS_ACTIVE, name: 'Active Class', teacher_id: TEACHER_BOB },
      { id: CLASS_UNENROLLED, name: 'Unenrolled Class', teacher_id: TEACHER_BOB },
    ];

    // Alice is enrolled ONLY in CLASS_ACTIVE (she previously unenrolled from CLASS_UNENROLLED)
    engine.enrollments = [
      { student_id: USER_ALICE, classroom_id: CLASS_ACTIVE },
    ];

    // Words in classrooms:
    // - 5 words in CLASS_PERSONAL
    // - 3 words in CLASS_ACTIVE
    // - 10 words in CLASS_UNENROLLED
    engine.words = [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `w-personal-${i}`,
        classroom_id: CLASS_PERSONAL,
        word: `p_word_${i}`,
        translation: `nghĩa_p_${i}`,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `w-active-${i}`,
        classroom_id: CLASS_ACTIVE,
        word: `a_word_${i}`,
        translation: `nghĩa_a_${i}`,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `w-unenrolled-${i}`,
        classroom_id: CLASS_UNENROLLED,
        word: `u_word_${i}`,
        translation: `nghĩa_u_${i}`,
      })),
    ];

    // Alice has SRS progress for ALL of them (including the 10 from the unenrolled class)
    engine.srsProgress = [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `srs-p-${i}`,
        user_id: USER_ALICE,
        word_id: `w-personal-${i}`,
        review_count: 2,
        next_review_date: pastTime,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `srs-a-${i}`,
        user_id: USER_ALICE,
        word_id: `w-active-${i}`,
        review_count: 1,
        next_review_date: pastTime,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `srs-u-${i}`,
        user_id: USER_ALICE,
        word_id: `w-unenrolled-${i}`,
        review_count: 5,
        next_review_date: pastTime,
      })),
    ];

    // Execute push_actual_due_counts
    const results = engine.pushActualDueCounts([USER_ALICE], testTime);
    expect(results.length).toBe(1);
    // Expected: 5 (personal) + 3 (active) = 8. The 10 unenrolled words MUST NOT leak into the count!
    expect(results[0].due_count).toBe(8);
  });

  await runner.it('1.2: get_due_words_list (cross-classroom) excludes unenrolled classroom words', () => {
    // p_classroom_id IS NULL -> cross-classroom review
    const dueWords = engine.getDueWordsList(USER_ALICE, null, 50, testTime);
    expect(dueWords.length).toBe(8);

    // Verify no word from CLASS_UNENROLLED is leaked
    const unenrolledWords = dueWords.filter((w) => w.classroom_id === CLASS_UNENROLLED);
    expect(unenrolledWords.length).toBe(0);

    // Verify distribution: exactly 5 personal, 3 active
    const personalWords = dueWords.filter((w) => w.classroom_id === CLASS_PERSONAL);
    const activeWords = dueWords.filter((w) => w.classroom_id === CLASS_ACTIVE);
    expect(personalWords.length).toBe(5);
    expect(activeWords.length).toBe(3);
  });

  await runner.it('1.3: get_word_summary (cross-classroom) aggregates only active classes', () => {
    const summary = engine.getWordSummary(USER_ALICE, null, testTime);
    // Alice owns CLASS_PERSONAL (5 words) and is enrolled in CLASS_ACTIVE (3 words).
    // Total words should be 8, not 18.
    expect(summary.total).toBe(8);
    expect(summary.review_due_count).toBe(8);
    expect(summary.due_count).toBe(8);
    expect(summary.learned).toBe(8);
  });

  await runner.it('1.4: [SECURITY REMEDIATED] get_due_words_list with explicit unenrolled p_classroom_id returns 0 words', () => {
    // When Alice explicitly supplies p_classroom_id = CLASS_UNENROLLED:
    // The SQL condition:
    //   w.classroom_id IN (SELECT id FROM user_classes)
    //   AND (p_classroom_id IS NULL OR w.classroom_id = p_classroom_id)
    // Because CLASS_UNENROLLED is not in user_classes, it returns 0 words!
    const securedWords = engine.getDueWordsList(USER_ALICE, CLASS_UNENROLLED, 50, testTime);

    // Empirical verification: 0 words returned, completely blocking unenrolled class data leakage!
    expect(securedWords.length).toBe(0);
  });

  await runner.it('1.5: [SECURITY REMEDIATED] get_word_summary with arbitrary private classroom_id returns zeroes', () => {
    // Alice probes CLASS_UNENROLLED directly:
    const summary = engine.getWordSummary(USER_ALICE, CLASS_UNENROLLED, testTime);

    // Because CLASS_UNENROLLED is not in user_classes, scoped words is empty:
    expect(summary.total).toBe(0);
    expect(summary.learned).toBe(0);
    expect(summary.review_due).toBe(0);
    expect(summary.review_due_count).toBe(0);
    expect(summary.due_count).toBe(0);
  });

  await runner.it('1.6: [DEFENSIVE CHECK] trim(translation) <> empty filters out whitespace/empty translations', () => {
    engine.words.push({
      id: 'w-empty-trans',
      classroom_id: CLASS_PERSONAL,
      word: 'empty_word',
      translation: '   ',
    });
    engine.srsProgress.push({
      id: 'srs-empty',
      user_id: USER_ALICE,
      word_id: 'w-empty-trans',
      review_count: 1,
      next_review_date: pastTime,
    });

    const dueList = engine.getDueWordsList(USER_ALICE, CLASS_PERSONAL, 50, testTime);
    expect(dueList.some((w) => w.id === 'w-empty-trans')).toBe(false);

    const pushRes = engine.pushActualDueCounts([USER_ALICE], testTime);
    // Still 8, not 9
    expect(pushRes[0].due_count).toBe(8);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 2: 1000-User Scalability, Grouping & NULL / Duplicate Stress Test
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CASE 2: 1000-User push_actual_due_counts Scalability & Edge Cases', () => {});
  const futureTime = new Date('2026-09-28T12:00:00.000Z').toISOString();

  await runner.it('2.1: Scales to 1000 users with heterogeneous due counts and returns exact grouping', () => {
    engine.clear();

    // Create 1000 users: u-0001 to u-1000
    const userList = Array.from({ length: 1000 }, (_, i) => `u-${String(i + 1).padStart(4, '0')}`);

    // Partition users:
    // Group A (300 users): No classrooms at all -> expected due = 0
    // Group B (200 users): In classroom, but 0 words due (future due date) -> expected due = 0
    // Group C (300 users): In classroom, exactly 4 words due -> expected due = 4
    // Group D (100 users): Unenrolled from classroom (srs exists, but enrollment removed) -> expected due = 0
    // Group E (100 users): In classroom, words due but all have 'failed'/'Analyzing'/'⏳' -> expected due = 0

    const groupA = userList.slice(0, 300);
    const groupB = userList.slice(300, 500);
    const groupC = userList.slice(500, 800);
    const groupD = userList.slice(800, 900);
    const groupE = userList.slice(900, 1000);

    // Classrooms
    const classB = 'class-b-shared';
    const classC = 'class-c-shared';
    const classD = 'class-d-unenrolled';
    const classE = 'class-e-artifacts';

    engine.classrooms = [
      { id: classB, name: 'B', teacher_id: 'teacher-sys' },
      { id: classC, name: 'C', teacher_id: 'teacher-sys' },
      { id: classD, name: 'D', teacher_id: 'teacher-sys' },
      { id: classE, name: 'E', teacher_id: 'teacher-sys' },
    ];

    engine.enrollments = [
      ...groupB.map((uid) => ({ student_id: uid, classroom_id: classB })),
      ...groupC.map((uid) => ({ student_id: uid, classroom_id: classC })),
      ...groupE.map((uid) => ({ student_id: uid, classroom_id: classE })),
    ];

    const wordsB: Word[] = Array.from({ length: 4 }, (_, i) => ({
      id: `wb-${i}`,
      classroom_id: classB,
      word: `word_b_${i}`,
      translation: `nghĩa b ${i}`,
    }));
    const wordsC: Word[] = Array.from({ length: 4 }, (_, i) => ({
      id: `wc-${i}`,
      classroom_id: classC,
      word: `word_c_${i}`,
      translation: `nghĩa c ${i}`,
    }));
    const wordsD: Word[] = Array.from({ length: 4 }, (_, i) => ({
      id: `wd-${i}`,
      classroom_id: classD,
      word: `word_d_${i}`,
      translation: `nghĩa d ${i}`,
    }));
    const wordsE: Word[] = [
      { id: 'we-0', classroom_id: classE, word: 'fail_word', translation: 'failed: quota exceeded' },
      { id: 'we-1', classroom_id: classE, word: 'analyzing_word', translation: 'Analyzing vocabulary...' },
      { id: 'we-2', classroom_id: classE, word: 'hourglass_word', translation: '⏳ Đang dịch thuật' },
      { id: 'we-3', classroom_id: classE, word: 'null_word', translation: null },
    ];

    engine.words = [...wordsB, ...wordsC, ...wordsD, ...wordsE];

    const allSrs: SrsProgress[] = [];

    // Group B: next_review_date in FUTURE
    for (const uid of groupB) {
      for (const w of wordsB) {
        allSrs.push({
          id: `srs-${uid}-${w.id}`,
          user_id: uid,
          word_id: w.id,
          review_count: 1,
          next_review_date: futureTime,
        });
      }
    }

    // Group C: next_review_date in PAST (due!)
    for (const uid of groupC) {
      for (const w of wordsC) {
        allSrs.push({
          id: `srs-${uid}-${w.id}`,
          user_id: uid,
          word_id: w.id,
          review_count: 2,
          next_review_date: pastTime,
        });
      }
    }

    // Group D: next_review_date in PAST (but unenrolled!)
    for (const uid of groupD) {
      for (const w of wordsD) {
        allSrs.push({
          id: `srs-${uid}-${w.id}`,
          user_id: uid,
          word_id: w.id,
          review_count: 3,
          next_review_date: pastTime,
        });
      }
    }

    // Group E: next_review_date in PAST (but translation rejected!)
    for (const uid of groupE) {
      for (const w of wordsE) {
        allSrs.push({
          id: `srs-${uid}-${w.id}`,
          user_id: uid,
          word_id: w.id,
          review_count: 1,
          next_review_date: pastTime,
        });
      }
    }

    engine.srsProgress = allSrs;

    // Execute push_actual_due_counts with all 1000 users
    const startMs = Date.now();
    const results = engine.pushActualDueCounts(userList, testTime);
    const elapsedMs = Date.now() - startMs;

    // Assertions
    expect(results.length).toBe(1000);
    expect(elapsedMs < 100).toBe(true); // Should execute under 100ms in simulation

    const resultMap = new Map(results.map((r) => [r.user_id, r.due_count]));

    // Verify Group A (no classes): all 0
    for (const uid of groupA) {
      expect(resultMap.get(uid)).toBe(0);
    }

    // Verify Group B (future review): all 0
    for (const uid of groupB) {
      expect(resultMap.get(uid)).toBe(0);
    }

    // Verify Group C (4 due words in active class): all 4
    for (const uid of groupC) {
      expect(resultMap.get(uid)).toBe(4);
    }

    // Verify Group D (unenrolled): all 0
    for (const uid of groupD) {
      expect(resultMap.get(uid)).toBe(0);
    }

    // Verify Group E (invalid translations): all 0
    for (const uid of groupE) {
      expect(resultMap.get(uid)).toBe(0);
    }
  });

  await runner.it('2.2: Handles duplicate user_ids gracefully via candidates DISTINCT unnest', () => {
    // Pass duplicates in array: ['u-0501', 'u-0501', 'u-0501', 'u-0001', 'u-0001']
    const dupInput = ['u-0501', 'u-0501', 'u-0501', 'u-0001', 'u-0001'];
    const results = engine.pushActualDueCounts(dupInput, testTime);

    // Should return exactly 2 distinct rows
    expect(results.length).toBe(2);
    const rMap = new Map(results.map((r) => [r.user_id, r.due_count]));
    expect(rMap.get('u-0501')).toBe(4);
    expect(rMap.get('u-0001')).toBe(0);
  });

  await runner.it('2.3: Handles empty input array [] without error', () => {
    const results = engine.pushActualDueCounts([], testTime);
    expect(results.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 3: Boundary Values of next_review_date (Exact, 1ms Before, 1ms After)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CASE 3: next_review_date Boundary Evaluation (Equal, -1ms, +1ms)', () => {});
  const USER_BOUNDARY = 'user-boundary-test';
  const CLASS_BOUNDARY = 'class-boundary-test';

  const T0 = new Date('2026-09-27T08:50:00.000Z');
  const T0_epoch = T0.getTime();

  const T_past_1s = new Date(T0_epoch - 1000).toISOString();
  const T_past_1ms = new Date(T0_epoch - 1).toISOString();   // 2026-09-27T08:49:59.999Z
  const T_exact_now = new Date(T0_epoch).toISOString();       // 2026-09-27T08:50:00.000Z
  const T_future_1ms = new Date(T0_epoch + 1).toISOString(); // 2026-09-27T08:50:00.001Z
  const T_future_1s = new Date(T0_epoch + 1000).toISOString();

  await runner.it('3.1: Precision boundary verification: <= now() includes -1ms, exact, and excludes +1ms', () => {
    engine.clear();
    engine.classrooms = [{ id: CLASS_BOUNDARY, name: 'Boundary Class', teacher_id: USER_BOUNDARY }];
    engine.enrollments = [];

    engine.words = [
      { id: 'w-1s-before', classroom_id: CLASS_BOUNDARY, word: 'past_1s', translation: '1s trước' },
      { id: 'w-1ms-before', classroom_id: CLASS_BOUNDARY, word: 'past_1ms', translation: '1ms trước' },
      { id: 'w-exact', classroom_id: CLASS_BOUNDARY, word: 'exact', translation: 'chính xác T0' },
      { id: 'w-1ms-after', classroom_id: CLASS_BOUNDARY, word: 'future_1ms', translation: '1ms sau' },
      { id: 'w-1s-after', classroom_id: CLASS_BOUNDARY, word: 'future_1s', translation: '1s sau' },
    ];

    engine.srsProgress = [
      { id: 's-1', user_id: USER_BOUNDARY, word_id: 'w-1s-before', review_count: 1, next_review_date: T_past_1s },
      { id: 's-2', user_id: USER_BOUNDARY, word_id: 'w-1ms-before', review_count: 1, next_review_date: T_past_1ms },
      { id: 's-3', user_id: USER_BOUNDARY, word_id: 'w-exact', review_count: 1, next_review_date: T_exact_now },
      { id: 's-4', user_id: USER_BOUNDARY, word_id: 'w-1ms-after', review_count: 1, next_review_date: T_future_1ms },
      { id: 's-5', user_id: USER_BOUNDARY, word_id: 'w-1s-after', review_count: 1, next_review_date: T_future_1s },
    ];

    // 1. Test get_due_words_list
    const dueWords = engine.getDueWordsList(USER_BOUNDARY, null, 50, T0);
    expect(dueWords.length).toBe(3);
    const dueIds = new Set(dueWords.map((w) => w.id));
    expect(dueIds.has('w-1s-before')).toBe(true);
    expect(dueIds.has('w-1ms-before')).toBe(true);
    expect(dueIds.has('w-exact')).toBe(true); // EXACT MATCH MUST BE DUE!
    expect(dueIds.has('w-1ms-after')).toBe(false); // +1ms MUST NOT BE DUE!
    expect(dueIds.has('w-1s-after')).toBe(false);

    // 2. Test get_word_summary
    const summary = engine.getWordSummary(USER_BOUNDARY, null, T0);
    expect(summary.review_due_count).toBe(3);
    expect(summary.due_count).toBe(3);

    // 3. Test push_actual_due_counts
    const pushCounts = engine.pushActualDueCounts([USER_BOUNDARY], T0);
    expect(pushCounts[0].due_count).toBe(3);
  });

  await runner.it('3.2: Comparison with flawed (now() AT TIME ZONE UTC) under UTC+7', () => {
    // In UTC+7, if server time is 2026-09-27T08:50:00.000Z:
    // (now() AT TIME ZONE 'UTC') produces timestamp without timezone '2026-09-27 08:50:00'.
    // When coerced to timestamptz in a UTC+7 session, it becomes '2026-09-27 08:50:00+07' = '2026-09-27 01:50:00Z'.
    // A defect of exactly 7 hours in the past!
    const cutoffFlawedEpoch = T0_epoch - 7 * 3600 * 1000;
    const flawedCutoffIso = new Date(cutoffFlawedEpoch).toISOString();

    // Check how many items satisfy the flawed cutoff:
    const flawedDueCount = engine.srsProgress.filter(
      (sp) => sp.review_count > 0 && sp.next_review_date <= flawedCutoffIso
    ).length;

    // Under the flawed logic, items due in the last 7 hours (including T0, T0-1ms, T0-1s) were NOT due!
    expect(flawedDueCount).toBe(0);

    // Replacing with now() restores all 3 items:
    const correctDueCount = engine.srsProgress.filter(
      (sp) => sp.review_count > 0 && sp.next_review_date <= T0.toISOString()
    ).length;
    expect(correctDueCount).toBe(3);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 4: SQL Static Contract & Execution Validity
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CASE 4: SQL Static Contract, Security & Execution Validity', () => {});
  const migrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20260927_cross_classroom_due_words_and_tz.sql'
  );
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  await runner.it('4.1: Migration file exists and has valid non-empty SQL content', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(sqlContent.length > 2000).toBe(true);
  });

  await runner.it('4.2: Zero occurrences of flawed (now() AT TIME ZONE UTC) in executable SQL', () => {
    const sqlNoComments = sqlContent.replace(/--.*$/gm, '');
    expect(sqlNoComments.includes("(now() AT TIME ZONE 'UTC')")).toBe(false);
    expect(sqlNoComments.includes('AT TIME ZONE')).toBe(false);
  });

  await runner.it('4.3: All three RPCs configured with SECURITY DEFINER and fixed search_path', () => {
    const securityDefinerCount = (sqlContent.match(/SECURITY DEFINER/g) || []).length;
    expect(securityDefinerCount).toBe(3);

    const searchPathCount = (sqlContent.match(/SET search_path = pg_catalog, public/g) || []).length;
    expect(searchPathCount).toBe(3);
  });

  await runner.it('4.4: public.get_due_words_list contract adheres to application requirements', () => {
    expect(sqlContent.includes('classroom_id uuid')).toBe(true);
    expect(sqlContent.includes('p_classroom_id uuid DEFAULT NULL')).toBe(true);
    expect(sqlContent.includes("w.translation NOT ILIKE '%failed%'")).toBe(true);
    expect(sqlContent.includes("w.translation NOT ILIKE '%Analyzing%'")).toBe(true);
    expect(sqlContent.includes("w.translation NOT LIKE '%⏳%'")).toBe(true);
  });

  await runner.it('4.5: public.get_word_summary forbidden check and level_counts jsonb structure', () => {
    expect(sqlContent.includes("RAISE EXCEPTION 'Forbidden' USING errcode = '42501'")).toBe(true);
    expect(sqlContent.includes('level_counts jsonb')).toBe(true);
    expect(sqlContent.includes('jsonb_build_array(')).toBe(true);
  });

  await runner.it('4.6: public.push_actual_due_counts service_role restricted execution', () => {
    expect(sqlContent.includes('REVOKE ALL ON FUNCTION public.push_actual_due_counts')).toBe(true);
    expect(sqlContent.includes('GRANT EXECUTE ON FUNCTION public.push_actual_due_counts(uuid[], timestamptz) TO service_role;')).toBe(true);
    expect(sqlContent.includes('push_actual_due_counts(uuid[], timestamptz) TO authenticated')).toBe(false);
  });

  await runner.it('4.7: Planner statistics updated via ANALYZE for all involved tables', () => {
    expect(sqlContent.includes('ANALYZE public.words;')).toBe(true);
    expect(sqlContent.includes('ANALYZE public.srs_progress;')).toBe(true);
    expect(sqlContent.includes('ANALYZE public.classrooms;')).toBe(true);
    expect(sqlContent.includes('ANALYZE public.enrollments;')).toBe(true);
  });

  await runner.it('4.8: IDOR remediation enforced in both get_due_words_list and get_word_summary', () => {
    const idorPattern = /w\.classroom_id\s+IN\s+\(SELECT\s+id\s+FROM\s+user_classes\)\s+AND\s+\(p_classroom_id\s+IS\s+NULL\s+OR\s+w\.classroom_id\s*=\s*p_classroom_id\)/g;
    const matches = sqlContent.match(idorPattern);
    expect(matches).toBeDefined();
    expect(matches!.length).toBe(2);
  });

  await runner.it('4.9: Defensive trim(w.translation) <> \'\' present in all three RPCs', () => {
    const trimMatches = sqlContent.match(/trim\(w\.translation\)\s*<>\s*''/g);
    expect(trimMatches).toBeDefined();
    expect(trimMatches!.length >= 3).toBe(true);
  });

  await runner.it('4.10: Covering index idx_srs_progress_due_covering created with INCLUDE columns', () => {
    expect(sqlContent.includes('CREATE INDEX IF NOT EXISTS idx_srs_progress_due_covering')).toBe(true);
    expect(sqlContent.includes('INCLUDE (word_id, review_count)')).toBe(true);
    expect(sqlContent.includes('WHERE review_count > 0')).toBe(true);
  });

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Adversarial Suite Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Execution Time: ${stats.durationMs} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

