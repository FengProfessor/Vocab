import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Types & Interface Contracts
// =============================================================================

/**
 * Universal student activity summary across all 9 learning modules.
 * Standard contract defined in PROJECT.md § 1.
 */
export interface StudentActivitySummary {
  userId: string;
  trueLastActive: string | null; // ISO timestamp
  lastSrsAt: string | null;
  lastQuizAt: string | null;
  lastWordAt: string | null;
  lastGrammarAt: string | null;
  lastReadingAt: string | null;
  lastToeicAt: string | null;
  lastAssessmentAt: string | null;
  lastVocabPackAt: string | null;
  lastStreakDate: string | null; // YYYY-MM-DD
  wordCount: number;
  totalActivitiesCount: number;
}

/**
 * CRM multi-skill customer statistics contract defined in PROJECT.md § 3.
 */
export interface MultiSkillStats {
  vocab: {
    wordsSaved: number;
    cardsLearned: number;
    reviewsTotal: number;
    lapsesTotal: number;
    dueCount: number;
    lastActive: string | null;
  };
  grammar: {
    lessonsCompleted: number;
    microLessonsPassed: number;
    lastActive: string | null;
  };
  reading: {
    articlesRead: number;
    lastActive: string | null;
  };
  toeic: {
    questionsAnswered: number;
    accuracyPercent: number;
    lastActive: string | null;
  };
  gamification: {
    streakDays: number;
    lastActiveDate: string | null;
  };
  trueLastActive: string | null;
  lifecycle: 'new' | 'active' | 'at_risk' | 'churned';
}

/**
 * Pedagogical status classification for Teacher Dashboard.
 */
export type PedagogicalStatusKey = 'dormant' | 'at_risk' | 'cramming' | 'rising_star' | 'normal';

export interface PedagogicalStatus {
  key: PedagogicalStatusKey;
  dot: string;
  label: string;
  tag: string;
  title: string;
  advice: string;
  badgeClass: string;
  color: string;
}

export interface GetActivityOptions {
  bypassCache?: boolean;
  ttlMs?: number;
}

// =============================================================================
// Cache Configuration (In-Memory SWR Caching — GEMINI.md compliance)
// =============================================================================

interface CacheEntry {
  data: StudentActivitySummary;
  cachedAt: number;
  expiresAt: number;
  staleUntil: number;
}

const DEFAULT_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes fresh cache (<5ms warm response)
const DEFAULT_CACHE_STALE_MS = 30 * 60 * 1000; // 30 minutes stale window
const MAX_CACHE_ENTRIES = 5000;

const activityCache = new Map<string, CacheEntry>();

/**
 * Clears the in-memory universal activity cache.
 */
export function clearUniversalActivityCache(): void {
  activityCache.clear();
}

/**
 * Returns cache statistics for telemetry and diagnostics.
 */
export function getUniversalActivityCacheStats(): { size: number; entries: string[] } {
  return {
    size: activityCache.size,
    entries: Array.from(activityCache.keys()),
  };
}

function getCachedSummary(userId: string, now: number): StudentActivitySummary | null {
  const entry = activityCache.get(userId);
  if (!entry) return null;
  // If within fresh window
  if (now < entry.expiresAt) {
    return entry.data;
  }
  // If past stale window, purge
  if (now > entry.staleUntil) {
    activityCache.delete(userId);
    return null;
  }
  // Within stale window: return stale copy
  return entry.data;
}

function setCachedSummary(
  userId: string,
  summary: StudentActivitySummary,
  now: number,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): void {
  if (activityCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest 20% entries if limit exceeded
    const keysToDelete = Array.from(activityCache.keys()).slice(0, Math.floor(MAX_CACHE_ENTRIES * 0.2));
    for (const key of keysToDelete) {
      activityCache.delete(key);
    }
  }

  activityCache.set(userId, {
    data: summary,
    cachedAt: now,
    expiresAt: now + ttlMs,
    staleUntil: now + DEFAULT_CACHE_STALE_MS,
  });
}

// =============================================================================
// Pure Mathematical & Pedagogical Calculation Helpers
// =============================================================================

/**
 * Computes the true maximum last active timestamp across any number of timestamp
 * strings or null/undefined values. Disregards NULL and invalid dates.
 * Returns an ISO 8601 string or null if all inputs are null/invalid.
 */
