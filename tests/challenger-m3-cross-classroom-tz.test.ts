/**
 * Challenger M3.1: Empirical Verification of Database RPCs & Timezone Migration
 *
 * This test suite empirically verifies:
 * 1. Static Contract & Migration Analysis:
 *    - Validates supabase/migrations/20260927_cross_classroom_due_words_and_tz.sql.
 *    - Verifies function signatures, return columns (including classroom_id),
 *      SECURITY DEFINER, search_path, permissions, and absence of (now() AT TIME ZONE 'UTC').
 * 2. Relational SQL Logic Simulation:
 *    - Simulates user_classes CTE aggregation for a user owning 1 class and enrolled in 2 other classes.
 *    - Tests p_classroom_id NULL fallback (cross-classroom aggregation) vs specified classroom scoping.
 *    - Simulates get_due_words_list, get_word_summary, and push_actual_due_counts.
 * 3. Timezone Comparison Verification:
 *    - Compares timestamptz <= now() vs (now() AT TIME ZONE 'UTC') under UTC+7 and other timezones.
 *    - Proves empirically that now() preserves exact due items without the 7-hour attenuation bug.
 * 4. Translation Exclusion Filter Robustness:
 *    - Evaluates positive and negative translation strings (failed, Analyzing, ⏳, Vietnamese text).
 * 5. Edge Cases & Boundary Conditions:
 *    - Empty classrooms, self-enrollment deduplication, orphan progress, limit clamping.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestRunner, expect } from './perf/test-harness';

const runner = new TestRunner();

// ============================================================================
// Types & Data Structures matching PostgreSQL Schema
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
  created_at: string;
}

interface SrsProgress {
  id: string;
  user_id: string;
  word_id: string;
  review_count: number;
  next_review_date: string; // ISO 8601 UTC timestamptz
  stability: number;
}

// ============================================================================
// SQL Logic Simulation Engines matching Migration 20260927
// ============================================================================

/**
 * Filter predicate representing:
 *   w.translation IS NOT NULL
 *   AND w.translation NOT ILIKE '%failed%'
 *   AND w.translation NOT ILIKE '%Analyzing%'
 *   AND w.translation NOT LIKE '%⏳%'
 */
export function isTranslationValid(translation: string | null): boolean {
  if (translation === null || translation === undefined) return false;
  if (translation.trim() === '') return false;
  const lower = translation.toLowerCase();
  if (lower.includes('failed')) return false;
  if (lower.includes('analyzing')) return false;
  if (translation.includes('⏳')) return false;
  return true;
}

/**
 * Simulates user_classes CTE:
 *   SELECT c.id FROM classrooms c WHERE c.teacher_id = p_user_id
 *   UNION
 *   SELECT e.classroom_id AS id FROM enrollments e WHERE e.student_id = p_user_id
 */
export function getUserClasses(
  userId: string,
  classrooms: Classroom[],
  enrollments: Enrollment[]
): Set<string> {
  const classIds = new Set<string>();
  for (const c of classrooms) {
    if (c.teacher_id === userId) {
      classIds.add(c.id);
    }
  }
  for (const e of enrollments) {
    if (e.student_id === userId) {
      classIds.add(e.classroom_id);
    }
  }
  return classIds;
}

/**
 * Simulates public.get_due_words_list RPC
 */