export function computeTrueLastActive(
  timestamps: (string | null | undefined)[]
): string | null {
  let maxEpoch = 0;

  for (const ts of timestamps) {
    if (!ts || typeof ts !== 'string') continue;
    const epoch = new Date(ts).getTime();
    if (!isNaN(epoch) && epoch > maxEpoch) {
      maxEpoch = epoch;
    }
  }

  return maxEpoch > 0 ? new Date(maxEpoch).toISOString() : null;
}

/**
 * Calculates pedagogical status strictly based on trueLastActive and learning telemetry.
 * Prevents active TOEIC/Grammar/Reading learners from being falsely flagged as dormant.
 */
export function calculatePedagogicalStatus(params: {
  trueLastActive: string | null;
  vms?: number | null;
  wordsReviewed?: number | null;
  lcs?: number | null;
  avgQuizAccuracy?: number | null;
  quizzesTaken?: number | null;
  now?: number;
}): PedagogicalStatus {
  const { trueLastActive, vms = 0, wordsReviewed = 0, lcs = 0, avgQuizAccuracy = 0, quizzesTaken = 0 } = params;
  const now = params.now ?? Date.now();

  // 1. Dormant: No activity for > 3 days (3 * 86,400,000 ms)
  const isDormant = Boolean(
    trueLastActive && now - new Date(trueLastActive).getTime() > 3 * 86_400_000
  );
  if (isDormant) {
    return {
      key: 'dormant',
      dot: '💤',
      label: 'Vắng mặt',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      tag: 'DORMANT',
      title: 'Học sinh ngừng hoạt động > 3 ngày',
      advice: 'Cần gửi tin nhắn nhắc nhở ngay để học sinh không bị rơi rụng từ vựng theo đường cong lãng quên Ebbinghaus.',
    };
  }

  // 2. At Risk: VMS < 30% with > 10 words reviewed
  const isAtRisk = Boolean((vms ?? 0) < 30 && (wordsReviewed ?? 0) > 10);
  if (isAtRisk) {
    return {
      key: 'at_risk',
      dot: '🔴',
      label: 'Cần củng cố',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      tag: 'AT RISK',
      title: 'Gặp khó khăn trong việc ghi nhớ',
      advice: 'Độ bền ghi nhớ (VMS) dưới 30% dù đã học nhiều từ. Hãy giao bài tập củng cố (Drill) các từ hay quên.',
    };
  }

  // 3. Cramming: Low consistency (LCS < 30%) but high quiz accuracy (> 80%) across > 2 quizzes
  const isCramming = Boolean(
    (lcs ?? 0) < 30 && (avgQuizAccuracy ?? 0) > 0.8 && (quizzesTaken ?? 0) > 2
  );
  if (isCramming) {
    return {
      key: 'cramming',
      dot: '🟡',
      label: 'Học dồn',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      tag: 'CRAMMING',
      title: 'Học sinh có dấu hiệu học dồn',
      advice: 'Điểm quiz cao nhưng tính đều đặn thấp. Học dồn chỉ nhớ ngắn hạn; cần hướng dẫn học sinh phân bổ 5-10 phút mỗi ngày.',
    };
  }

  // 4. Rising Star: High consistency (LCS > 80%) and high quiz accuracy (> 80%)
  const isRisingStar = Boolean((lcs ?? 0) > 80 && (avgQuizAccuracy ?? 0) > 0.8);
  if (isRisingStar) {
    return {
      key: 'rising_star',
      dot: '🟢',
      label: 'Tích cực',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      tag: 'RISING STAR',
      title: 'Tiến độ học xuất sắc & đều đặn',
      advice: 'Học sinh duy trì tính kỷ luật rất tốt (LCS > 80% & điểm quiz cao). Nên khen ngợi kịp thời và mở rộng danh mục từ vựng.',
    };
  }

  // 5. Normal
  return {
    key: 'normal',
    dot: '⚪',
    label: 'Bình thường',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    tag: 'NORMAL',
    title: 'Tiến độ học tập ổn định',
    advice: 'Học sinh duy trì học tập bình thường. Khuyến khích tiếp tục giữ vững nhịp độ ôn tập hàng ngày.',
  };
}

/**
 * Calculates accurate customer lifecycle based on total trueLastActive across all 9 sources.
 */