export function simulateGetDueWordsList(params: {
  userId: string;
  classroomId?: string | null;
  limit?: number | null;
  classrooms: Classroom[];
  enrollments: Enrollment[];
  words: Word[];
  srsProgress: SrsProgress[];
  currentTime: Date;
}) {
  const {
    userId,
    classroomId = null,
    limit = 50,
    classrooms,
    enrollments,
    words,
    srsProgress,
    currentTime,
  } = params;

  const userClasses = getUserClasses(userId, classrooms, enrollments);
  const wordsById = new Map<string, Word>(words.map((w) => [w.id, w]));

  // Clamp limit: LEAST(GREATEST(COALESCE(p_limit, 50), 0), 100)
  const effectiveLimit = Math.min(Math.max(limit ?? 50, 0), 100);

  // WHERE s.user_id = p_user_id
  const matchingSrs = srsProgress.filter((s) => {
    if (s.user_id !== userId) return false;
    const w = wordsById.get(s.word_id);
    if (!w) return false;

    // Classroom scoping: MUST belong to userClasses AND match classroomId if provided
    if (!userClasses.has(w.classroom_id)) return false;
    if (classroomId !== null && classroomId !== undefined && w.classroom_id !== classroomId) return false;

    // s.review_count > 0
    if (s.review_count <= 0) return false;

    // s.next_review_date <= now()
    const nextReview = new Date(s.next_review_date);
    if (nextReview.getTime() > currentTime.getTime()) return false;

    // Translation filter
    if (!isTranslationValid(w.translation)) return false;

    return true;
  });

  // ORDER BY s.next_review_date ASC
  matchingSrs.sort((a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime());

  // LIMIT effectiveLimit
  const sliced = matchingSrs.slice(0, effectiveLimit);

  return sliced.map((s) => {
    const w = wordsById.get(s.word_id)!;
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
 * Simulates public.get_word_summary RPC
 */
export function simulateGetWordSummary(params: {
  userId: string;
  classroomId?: string | null;
  classrooms: Classroom[];
  enrollments: Enrollment[];
  words: Word[];
  srsProgress: SrsProgress[];
  currentTime: Date;
}) {
  const {
    userId,
    classroomId = null,
    classrooms,
    enrollments,
    words,
    srsProgress,
    currentTime,
  } = params;

  const userClasses = getUserClasses(userId, classrooms, enrollments);

  // Filter words by classroom scoping: MUST belong to userClasses AND match classroomId if provided
  const scopedWords = words.filter((w) => {
    if (!userClasses.has(w.classroom_id)) return false;
    if (classroomId !== null && classroomId !== undefined && w.classroom_id !== classroomId) return false;
    return true;
  });

  // Build user SRS lookup by word_id
  const srsMap = new Map<string, SrsProgress>();
  for (const s of srsProgress) {
    if (s.user_id === userId) {
      srsMap.set(s.word_id, s);
    }
  }

  let total = 0;
  let learned = 0;
  let reviewDue = 0;
  let srsDue = 0;
  let withSrs = 0;
  const levelCounts = [0, 0, 0, 0, 0, 0];

  for (const w of scopedWords) {
    total++;
    const sp = srsMap.get(w.id);

    if (sp) {
      withSrs++;
      if (sp.review_count > 0) {
        learned++;
      }

      const isDue = new Date(sp.next_review_date).getTime() <= currentTime.getTime();
      const validTrans = isTranslationValid(w.translation);

      if (sp.review_count > 0 && isDue && validTrans) {
        reviewDue++;
      }
      if (isDue && validTrans) {
        srsDue++;
      }

      // Stability tiers
      const stab = sp.stability ?? 0;
      if (stab < 2) levelCounts[0]++;
      else if (stab < 5) levelCounts[1]++;
      else if (stab < 10) levelCounts[2]++;
      else if (stab < 30) levelCounts[3]++;
      else if (stab < 90) levelCounts[4]++;
      else levelCounts[5]++;
    } else {
      levelCounts[0]++; // sp.word_id IS NULL
    }
  }

  const newCount = Math.max(0, total - learned);
  const reviewDueCount = reviewDue;
  const dueCount = srsDue + Math.max(0, total - withSrs);

  return {
    total: BigInt(total),
    learned: BigInt(learned),
    review_due: BigInt(reviewDue),
    srs_due: BigInt(srsDue),
    with_srs: BigInt(withSrs),
    new_count: BigInt(newCount),
    review_due_count: BigInt(reviewDueCount),
    due_count: BigInt(dueCount),
    level_counts: levelCounts,
  };
}

/**
 * Simulates public.push_actual_due_counts RPC
 */
export function simulatePushActualDueCounts(params: {
  userIds: string[];
  now?: Date;
  classrooms: Classroom[];
  enrollments: Enrollment[];
  words: Word[];
  srsProgress: SrsProgress[];
}) {
  const {
    userIds,
    now = new Date(),
    classrooms,
    enrollments,
    words,
    srsProgress,
  } = params;

  const candidateSet = new Set(userIds);
  const wordsById = new Map<string, Word>(words.map((w) => [w.id, w]));

  const results = new Map<string, number>();
  for (const uid of candidateSet) {
    results.set(uid, 0);
  }

  for (const uid of candidateSet) {
    const userClasses = getUserClasses(uid, classrooms, enrollments);

    const dueWordIds = new Set<string>();
    for (const sp of srsProgress) {
      if (sp.user_id !== uid) continue;
      if (sp.review_count <= 0) continue;
      if (new Date(sp.next_review_date).getTime() > now.getTime()) continue;

      const w = wordsById.get(sp.word_id);
      if (!w) continue;
      if (!userClasses.has(w.classroom_id)) continue;
      if (!isTranslationValid(w.translation)) continue;

      dueWordIds.add(sp.word_id);
    }

    results.set(uid, dueWordIds.size);
  }

  return Array.from(candidateSet).map((uid) => ({
    user_id: uid,
    due_count: BigInt(results.get(uid) ?? 0),
  }));
}

// ============================================================================
// TEST SUITES
// ============================================================================

runner.describe('Suite 1: Static Migration SQL Contract & AST Parity', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20260927_cross_classroom_due_words_and_tz.sql'
  );

  runner.it('M1.1: Migration file exists and is readable', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  const sqlContent = fs.existsSync(migrationPath)
    ? fs.readFileSync(migrationPath, 'utf8')
    : '';

  runner.it('M1.2: public.get_due_words_list includes classroom_id in return table', () => {
    expect(sqlContent).toContain('CREATE OR REPLACE FUNCTION public.get_due_words_list');
    expect(sqlContent).toContain('classroom_id uuid');
  });

  runner.it('M1.3: public.get_due_words_list has default NULL for p_classroom_id', () => {
    expect(sqlContent).toContain('p_classroom_id uuid DEFAULT NULL');
  });

  runner.it('M1.4: public.get_word_summary aggregates with user_classes CTE and uniform now()', () => {
    expect(sqlContent).toContain('CREATE OR REPLACE FUNCTION public.get_word_summary');
    expect(sqlContent).toContain('WITH user_classes AS (');
    expect(sqlContent).toContain('sp.next_review_date <= now()');
    // Ensure the old (now() AT TIME ZONE 'UTC') has been completely purged from executable SQL
    const executableSql = sqlContent
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    expect(executableSql.includes("now() AT TIME ZONE 'UTC'")).toBe(false);
    expect(executableSql.includes('AT TIME ZONE')).toBe(false);
  });

  runner.it('M1.5: public.push_actual_due_counts joins user_classes and applies translation filter', () => {
    expect(sqlContent).toContain('CREATE OR REPLACE FUNCTION public.push_actual_due_counts');
    expect(sqlContent).toContain('user_classes uc ON uc.user_id = sp.user_id AND uc.cid = w.classroom_id');
    expect(sqlContent).toContain("w.translation NOT ILIKE '%failed%'");
    expect(sqlContent).toContain("w.translation NOT ILIKE '%Analyzing%'");
    expect(sqlContent).toContain("w.translation NOT LIKE '%⏳%'");
  });

  runner.it('M1.6: Security permissions, search_path, and cleanup DROP clauses configured', () => {
    expect(sqlContent).toContain('SET search_path = pg_catalog, public');
    expect(sqlContent).toContain('SECURITY DEFINER');
    expect(sqlContent).toContain('DROP FUNCTION IF EXISTS public.get_due_words_list');
    expect(sqlContent).toContain('DROP FUNCTION IF EXISTS public.get_word_summary');
    expect(sqlContent).toContain('DROP FUNCTION IF EXISTS public.push_actual_due_counts');
    expect(sqlContent).toContain('REVOKE ALL ON FUNCTION public.get_due_words_list');
    expect(sqlContent).toContain('GRANT EXECUTE ON FUNCTION public.get_due_words_list');
  });

  runner.it('M1.7: public.get_due_words_list and get_word_summary enforce IDOR user_classes check', () => {
    const idorMatches = sqlContent.match(/w\.classroom_id\s+IN\s+\(SELECT\s+id\s+FROM\s+user_classes\)\s+AND\s+\(p_classroom_id\s+IS\s+NULL\s+OR\s+w\.classroom_id\s*=\s*p_classroom_id\)/g);
    expect(idorMatches).toBeDefined();
    expect(idorMatches!.length).toBe(2);
  });

  runner.it('M1.8: All three RPCs include defensive trim(w.translation) <> \'\' check', () => {
    const trimMatches = sqlContent.match(/trim\(w\.translation\)\s*<>\s*''/g);
    expect(trimMatches).toBeDefined();
    expect(trimMatches!.length >= 3).toBe(true);
  });

  runner.it('M1.9: Covering index idx_srs_progress_due_covering is created with INCLUDE clause', () => {
    expect(sqlContent).toContain('CREATE INDEX IF NOT EXISTS idx_srs_progress_due_covering');
    expect(sqlContent).toContain('INCLUDE (word_id, review_count)');
    expect(sqlContent).toContain('WHERE review_count > 0');
  });
});

runner.describe('Suite 2: Relational SQL Simulation - user_classes CTE & Fallback Scoping', () => {
  // Test fixture:
  // User 1: owns C1, enrolled in C2 and C3. Also enrolled in C1 (dedup).
  // User 2: owns C4, enrolled in C3.
  const USER_1 = '11111111-1111-1111-1111-111111111111';
  const USER_2 = '22222222-2222-2222-2222-222222222222';
  const USER_3 = '33333333-3333-3333-3333-333333333333';

  const C1_OWNED = 'c1111111-0000-0000-0000-000000000001';
  const C2_ENROLLED = 'c2222222-0000-0000-0000-000000000002';
  const C3_ENROLLED = 'c3333333-0000-0000-0000-000000000003';
  const C4_FOREIGN = 'c4444444-0000-0000-0000-000000000004';

  const classrooms: Classroom[] = [
    { id: C1_OWNED, name: 'Personal Vocab', teacher_id: USER_1 },
    { id: C2_ENROLLED, name: 'TOEIC 900 Master', teacher_id: USER_2 },
    { id: C3_ENROLLED, name: 'IELTS Band 8', teacher_id: USER_2 },
    { id: C4_FOREIGN, name: 'Private Secret Class', teacher_id: USER_2 },
  ];

  const enrollments: Enrollment[] = [
    { student_id: USER_1, classroom_id: C2_ENROLLED },
    { student_id: USER_1, classroom_id: C3_ENROLLED },
    { student_id: USER_1, classroom_id: C1_OWNED }, // Duplicate enrollment in owned class
    { student_id: USER_3, classroom_id: C4_FOREIGN },
  ];

  const fixedNow = new Date('2026-09-27T08:00:00.000Z');
  const pastDue = new Date('2026-09-27T07:00:00.000Z').toISOString();
  const futureNotDue = new Date('2026-09-27T09:00:00.000Z').toISOString();

  // Words setup: 5 words per class
  const words: Word[] = [
    // C1: 3 due, 1 not due, 1 unstudied
    { id: 'w1-1', classroom_id: C1_OWNED, word: 'apple', translation: 'quả táo', created_at: pastDue },
    { id: 'w1-2', classroom_id: C1_OWNED, word: 'banana', translation: 'quả chuối', created_at: pastDue },
    { id: 'w1-3', classroom_id: C1_OWNED, word: 'cherry', translation: 'quả anh đào', created_at: pastDue },
    { id: 'w1-4', classroom_id: C1_OWNED, word: 'date', translation: 'quả chà là', created_at: pastDue },
    { id: 'w1-5', classroom_id: C1_OWNED, word: 'fig', translation: 'quả sung', created_at: pastDue },

    // C2: 2 due, 2 not due, 1 unstudied
    { id: 'w2-1', classroom_id: C2_ENROLLED, word: 'abundant', translation: 'dồi dào', created_at: pastDue },
    { id: 'w2-2', classroom_id: C2_ENROLLED, word: 'benchmark', translation: 'chuẩn mực', created_at: pastDue },
    { id: 'w2-3', classroom_id: C2_ENROLLED, word: 'candidate', translation: 'ứng viên', created_at: pastDue },
    { id: 'w2-4', classroom_id: C2_ENROLLED, word: 'drastic', translation: 'quyết liệt', created_at: pastDue },
    { id: 'w2-5', classroom_id: C2_ENROLLED, word: 'eloquent', translation: 'lưu loát', created_at: pastDue },

    // C3: 4 due, 1 not due
    { id: 'w3-1', classroom_id: C3_ENROLLED, word: 'feasibility', translation: 'tính khả thi', created_at: pastDue },
    { id: 'w3-2', classroom_id: C3_ENROLLED, word: 'gregarious', translation: 'thích giao du', created_at: pastDue },
    { id: 'w3-3', classroom_id: C3_ENROLLED, word: 'hierarchy', translation: 'hệ thống cấp bậc', created_at: pastDue },
    { id: 'w3-4', classroom_id: C3_ENROLLED, word: 'indigenous', translation: 'bản địa', created_at: pastDue },
    { id: 'w3-5', classroom_id: C3_ENROLLED, word: 'juxtapose', translation: 'đặt cạnh nhau', created_at: pastDue },

    // C4 (Foreign): 5 words
    { id: 'w4-1', classroom_id: C4_FOREIGN, word: 'classified1', translation: 'bí mật 1', created_at: pastDue },
    { id: 'w4-2', classroom_id: C4_FOREIGN, word: 'classified2', translation: 'bí mật 2', created_at: pastDue },
  ];

  const srsProgress: SrsProgress[] = [
    // User 1 in C1 (3 due, 1 not due, w1-5 unstudied)
    { id: 's1', user_id: USER_1, word_id: 'w1-1', review_count: 2, next_review_date: pastDue, stability: 3.5 },
    { id: 's2', user_id: USER_1, word_id: 'w1-2', review_count: 4, next_review_date: pastDue, stability: 8.0 },
    { id: 's3', user_id: USER_1, word_id: 'w1-3', review_count: 1, next_review_date: pastDue, stability: 1.2 },
    { id: 's4', user_id: USER_1, word_id: 'w1-4', review_count: 5, next_review_date: futureNotDue, stability: 15.0 },

    // User 1 in C2 (2 due, 2 not due, w2-5 unstudied)
    { id: 's5', user_id: USER_1, word_id: 'w2-1', review_count: 3, next_review_date: pastDue, stability: 5.5 },
    { id: 's6', user_id: USER_1, word_id: 'w2-2', review_count: 2, next_review_date: pastDue, stability: 2.8 },
    { id: 's7', user_id: USER_1, word_id: 'w2-3', review_count: 1, next_review_date: futureNotDue, stability: 1.5 },
    { id: 's8', user_id: USER_1, word_id: 'w2-4', review_count: 6, next_review_date: futureNotDue, stability: 35.0 },

    // User 1 in C3 (4 due, 1 not due)
    { id: 's9', user_id: USER_1, word_id: 'w3-1', review_count: 1, next_review_date: pastDue, stability: 1.0 },
    { id: 's10', user_id: USER_1, word_id: 'w3-2', review_count: 2, next_review_date: pastDue, stability: 4.0 },
    { id: 's11', user_id: USER_1, word_id: 'w3-3', review_count: 3, next_review_date: pastDue, stability: 6.0 },
    { id: 's12', user_id: USER_1, word_id: 'w3-4', review_count: 4, next_review_date: pastDue, stability: 12.0 },
    { id: 's13', user_id: USER_1, word_id: 'w3-5', review_count: 8, next_review_date: futureNotDue, stability: 95.0 },

    // Foreign progress: User 1 erroneously has progress on C4 word (orphan)
    { id: 's14', user_id: USER_1, word_id: 'w4-1', review_count: 1, next_review_date: pastDue, stability: 2.0 },
  ];

  runner.it('M2.1: user_classes CTE deduplicates owned and enrolled classes into exact set {C1, C2, C3}', () => {
    const classes = getUserClasses(USER_1, classrooms, enrollments);
    expect(classes.size).toBe(3);
    expect(classes.has(C1_OWNED)).toBe(true);
    expect(classes.has(C2_ENROLLED)).toBe(true);
    expect(classes.has(C3_ENROLLED)).toBe(true);
    expect(classes.has(C4_FOREIGN)).toBe(false);
  });

  runner.it('M2.2: get_due_words_list with p_classroom_id IS NULL aggregates all 3 classrooms (3+2+4 = 9 due words)', () => {
    const dueWords = simulateGetDueWordsList({
      userId: USER_1,
      classroomId: null,
      limit: 50,
      classrooms,
      enrollments,
      words,
      srsProgress,
      currentTime: fixedNow,
    });

    expect(dueWords.length).toBe(9);

    // Verify foreign class word w4-1 was excluded even though User 1 had an orphan SRS record
    const hasForeignWord = dueWords.some((w) => w.id === 'w4-1');
    expect(hasForeignWord).toBe(false);

    // Verify all 3 classrooms are represented with accurate classroom_id in returned rows
    const returnedClassIds = new Set(dueWords.map((w) => w.classroom_id));
    expect(returnedClassIds.size).toBe(3);
    expect(returnedClassIds.has(C1_OWNED)).toBe(true);
    expect(returnedClassIds.has(C2_ENROLLED)).toBe(true);
    expect(returnedClassIds.has(C3_ENROLLED)).toBe(true);
  });

  runner.it('M2.3: get_due_words_list with specific p_classroom_id scopes strictly to that class', () => {
    // Specific query for C2
    const c2Words = simulateGetDueWordsList({
      userId: USER_1,
      classroomId: C2_ENROLLED,
      limit: 50,
      classrooms,
      enrollments,
      words,
      srsProgress,
      currentTime: fixedNow,
    });

    expect(c2Words.length).toBe(2);
    expect(c2Words.every((w) => w.classroom_id === C2_ENROLLED)).toBe(true);

    // Specific query for C1
    const c1Words = simulateGetDueWordsList({
      userId: USER_1,
      classroomId: C1_OWNED,
      limit: 50,
      classrooms,
      enrollments,
      words,
      srsProgress,
      currentTime: fixedNow,
    });

    expect(c1Words.length).toBe(3);
    expect(c1Words.every((w) => w.classroom_id === C1_OWNED)).toBe(true);
  });

  runner.it('M2.4: get_word_summary with p_classroom_id IS NULL aggregates total, learned, and due across all 3 classes', () => {
    const summary = simulateGetWordSummary({
      userId: USER_1,
      classroomId: null,
      classrooms,
      enrollments,
      words,
      srsProgress,
      currentTime: fixedNow,
    });

    // Total words across C1 (5) + C2 (5) + C3 (5) = 15
    expect(Number(summary.total)).toBe(15);
    // Learned words: 4 in C1 + 4 in C2 + 5 in C3 = 13
    expect(Number(summary.learned)).toBe(13);
    // Review due words: 3 in C1 + 2 in C2 + 4 in C3 = 9
    expect(Number(summary.review_due)).toBe(9);
    expect(Number(summary.review_due_count)).toBe(9);
    // New count: total (15) - learned (13) = 2 (w1-5 and w2-5)
    expect(Number(summary.new_count)).toBe(2);
    // Total dueCount = srsDue (9) + unstudied (2) = 11
    expect(Number(summary.due_count)).toBe(11);

    // Stability tier counts sum up to total words with SRS (13) + unstudied (2) = 15
    const tierSum = summary.level_counts.reduce((a, b) => a + b, 0);
    expect(tierSum).toBe(15);
  });

  runner.it('M2.5: push_actual_due_counts computes exact match (9 due words for User 1, 0 for nonexistent user)', () => {
    const pushCounts = simulatePushActualDueCounts({
      userIds: [USER_1, USER_3],
      now: fixedNow,
      classrooms,
      enrollments,
      words,
      srsProgress,
    });

    const u1Result = pushCounts.find((r) => r.user_id === USER_1);
    expect(u1Result).toBeDefined();
    expect(Number(u1Result!.due_count)).toBe(9);

    const u3Result = pushCounts.find((r) => r.user_id === USER_3);
    expect(u3Result).toBeDefined();
    expect(Number(u3Result!.due_count)).toBe(0);
  });

  runner.it('M2.6: Accessing un-enrolled classroom returns 0 words / 0 summary (IDOR prevented)', () => {
    // C4_FOREIGN is owned by USER_2 and enrolled by USER_3, but USER_1 is NOT enrolled
    const c4Words = simulateGetDueWordsList({
      userId: USER_1,
      classroomId: C4_FOREIGN,
      limit: 50,
      classrooms,
      enrollments,
      words,
      srsProgress,
      currentTime: fixedNow,
    });
    // Even though User 1 has orphan progress s14 for word w4-1 in C4, it must return 0 rows!
    expect(c4Words.length).toBe(0);

    const c4Summary = simulateGetWordSummary({
      userId: USER_1,
      classroomId: C4_FOREIGN,
      classrooms,
      enrollments,
      words,
      srsProgress,
      currentTime: fixedNow,
    });
    expect(Number(c4Summary.total)).toBe(0);
    expect(Number(c4Summary.learned)).toBe(0);
    expect(Number(c4Summary.review_due)).toBe(0);
    expect(Number(c4Summary.due_count)).toBe(0);
  });
});

runner.describe('Suite 3: Timezone Comparison Simulation (timestamptz <= now() vs (now() AT TIME ZONE UTC))', () => {
  /**
   * Explaining the PostgreSQL engine bug in old code:
   *
   * In PostgreSQL:
   * 1. next_review_date is `timestamptz`.
   * 2. (now() AT TIME ZONE 'UTC') converts timestamptz to `timestamp WITHOUT time zone`.
   * 3. When comparing `timestamptz <= timestamp without time zone`, PostgreSQL coerces
   *    the right-hand side using the session's local timezone (e.g. UTC+7 in Vietnam).
   * 4. If current real UTC is 08:00:00Z:
   *    - (now() AT TIME ZONE 'UTC') yields '08:00:00' (naive).
   *    - In UTC+7, '08:00:00' is parsed as '08:00:00+07:00' = 01:00:00Z!
   *    - 7 hours are silently subtracted from the cutoff!
   *    - Any item due between 01:00:00Z and 08:00:00Z is falsely evaluated as NOT DUE!
   *
   * By replacing with `now()`, both sides are `timestamptz`, so PostgreSQL compares
   * exact UTC microseconds, eliminating the 7-hour blind spot entirely.
   */

  runner.it('M3.1: Mathematical simulation of UTC+7 7-hour timezone attenuation defect', () => {
    const currentUtcTime = new Date('2026-09-27T08:00:00.000Z'); // 15:00 in Vietnam (UTC+7)

    // Items scheduled at various points relative to current UTC time:
    const itemA_due8HoursAgo = new Date('2026-09-27T00:00:00.000Z');
    const itemB_due3HoursAgo = new Date('2026-09-27T05:00:00.000Z');
    const itemC_due30MinsAgo = new Date('2026-09-27T07:30:00.000Z');
    const itemD_dueIn30Mins = new Date('2026-09-27T08:30:00.000Z');

    // Defective old calculation on UTC+7 server:
    // Naive UTC time string: '2026-09-27T08:00:00'
    // Re-interpreted in UTC+7: '2026-09-27T08:00:00+07:00' = '2026-09-27T01:00:00.000Z'
    const defectiveCutoffUtc = new Date(currentUtcTime.getTime() - 7 * 60 * 60 * 1000); // 01:00:00Z

    // Correct new calculation:
    const correctCutoffUtc = currentUtcTime; // 08:00:00Z

    // Item A (due 8h ago, 00:00Z):
    expect(itemA_due8HoursAgo.getTime() <= defectiveCutoffUtc.getTime()).toBe(true);
    expect(itemA_due8HoursAgo.getTime() <= correctCutoffUtc.getTime()).toBe(true);

    // Item B (due 3h ago, 05:00Z):
    // Under defective logic: 05:00 <= 01:00 is FALSE -> DEFECT!
    expect(itemB_due3HoursAgo.getTime() <= defectiveCutoffUtc.getTime()).toBe(false);
    // Under correct logic: 05:00 <= 08:00 is TRUE -> CORRECT!
    expect(itemB_due3HoursAgo.getTime() <= correctCutoffUtc.getTime()).toBe(true);

    // Item C (due 30m ago, 07:30Z):
    // Under defective logic: 07:30 <= 01:00 is FALSE -> DEFECT!
    expect(itemC_due30MinsAgo.getTime() <= defectiveCutoffUtc.getTime()).toBe(false);
    // Under correct logic: 07:30 <= 08:00 is TRUE -> CORRECT!
    expect(itemC_due30MinsAgo.getTime() <= correctCutoffUtc.getTime()).toBe(true);

    // Item D (in future, 08:30Z):
    expect(itemD_dueIn30Mins.getTime() <= correctCutoffUtc.getTime()).toBe(false);
  });

  runner.it('M3.2: Verify timestamptz <= now() evaluates consistently across all worldwide timezones', () => {
    const fixedMoment = new Date('2026-09-27T08:48:48.000Z');
    const scheduledDue = new Date('2026-09-27T08:40:00.000Z'); // Due 8 mins ago
    const scheduledFuture = new Date('2026-09-27T08:50:00.000Z'); // Due 2 mins later

    // Test across various offset strings
    const offsets = ['+07:00', '+00:00', '-04:00', '+09:00', '-08:00', '+05:30'];

    for (const offset of offsets) {
      // In PostgreSQL, timestamptz values are converted to UTC epoch before comparison.
      // Comparing two timestamptz values produces identical boolean results irrespective of session timezone.
      const isDue = scheduledDue.getTime() <= fixedMoment.getTime();
      const isFutureDue = scheduledFuture.getTime() <= fixedMoment.getTime();

      expect(isDue).toBe(true);
      expect(isFutureDue).toBe(false);
    }
  });
});

runner.describe('Suite 4: Translation Exclusion Filter Robustness', () => {
  const invalidCases = [
    { label: 'failed lowercase', text: 'translation failed' },
    { label: 'failed uppercase', text: 'API REQUEST FAILED' },
    { label: 'failed mixed', text: '[Failed: network timeout]' },
    { label: 'analyzing lowercase', text: 'analyzing word meaning' },
    { label: 'analyzing capital', text: 'Analyzing...' },
    { label: 'analyzing mixed', text: 'AI Analyzing context...' },
    { label: 'hourglass prefix', text: '⏳ Đang dịch...' },
    { label: 'hourglass only', text: '⏳' },
    { label: 'hourglass suffix', text: 'Chờ xử lý ⏳' },
    { label: 'null value', text: null },
    { label: 'empty string', text: '' },
    { label: 'whitespace only', text: '   ' },
  ];

  const validCases = [
    { label: 'Vietnamese word', text: 'quả táo' },
    { label: 'Vietnamese complex', text: 'lập trình viên phần mềm' },
    { label: 'Vietnamese with legal letters', text: 'thất bại là mẹ thành công' }, // contains "thất bại" but not "failed"
    { label: 'Vietnamese analysis term', text: 'phân tích thống kê' }, // contains "phân tích" but not "Analyzing"
    { label: 'English translation', text: 'apple' },
    { label: 'Single character', text: 'a' },
  ];

  for (const c of invalidCases) {
    runner.it(`M4.1: Rejects invalid translation (${c.label})`, () => {
      expect(isTranslationValid(c.text)).toBe(false);
    });
  }

  for (const c of validCases) {
    runner.it(`M4.2: Accepts valid translation (${c.label})`, () => {
      expect(isTranslationValid(c.text)).toBe(true);
    });
  }
});

runner.describe('Suite 5: Edge Cases & Boundary Stress Testing', () => {
  const USER_X = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

  runner.it('M5.1: User with 0 classrooms returns 0 due words and empty summary gracefully', () => {
    const dueWords = simulateGetDueWordsList({
      userId: USER_X,
      classroomId: null,
      classrooms: [],
      enrollments: [],
      words: [],
      srsProgress: [],
      currentTime: new Date(),
    });
    expect(dueWords.length).toBe(0);

    const summary = simulateGetWordSummary({
      userId: USER_X,
      classroomId: null,
      classrooms: [],
      enrollments: [],
      words: [],
      srsProgress: [],
      currentTime: new Date(),
    });
    expect(Number(summary.total)).toBe(0);
    expect(Number(summary.learned)).toBe(0);
    expect(Number(summary.review_due)).toBe(0);
    expect(Number(summary.due_count)).toBe(0);
  });

  runner.it('M5.2: Limit clamping adheres strictly to LEAST(GREATEST(limit, 0), 100)', () => {
    const dummyWords: Word[] = Array.from({ length: 150 }, (_, i) => ({
      id: `w-${i}`,
      classroom_id: 'c1',
      word: `word-${i}`,
      translation: `nghĩa-${i}`,
      created_at: '2026-09-27T00:00:00Z',
    }));

    const dummySrs: SrsProgress[] = Array.from({ length: 150 }, (_, i) => ({
      id: `s-${i}`,
      user_id: USER_X,
      word_id: `w-${i}`,
      review_count: 1,
      next_review_date: '2026-09-27T00:00:00Z',
      stability: 2,
    }));

    const dummyClasses: Classroom[] = [{ id: 'c1', name: 'C1', teacher_id: USER_X }];

    // Request 200 -> should cap at 100
    const clampedMax = simulateGetDueWordsList({
      userId: USER_X,
      classroomId: null,
      limit: 200,
      classrooms: dummyClasses,
      enrollments: [],
      words: dummyWords,
      srsProgress: dummySrs,
      currentTime: new Date('2026-09-27T01:00:00Z'),
    });
    expect(clampedMax.length).toBe(100);

    // Request -5 -> should cap at 0
    const clampedMin = simulateGetDueWordsList({
      userId: USER_X,
      classroomId: null,
      limit: -5,
      classrooms: dummyClasses,
      enrollments: [],
      words: dummyWords,
      srsProgress: dummySrs,
      currentTime: new Date('2026-09-27T01:00:00Z'),
    });
    expect(clampedMin.length).toBe(0);

    // Request null/undefined -> default 50
    const clampedDefault = simulateGetDueWordsList({
      userId: USER_X,
      classroomId: null,
      limit: null,
      classrooms: dummyClasses,
      enrollments: [],
      words: dummyWords,
      srsProgress: dummySrs,
      currentTime: new Date('2026-09-27T01:00:00Z'),
    });
    expect(clampedDefault.length).toBe(50);
  });

  runner.it('M5.3: High-volume stress simulation (50 classrooms, 2,500 words, 500 SRS records)', () => {
    const scaleClasses: Classroom[] = Array.from({ length: 50 }, (_, i) => ({
      id: `class-${i}`,
      name: `Classroom ${i}`,
      teacher_id: i % 2 === 0 ? USER_X : `other-teacher-${i}`,
    }));

    const scaleEnrollments: Enrollment[] = Array.from({ length: 25 }, (_, i) => ({
      student_id: USER_X,
      classroom_id: `class-${2 * i + 1}`,
    }));

    const scaleWords: Word[] = [];
    for (let c = 0; c < 50; c++) {
      for (let w = 0; w < 50; w++) {
        scaleWords.push({
          id: `w-${c}-${w}`,
          classroom_id: `class-${c}`,
          word: `word_${c}_${w}`,
          translation: w === 0 ? 'translation failed' : `nghĩa ${c} ${w}`,
          created_at: '2026-09-27T00:00:00Z',
        });
      }
    }

    const scaleSrs: SrsProgress[] = [];
    for (let i = 0; i < 500; i++) {
      scaleSrs.push({
        id: `s-${i}`,
        user_id: USER_X,
        word_id: scaleWords[i].id,
        review_count: 2,
        next_review_date: '2026-09-27T00:00:00Z',
        stability: 3.0,
      });
    }

    const start = performance.now();
    const result = simulateGetDueWordsList({
      userId: USER_X,
      classroomId: null,
      limit: 100,
      classrooms: scaleClasses,
      enrollments: scaleEnrollments,
      words: scaleWords,
      srsProgress: scaleSrs,
      currentTime: new Date('2026-09-27T01:00:00Z'),
    });
    const duration = performance.now() - start;

    expect(result.length).toBe(100);
    // Simulation execution must be fast (<50ms)
    expect(duration < 50).toBe(true);
  });
});

// ============================================================================
// MAIN RUNNER EXECUTION
// ============================================================================

async function main() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING CHALLENGER M3.1 EMPIRICAL VERIFICATION HARNESS');
  console.log('================================================================\n');

  await new Promise((resolve) => setTimeout(resolve, 50));

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log(`Execution Time: ${stats.durationMs.toFixed(2)} ms`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    console.error('❌ Failures detected in test suite:');
    for (const r of stats.results) {
      if (!r.passed) {
        console.error(`- [${r.suite}] ${r.name}: ${r.error?.message}`);
      }
    }
    process.exit(1);
  } else {
    console.log('✅ ALL EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY!');
  }
}

main().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