export function calculateCustomerLifecycle(params: {
  createdAt: string;
  trueLastActive: string | null;
  now?: number;
}): 'new' | 'active' | 'at_risk' | 'churned' {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = params.now ?? Date.now();
  const createdEpoch = new Date(params.createdAt).getTime();

  // If user registered within last 7 days
  if (now - createdEpoch <= 7 * DAY_MS) {
    return 'new';
  }

  const lastActiveEpoch = params.trueLastActive ? new Date(params.trueLastActive).getTime() : 0;
  const daysSinceActive = lastActiveEpoch > 0 ? (now - lastActiveEpoch) / DAY_MS : Infinity;

  if (daysSinceActive <= 7) return 'active';
  if (daysSinceActive <= 30) return 'at_risk';
  return 'churned';
}

// =============================================================================
// Helper Client Resolver
// =============================================================================

async function resolveSupabaseClient(providedClient?: SupabaseClient): Promise<SupabaseClient> {
  if (providedClient) return providedClient;

  if (typeof window === 'undefined') {
    try {
      const { createServiceClient } = await import('@/lib/supabase-server');
      return createServiceClient() as unknown as SupabaseClient;
    } catch {
      // Fallback if environment variables are not available
    }
  }

  const { supabase } = await import('@/lib/supabase');
  return supabase as unknown as SupabaseClient;
}

// =============================================================================
// Universal Activity Fetching Engine (RPC with Concurrent REST Fallback)
// =============================================================================

interface RpcStudentActivityRow {
  student_id: string;
  true_last_active?: string | null;
  true_last_active_at?: string | null;
  last_srs_at?: string | null;
  last_quiz_at?: string | null;
  last_word_at?: string | null;
  last_grammar_at?: string | null;
  last_reading_at?: string | null;
  last_toeic_at?: string | null;
  last_assessment_at?: string | null;
  last_vocab_pack_at?: string | null;
  last_streak_at?: string | null;
  last_streak_date?: string | null;
  word_count?: number | string | null;
  total_activities_count?: number | string | null;
}

/**
 * Fallback executor when get_students_activity_summary RPC is unavailable.
 * Executes concurrent queries across all 9 activity tables via Promise.all.
 */
async function executeConcurrentActivityFallback(
  studentIds: string[],
  client: SupabaseClient
): Promise<Map<string, StudentActivitySummary>> {
  const result = new Map<string, StudentActivitySummary>();
  if (studentIds.length === 0) return result;

  // Initialize summaries
  for (const id of studentIds) {
    result.set(id, {
      userId: id,
      trueLastActive: null,
      lastSrsAt: null,
      lastQuizAt: null,
      lastWordAt: null,
      lastGrammarAt: null,
      lastReadingAt: null,
      lastToeicAt: null,
      lastAssessmentAt: null,
      lastVocabPackAt: null,
      lastStreakDate: null,
      wordCount: 0,
      totalActivitiesCount: 0,
    });
  }

  // Concurrent Promise.all querying all 9 activity domains in parallel
  const [
    srsRes,
    quizRes,
    wordsRes,
    grammarRes,
    grammarMicroRes,
    readingRes,
    toeicRes,
    assessmentRes,
    vocabPackRes,
    gamificationRes,
  ] = await Promise.all([
    // 1. SRS progress
    client
      .from('srs_progress')
      .select('user_id, last_reviewed_at')
      .in('user_id', studentIds)
      .not('last_reviewed_at', 'is', null),
    // 2. Quizzes
    client
      .from('quiz_results')
      .select('user_id, completed_at')
      .in('user_id', studentIds)
      .not('completed_at', 'is', null),
    // 3. Words added
    client
      .from('words')
      .select('added_by, created_at')
      .in('added_by', studentIds),
    // 4a. Grammar progress
    client
      .from('grammar_progress')
      .select('user_id, last_reviewed_at')
      .in('user_id', studentIds)
      .not('last_reviewed_at', 'is', null),
    // 4b. Grammar micro progress
    client
      .from('grammar_micro_progress')
      .select('user_id, updated_at')
      .in('user_id', studentIds)
      .not('updated_at', 'is', null),
    // 5. Daily reading completions
    client
      .from('daily_reading_completions')
      .select('user_id, completed_at')
      .in('user_id', studentIds)
      .not('completed_at', 'is', null),
    // 6. TOEIC questions
    client
      .from('user_toeic_question_history')
      .select('user_id, last_answered_at')
      .in('user_id', studentIds),
    // 7. Roadmap assessments
    client
      .from('user_roadmap_assessments')
      .select('user_id, created_at')
      .in('user_id', studentIds),
    // 8. Vocab packs
    client
      .from('user_vocab_packs')
      .select('user_id, last_studied_at')
      .in('user_id', studentIds)
      .not('last_studied_at', 'is', null),
    // 9. Gamification streaks
    client
      .from('user_gamification')
      .select('user_id, last_active_date')
      .in('user_id', studentIds)
      .not('last_active_date', 'is', null),
  ]);

  // Helper to record latest timestamp and activity count
  const bumpMax = (
    currentMax: string | null,
    candidate: string | null | undefined
  ): string | null => {
    if (!candidate) return currentMax;
    if (!currentMax) return candidate;
    return new Date(candidate).getTime() > new Date(currentMax).getTime() ? candidate : currentMax;
  };

  // 1. Process SRS
  if (srsRes.data) {
    for (const r of srsRes.data as { user_id: string; last_reviewed_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastSrsAt = bumpMax(summary.lastSrsAt, r.last_reviewed_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 2. Process Quizzes
  if (quizRes.data) {
    for (const r of quizRes.data as { user_id: string; completed_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastQuizAt = bumpMax(summary.lastQuizAt, r.completed_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 3. Process Words
  if (wordsRes.data) {
    for (const r of wordsRes.data as { added_by: string; created_at: string | null }[]) {
      const summary = result.get(r.added_by);
      if (summary) {
        summary.lastWordAt = bumpMax(summary.lastWordAt, r.created_at);
        summary.wordCount++;
        summary.totalActivitiesCount++;
      }
    }
  }

  // 4a. Process Grammar
  if (grammarRes.data) {
    for (const r of grammarRes.data as { user_id: string; last_reviewed_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastGrammarAt = bumpMax(summary.lastGrammarAt, r.last_reviewed_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 4b. Process Grammar Micro
  if (grammarMicroRes.data) {
    for (const r of grammarMicroRes.data as { user_id: string; updated_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastGrammarAt = bumpMax(summary.lastGrammarAt, r.updated_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 5. Process Daily Reading
  if (readingRes.data) {
    for (const r of readingRes.data as { user_id: string; completed_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastReadingAt = bumpMax(summary.lastReadingAt, r.completed_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 6. Process TOEIC
  if (toeicRes.data) {
    for (const r of toeicRes.data as { user_id: string; last_answered_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastToeicAt = bumpMax(summary.lastToeicAt, r.last_answered_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 7. Process Assessments
  if (assessmentRes.data) {
    for (const r of assessmentRes.data as { user_id: string; created_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastAssessmentAt = bumpMax(summary.lastAssessmentAt, r.created_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 8. Process Vocab Packs
  if (vocabPackRes.data) {
    for (const r of vocabPackRes.data as { user_id: string; last_studied_at: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary) {
        summary.lastVocabPackAt = bumpMax(summary.lastVocabPackAt, r.last_studied_at);
        summary.totalActivitiesCount++;
      }
    }
  }

  // 9. Process Gamification
  if (gamificationRes.data) {
    for (const r of gamificationRes.data as { user_id: string; last_active_date: string | null }[]) {
      const summary = result.get(r.user_id);
      if (summary && r.last_active_date) {
        summary.lastStreakDate = r.last_active_date;
      }
    }
  }

  // Finalize trueLastActive for each student
  for (const [, summary] of result) {
    // Gamification date string formatted as UTC timestamp if present
    const streakUtcTimestamp = summary.lastStreakDate
      ? new Date(`${summary.lastStreakDate}T00:00:00.000Z`).toISOString()
      : null;

    summary.trueLastActive = computeTrueLastActive([
      summary.lastSrsAt,
      summary.lastQuizAt,
      summary.lastWordAt,
      summary.lastGrammarAt,
      summary.lastReadingAt,
      summary.lastToeicAt,
      summary.lastAssessmentAt,
      summary.lastVocabPackAt,
      streakUtcTimestamp,
    ]);
  }

  return result;
}

/**
 * Universal multi-skill student activity batch query engine.
 *
 * 1. Checks in-memory SWR cache (<5ms warm cache response).
 * 2. Attempts to query fast PostgreSQL RPC get_students_activity_summary.
 * 3. Gracefully falls back to concurrent Promise.all pipeline if RPC fails or is missing.
 * 4. Calculates trueLastActive via Math.max across all 9 activity domains.
 */
export async function getBatchStudentActivity(
  studentIds: string[],
  supabaseClient?: SupabaseClient,
  options?: GetActivityOptions
): Promise<Map<string, StudentActivitySummary>> {
  const result = new Map<string, StudentActivitySummary>();
  if (!studentIds || studentIds.length === 0) return result;

  const uniqueIds = Array.from(new Set(studentIds)).filter(Boolean);
  if (uniqueIds.length === 0) return result;

  const now = Date.now();
  const neededIds: string[] = [];

  // Check cache unless explicitly bypassed
  if (!options?.bypassCache) {
    for (const id of uniqueIds) {
      const cached = getCachedSummary(id, now);
      if (cached) {
        result.set(id, cached);
      } else {
        neededIds.push(id);
      }
    }

    // All requested students are fresh in warm cache!
    if (neededIds.length === 0) {
      return result;
    }
  } else {
    neededIds.push(...uniqueIds);
  }

  const client = await resolveSupabaseClient(supabaseClient);
  let fetchedMap: Map<string, StudentActivitySummary>;

  try {
    // Attempt Engine A: Dedicated PostgreSQL RPC
    const { data: rpcRows, error: rpcError } = await client.rpc(
      'get_students_activity_summary',
      { p_student_ids: neededIds }
    );

    if (rpcError || !Array.isArray(rpcRows)) {
      // RPC not deployed or errored -> Fall back to concurrent Promise.all pipeline
      fetchedMap = await executeConcurrentActivityFallback(neededIds, client);
    } else {
      // Map RPC rows
      fetchedMap = new Map<string, StudentActivitySummary>();
      for (const row of rpcRows as RpcStudentActivityRow[]) {
        const streakUtcTimestamp = row.last_streak_date
          ? new Date(`${row.last_streak_date}T00:00:00.000Z`).toISOString()
          : row.last_streak_at ?? null;

        const trueActive =
          row.true_last_active_at ||
          row.true_last_active ||
          computeTrueLastActive([
            row.last_srs_at,
            row.last_quiz_at,
            row.last_word_at,
            row.last_grammar_at,
            row.last_reading_at,
            row.last_toeic_at,
            row.last_assessment_at,
            row.last_vocab_pack_at,
            streakUtcTimestamp,
          ]);

        const summary: StudentActivitySummary = {
          userId: row.student_id,
          trueLastActive: trueActive,
          lastSrsAt: row.last_srs_at ?? null,
          lastQuizAt: row.last_quiz_at ?? null,
          lastWordAt: row.last_word_at ?? null,
          lastGrammarAt: row.last_grammar_at ?? null,
          lastReadingAt: row.last_reading_at ?? null,
          lastToeicAt: row.last_toeic_at ?? null,
          lastAssessmentAt: row.last_assessment_at ?? null,
          lastVocabPackAt: row.last_vocab_pack_at ?? null,
          lastStreakDate: row.last_streak_date ?? null,
          wordCount: Number(row.word_count || 0),
          totalActivitiesCount: Number(row.total_activities_count || 0),
        };

        fetchedMap.set(row.student_id, summary);
      }

      // Ensure every requested ID has an entry even if not found in DB
      for (const id of neededIds) {
        if (!fetchedMap.has(id)) {
          fetchedMap.set(id, {
            userId: id,
            trueLastActive: null,
            lastSrsAt: null,
            lastQuizAt: null,
            lastWordAt: null,
            lastGrammarAt: null,
            lastReadingAt: null,
            lastToeicAt: null,
            lastAssessmentAt: null,
            lastVocabPackAt: null,
            lastStreakDate: null,
            wordCount: 0,
            totalActivitiesCount: 0,
          });
        }
      }
    }
  } catch {
    // Engine B fallback on unhandled error
    fetchedMap = await executeConcurrentActivityFallback(neededIds, client);
  }

  // Populate cache and assemble final result
  for (const [id, summary] of fetchedMap) {
    setCachedSummary(id, summary, now, options?.ttlMs ?? DEFAULT_CACHE_TTL_MS);
    result.set(id, summary);
  }

  return result;
}

/**
 * Convenience helper to fetch universal activity for a single student.
 */
export async function getStudentActivity(
  studentId: string,
  supabaseClient?: SupabaseClient,
  options?: GetActivityOptions
): Promise<StudentActivitySummary | null> {
  const map = await getBatchStudentActivity([studentId], supabaseClient, options);
  return map.get(studentId) ?? null;
}
