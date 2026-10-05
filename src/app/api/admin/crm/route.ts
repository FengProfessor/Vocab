import { sessionErrorResponse } from '@/lib/session-response';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorized, safeErrorResponse, getAdminEmails } from '@/lib/api-security';
import type { MultiSkillStats } from '@/lib/activity/universal-activity';

export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;
const PAGE = 1000;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 phút fresh cache
const CACHE_STALE_MS = 30 * 60 * 1000; // 30 phút stale-while-revalidate

type ProfileRow = {
  id: string; email: string; full_name: string | null; role: string;
  created_at: string; plan: string | null; plan_expires_at: string | null;
};
type OrderRow = { user_id: string | null; amount: number; status: string; paid_at: string | null };
type GroupRow = { id: string; owner_id: string; status: string };
type MemberRow = { group_id: string; user_id: string };
type ClassroomRow = { id: string; teacher_id: string };
type WordRow = { classroom_id: string; created_at: string };
type QuizRow = { user_id: string; completed_at: string };
type EnrollRow = { student_id: string };
type SrsRow = {
  user_id: string;
  review_count: number | null;
  lapses: number | null;
  last_reviewed_at: string | null;
  next_review_date: string | null;
};

type RpcCustomerStats = {
  user_id: string;
  word_count: number;
  last_word_at: string | null;
  learned_count: number;
  review_total: number;
  lapses_total: number;
  last_reviewed_at: string | null;
  due_count: number;
  quiz_count: number;
  last_quiz_at: string | null;
  grammar_count?: number;
  last_grammar_at?: string | null;
  reading_count?: number;
  last_reading_at?: string | null;
  toeic_count?: number;
  toeic_correct_count?: number;
  last_toeic_at?: string | null;
  assessment_count?: number;
  last_assessment_at?: string | null;
  vocab_pack_count?: number;
  last_vocab_pack_at?: string | null;
  current_streak?: number;
  last_streak_at?: string | null;
  true_last_active?: string | null;
  true_last_active_at?: string | null;
};

export type CrmSource = 'group_owner' | 'group_member' | 'classroom' | 'teacher' | 'direct';
export type CrmLifecycle = 'new' | 'active' | 'at_risk' | 'churned';

export interface CrmCustomer {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  plan: string;            // effective plan (hết hạn → free)
  rawPlan: string;         // plan ghi trong profiles
  planExpiresAt: string | null;
  paying: boolean;
  source: CrmSource;
  lifecycle: CrmLifecycle;
  lastActive: string | null;
  trueLastActive?: string | null;
  wordCount: number;       // từ đã lưu (added_by hoặc cá nhân)
  learnedCount: number;    // từ đã ôn (srs review_count >= 1)
  reviewTotal: number;     // tổng lượt ôn
  lapsesTotal: number;     // tổng lần quên (Again)
  lastReviewedAt: string | null; // max(last_reviewed_at) — ngày ôn cuối
  dueCount: number;        // số từ đang due (next_review_date <= now)
  quizCount: number;
  totalPaid: number;
  groupId: string | null;
  // Multi-skill telemetry
  grammarCount?: number;
  lastGrammarAt?: string | null;
  readingCount?: number;
  lastReadingAt?: string | null;
  toeicCount?: number;
  toeicCorrectCount?: number;
  lastToeicAt?: string | null;
  toeicAccuracy?: number;
  assessmentCount?: number;
  lastAssessmentAt?: string | null;
  vocabPackCount?: number;
  lastVocabPackAt?: string | null;
  currentStreak?: number;
  lastStreakAt?: string | null;
  lastStreakDate?: string | null;
  multiSkill?: MultiSkillStats;
}

export interface CrmResponseData {
  success: boolean;
  customers: CrmCustomer[];
  funnel: { date: string; count: number }[];
  segments: {
    byPlan: Record<string, number>;
    byRole: Record<string, number>;
    byLifecycle: Record<string, number>;
    bySource: Record<string, number>;
  };
  kpis: {
    totalUsers: number;
    newThisWeek: number;
    payingUsers: number;
    activeUsers: number;
    learners: number;
    churnedUsers: number;
    totalRevenue: number;
    activeGroups: number;
    freeHot150: number;
    freeHot200: number;
    reviewedToday: number;
    withDue: number;
    neverReviewed: number;
  };
  meta: {
    cached: boolean;
    cachedAt: string;
    tookMs: number;
    engine: 'rpc' | 'rest_parallel';
  };
}

type ServiceClient = ReturnType<typeof createServiceClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryBuilder = any;

// ── In-Memory Server SWR Cache ──
let globalCrmCache: {
  data: CrmResponseData;
  timestamp: number;
} | null = null;
let isRevalidating = false;

/**
 * Tải trực tiếp dữ liệu bảng không cần HEAD count request dư thừa:
 * Query ngay 0..PAGE - 1. Nếu bảng < PAGE rows (profiles, orders, groups...),
 * xong ngay trong 1 roundtrip duy nhất (<300ms) thay vì 2 lượt gọi mạng.
 */
async function fetchDirectOrPages<T>(
  supabase: ServiceClient,
  table: string,
  select: string,
  orderCol?: { col: string; asc: boolean },
  filterFn?: (q: QueryBuilder) => QueryBuilder,
): Promise<T[]> {
  let q: QueryBuilder = supabase.from(table).select(select).range(0, PAGE - 1);
  if (orderCol) q = q.order(orderCol.col, { ascending: orderCol.asc });
  if (filterFn) q = filterFn(q);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data || []) as T[];
  if (rows.length < PAGE) {
    return rows;
  }

  let from = PAGE;
  for (;;) {
    let nextQ: QueryBuilder = supabase.from(table).select(select).range(from, from + PAGE - 1);
    if (orderCol) nextQ = nextQ.order(orderCol.col, { ascending: orderCol.asc });
    if (filterFn) nextQ = filterFn(nextQ);
    const { data: nextData, error: nextErr } = await nextQ;
    if (nextErr) throw nextErr;
    const batch = (nextData || []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

/** Fetch tuần tự nhẹ cho các mảng chunks (tránh tạo thêm HEAD count request dư thừa) */
async function fetchAllPages<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await run(from, from + PAGE - 1);
    if (error) throw error;
    const batch = data ?? [];
    out.push(...(batch as T[]));
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

/**
 * Tính toán payload CRM từ dữ liệu thô hoặc kết quả aggregate
 */
function buildCrmPayload(params: {
  profileRows: ProfileRow[];
  orderRows: OrderRow[];
  groupRows: GroupRow[];
  memberRows: MemberRow[];
  enrollRows: EnrollRow[];
  statsMap?: Map<string, RpcCustomerStats>;
  wordCountByUser?: Map<string, number>;
  lastWordByUser?: Map<string, string>;
  lastActiveByUser?: Map<string, number>;
  learnedByUser?: Map<string, number>;
  reviewTotalByUser?: Map<string, number>;
  lapsesByUser?: Map<string, number>;
  lastReviewedByUser?: Map<string, number>;
  dueCountByUser?: Map<string, number>;
  quizCountByUser?: Map<string, number>;
  grammarCountByUser?: Map<string, number>;
  lastGrammarByUser?: Map<string, string>;
  readingCountByUser?: Map<string, number>;
  lastReadingByUser?: Map<string, string>;
  toeicCountByUser?: Map<string, number>;
  toeicCorrectByUser?: Map<string, number>;
  lastToeicByUser?: Map<string, string>;
  assessmentCountByUser?: Map<string, number>;
  lastAssessmentByUser?: Map<string, string>;
  vocabPackCountByUser?: Map<string, number>;
  lastVocabPackByUser?: Map<string, string>;
  streakByUser?: Map<string, number>;
  lastStreakByUser?: Map<string, string>;
  engine: 'rpc' | 'rest_parallel';
  tookMs: number;
}): CrmResponseData {
  const {
    profileRows, orderRows, groupRows, memberRows, enrollRows,
    statsMap, wordCountByUser, lastWordByUser, lastActiveByUser, learnedByUser,
    reviewTotalByUser, lapsesByUser, lastReviewedByUser, dueCountByUser,
    quizCountByUser, grammarCountByUser, lastGrammarByUser,
    readingCountByUser, lastReadingByUser, toeicCountByUser, toeicCorrectByUser,
    lastToeicByUser, assessmentCountByUser, lastAssessmentByUser,
    vocabPackCountByUser, lastVocabPackByUser, streakByUser, lastStreakByUser,
    engine, tookMs,
  } = params;

  // Group role + revenue
  const groupOwners = new Map<string, string>();
  const groupActive = new Set<string>();
  for (const g of groupRows) {
    if (g.status === 'active') { groupOwners.set(g.owner_id, g.id); groupActive.add(g.id); }
  }
  const groupMember = new Map<string, string>();
  for (const m of memberRows) {
    if (groupActive.has(m.group_id)) groupMember.set(m.user_id, m.group_id);
  }
  const enrolledStudents = new Set(enrollRows.map(e => e.student_id));
  const paidByUser = new Map<string, number>();
  for (const o of orderRows) {
    if (o.status === 'paid' && o.user_id) {
      paidByUser.set(o.user_id, (paidByUser.get(o.user_id) ?? 0) + (o.amount || 0));
    }
  }

  const now = Date.now();
  const isFuture = (d: string | null) => !d || new Date(d).getTime() > now;

  const customers: CrmCustomer[] = profileRows.map(p => {
    const rawPlan = p.plan ?? 'free';
    const planActive = rawPlan !== 'free' && isFuture(p.plan_expires_at);
    const effectivePlan = planActive ? rawPlan : 'free';

    let source: CrmSource = 'direct';
    if (groupOwners.has(p.id)) source = 'group_owner';
    else if (groupMember.has(p.id)) source = 'group_member';
    else if (p.role === 'teacher') source = 'teacher';
    else if (enrolledStudents.has(p.id)) source = 'classroom';

    let wordCount = 0;
    let learnedCount = 0;
    let reviewTotal = 0;
    let lapsesTotal = 0;
    let lastReviewedAt: string | null = null;
    let dueCount = 0;
    let quizCount = 0;
    let lastActiveTs = 0;

    let grammarCount = 0;
    let lastGrammarAt: string | null = null;
    let readingCount = 0;
    let lastReadingAt: string | null = null;
    let toeicCount = 0;
    let toeicCorrectCount = 0;
    let lastToeicAt: string | null = null;
    let toeicAccuracy = 0;
    let assessmentCount = 0;
    let lastAssessmentAt: string | null = null;
    let vocabPackCount = 0;
    let lastVocabPackAt: string | null = null;
    let currentStreak = 0;
    let lastStreakAt: string | null = null;
    let lastStreakDate: string | null = null;
    let lastWordAt: string | null = null;

    if (statsMap) {
      const s = statsMap.get(p.id);
      if (s) {
        wordCount = Number(s.word_count || 0);
        lastWordAt = s.last_word_at ?? null;
        learnedCount = Number(s.learned_count || 0);
        reviewTotal = Number(s.review_total || 0);
        lapsesTotal = Number(s.lapses_total || 0);
        lastReviewedAt = s.last_reviewed_at ?? null;
        dueCount = Number(s.due_count || 0);
        quizCount = Number(s.quiz_count || 0);

        grammarCount = Number(s.grammar_count || 0);
        lastGrammarAt = s.last_grammar_at ?? null;

        readingCount = Number(s.reading_count || 0);
        lastReadingAt = s.last_reading_at ?? null;

        toeicCount = Number(s.toeic_count || 0);
        toeicCorrectCount = Number(s.toeic_correct_count || 0);
        lastToeicAt = s.last_toeic_at ?? null;
        toeicAccuracy = toeicCount > 0 ? Math.round((toeicCorrectCount / toeicCount) * 100) : 0;

        assessmentCount = Number(s.assessment_count || 0);
        lastAssessmentAt = s.last_assessment_at ?? null;

        vocabPackCount = Number(s.vocab_pack_count || 0);
        lastVocabPackAt = s.last_vocab_pack_at ?? null;

        currentStreak = Number(s.current_streak || 0);
        lastStreakAt = s.last_streak_at ?? null;
        lastStreakDate = s.last_streak_at ? s.last_streak_at.slice(0, 10) : null;

        const tsWord = s.last_word_at ? new Date(s.last_word_at).getTime() : 0;
        const tsQuiz = s.last_quiz_at ? new Date(s.last_quiz_at).getTime() : 0;
        const tsReview = s.last_reviewed_at ? new Date(s.last_reviewed_at).getTime() : 0;
        const tsGrammar = s.last_grammar_at ? new Date(s.last_grammar_at).getTime() : 0;
        const tsReading = s.last_reading_at ? new Date(s.last_reading_at).getTime() : 0;
        const tsToeic = s.last_toeic_at ? new Date(s.last_toeic_at).getTime() : 0;
        const tsAssessment = s.last_assessment_at ? new Date(s.last_assessment_at).getTime() : 0;
        const tsVocabPack = s.last_vocab_pack_at ? new Date(s.last_vocab_pack_at).getTime() : 0;
        const tsStreak = s.last_streak_at ? new Date(s.last_streak_at).getTime() : 0;

        const trueActiveIso = s.true_last_active_at || s.true_last_active;
        const tsTrue = trueActiveIso ? new Date(trueActiveIso).getTime() : 0;

        lastActiveTs = Math.max(
          tsTrue, tsWord, tsQuiz, tsReview, tsGrammar,
          tsReading, tsToeic, tsAssessment, tsVocabPack, tsStreak
        );
        if (!Number.isFinite(lastActiveTs)) lastActiveTs = 0;
      }
    } else {
      wordCount = wordCountByUser?.get(p.id) ?? 0;
      lastWordAt = lastWordByUser?.get(p.id) ?? null;
      learnedCount = learnedByUser?.get(p.id) ?? 0;
      reviewTotal = reviewTotalByUser?.get(p.id) ?? 0;
      lapsesTotal = lapsesByUser?.get(p.id) ?? 0;
      lastReviewedAt = lastReviewedByUser?.has(p.id)
        ? new Date(lastReviewedByUser.get(p.id)!).toISOString()
        : null;
      dueCount = dueCountByUser?.get(p.id) ?? 0;
      quizCount = quizCountByUser?.get(p.id) ?? 0;

      grammarCount = grammarCountByUser?.get(p.id) ?? 0;
      lastGrammarAt = lastGrammarByUser?.get(p.id) ?? null;

      readingCount = readingCountByUser?.get(p.id) ?? 0;
      lastReadingAt = lastReadingByUser?.get(p.id) ?? null;

      toeicCount = toeicCountByUser?.get(p.id) ?? 0;
      toeicCorrectCount = toeicCorrectByUser?.get(p.id) ?? 0;
      lastToeicAt = lastToeicByUser?.get(p.id) ?? null;
      toeicAccuracy = toeicCount > 0 ? Math.round((toeicCorrectCount / toeicCount) * 100) : 0;

      assessmentCount = assessmentCountByUser?.get(p.id) ?? 0;
      lastAssessmentAt = lastAssessmentByUser?.get(p.id) ?? null;

      vocabPackCount = vocabPackCountByUser?.get(p.id) ?? 0;
      lastVocabPackAt = lastVocabPackByUser?.get(p.id) ?? null;

      currentStreak = streakByUser?.get(p.id) ?? 0;
      lastStreakDate = lastStreakByUser?.get(p.id) ?? null;
      lastStreakAt = lastStreakDate ? `${lastStreakDate}T00:00:00.000Z` : null;

      lastActiveTs = lastActiveByUser?.get(p.id) ?? 0;
      if (!Number.isFinite(lastActiveTs)) lastActiveTs = 0;
    }

    const created = new Date(p.created_at).getTime();
    const daysSinceActive = lastActiveTs > 0 ? (now - lastActiveTs) / DAY : Infinity;
    let lifecycle: CrmLifecycle;
    if (now - created <= 7 * DAY) lifecycle = 'new';
    else if (daysSinceActive <= 7) lifecycle = 'active';
    else if (daysSinceActive <= 30) lifecycle = 'at_risk';
    else lifecycle = 'churned';

    const trueLastActive = lastActiveTs > 0 ? new Date(lastActiveTs).toISOString() : null;

    const multiSkill: MultiSkillStats = {
      vocab: {
        wordsSaved: wordCount,
        cardsLearned: learnedCount,
        reviewsTotal: reviewTotal,
        lapsesTotal: lapsesTotal,
        dueCount,
        lastActive: lastReviewedAt || lastWordAt || null,
      },
      grammar: {
        lessonsCompleted: grammarCount,
        microLessonsPassed: grammarCount,
        lastActive: lastGrammarAt,
      },
      reading: {
        articlesRead: readingCount,
        lastActive: lastReadingAt,
      },
      toeic: {
        questionsAnswered: toeicCount,
        accuracyPercent: toeicAccuracy,
        lastActive: lastToeicAt,
      },
      gamification: {
        streakDays: currentStreak,
        lastActiveDate: lastStreakDate,
      },
      trueLastActive,
      lifecycle,
    };

    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      created_at: p.created_at,
      plan: effectivePlan,
      rawPlan,
      planExpiresAt: p.plan_expires_at,
      paying: effectivePlan !== 'free',
      source,
      lifecycle,
      lastActive: trueLastActive,
      trueLastActive,
      wordCount,
      learnedCount,
      reviewTotal,
      lapsesTotal,
      lastReviewedAt,
      dueCount,
      quizCount,
      totalPaid: paidByUser.get(p.id) ?? 0,
      groupId: groupOwners.get(p.id) ?? groupMember.get(p.id) ?? null,
      grammarCount,
      lastGrammarAt,
      readingCount,
      lastReadingAt,
      toeicCount,
      toeicCorrectCount,
      lastToeicAt,
      toeicAccuracy,
      assessmentCount,
      lastAssessmentAt,
      vocabPackCount,
      lastVocabPackAt,
      currentStreak,
      lastStreakAt,
      lastStreakDate,
      multiSkill,
    };
  });

  // Funnel: signup theo ngày (90 ngày gần nhất)
  const funnelMap = new Map<string, number>();
  const since = now - 90 * DAY;
  for (const p of profileRows) {
    const t = new Date(p.created_at).getTime();
    if (t < since) continue;
    const day = p.created_at.slice(0, 10);
    funnelMap.set(day, (funnelMap.get(day) ?? 0) + 1);
  }
  const funnel = Array.from(funnelMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Segments
  const byPlan = { free: 0, pro: 0, premium: 0 } as Record<string, number>;
  const byRole = { teacher: 0, student: 0 } as Record<string, number>;
  const byLifecycle = { new: 0, active: 0, at_risk: 0, churned: 0 } as Record<string, number>;
  const bySource = { direct: 0, classroom: 0, teacher: 0, group_owner: 0, group_member: 0 } as Record<string, number>;
  for (const c of customers) {
    byPlan[c.plan] = (byPlan[c.plan] ?? 0) + 1;
    byRole[c.role] = (byRole[c.role] ?? 0) + 1;
    byLifecycle[c.lifecycle] = (byLifecycle[c.lifecycle] ?? 0) + 1;
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;
  }

  const weekAgo = now - 7 * DAY;
  const learners = customers.filter(
    c => c.learnedCount > 0 || (c.grammarCount ?? 0) > 0 || (c.readingCount ?? 0) > 0 || (c.toeicCount ?? 0) > 0 || c.quizCount > 0
  ).length;
  const freeHot150 = customers.filter(c => c.plan === 'free' && c.wordCount >= 150).length;
  const freeHot200 = customers.filter(c => c.plan === 'free' && c.wordCount >= 200).length;

  const vnDateKey = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  const todayVN = vnDateKey(new Date(now).toISOString());
  const reviewedToday = customers.filter(
    (c) => c.lastReviewedAt && vnDateKey(c.lastReviewedAt) === todayVN,
  ).length;
  const withDue = customers.filter(c => c.dueCount > 0).length;
  const neverReviewed = customers.filter(c => !c.lastReviewedAt && c.wordCount > 0).length;

  const kpis = {
    totalUsers: customers.length,
    newThisWeek: customers.filter(c => new Date(c.created_at).getTime() >= weekAgo).length,
    payingUsers: customers.filter(c => c.paying).length,
    activeUsers: byLifecycle.active + byLifecycle.new,
    learners,
    churnedUsers: byLifecycle.churned,
    totalRevenue: orderRows.reduce((s, o) => s + (o.status === 'paid' ? (o.amount || 0) : 0), 0),
    activeGroups: groupActive.size,
    freeHot150,
    freeHot200,
    reviewedToday,
    withDue,
    neverReviewed,
  };

  return {
    success: true,
    customers,
    funnel,
    segments: { byPlan, byRole, byLifecycle, bySource },
    kpis,
    meta: {
      cached: false,
      cachedAt: new Date().toISOString(),
      tookMs,
      engine,
    },
  };
}

/**
 * Thực hiện query dữ liệu CRM: Thử Engine RPC trước, nếu chưa có RPC thì dùng Parallel REST.
 */
async function fetchFreshCrmData(supabase: ServiceClient): Promise<CrmResponseData> {
  const t0 = Date.now();
  const nowIso = new Date().toISOString();

  // 1. Chạy song song Engine A (RPC) và các bảng siêu nhẹ (profiles, orders, groups...)
  const [
    rpcResult,
    profileRows,
    orderRows,
    groupRows,
    memberRows,
    enrollRows,
  ] = await Promise.all([
    Promise.resolve(supabase.rpc('get_crm_customer_stats', { p_now: nowIso })).catch((err: unknown) => ({ data: null, error: err })),
    fetchDirectOrPages<ProfileRow>(supabase, 'profiles', 'id, email, full_name, role, created_at, plan, plan_expires_at', { col: 'created_at', asc: false }),
    fetchDirectOrPages<OrderRow>(supabase, 'orders', 'user_id, amount, status, paid_at', { col: 'paid_at', asc: false }),
    fetchDirectOrPages<GroupRow>(supabase, 'groups', 'id, owner_id, status', { col: 'id', asc: true }),
    fetchDirectOrPages<MemberRow>(supabase, 'group_members', 'group_id, user_id', { col: 'group_id', asc: true }),
    fetchDirectOrPages<EnrollRow>(supabase, 'enrollments', 'student_id', { col: 'student_id', asc: true }),
  ]);

  const rpcData = rpcResult && !rpcResult.error && Array.isArray(rpcResult.data)
    ? (rpcResult.data as RpcCustomerStats[])
    : null;

  if (rpcData) {
    const statsMap = new Map<string, RpcCustomerStats>();
    for (const r of rpcData) {
      statsMap.set(r.user_id, r);
    }

    return buildCrmPayload({
      profileRows,
      orderRows,
      groupRows,
      memberRows,
      enrollRows,
      statsMap,
      engine: 'rpc',
      tookMs: Date.now() - t0,
    });
  }

  // 2. Engine B: Fallback REST (chỉ chạy khi RPC không khả dụng)
  // Truy vấn song song tất cả các bảng hoạt động qua Promise.all (GEMINI.md)
  const [
    classroomRows,
    quizRows,
    srsRows,
    grammarRows,
    grammarMicroRows,
    readingRows,
    toeicRows,
    assessmentRows,
    vocabPackRows,
    gamificationRows,
    wordRows,
  ] = await Promise.all([
    fetchDirectOrPages<ClassroomRow>(supabase, 'classrooms', 'id, teacher_id', { col: 'id', asc: true }, (q) => q.eq('name', '__personal__')).catch(() => []),
    fetchDirectOrPages<QuizRow>(supabase, 'quiz_results', 'user_id, completed_at', { col: 'user_id', asc: true }).catch(() => []),
    fetchDirectOrPages<SrsRow>(supabase, 'srs_progress', 'user_id, review_count, lapses, last_reviewed_at, next_review_date', { col: 'user_id', asc: true }).catch(() => []),
    fetchDirectOrPages<{ user_id: string; last_reviewed_at: string | null }>(supabase, 'grammar_progress', 'user_id, last_reviewed_at', { col: 'user_id', asc: true }, (q) => q.not('last_reviewed_at', 'is', null)).catch(() => []),
    fetchDirectOrPages<{ user_id: string; updated_at: string | null }>(supabase, 'grammar_micro_progress', 'user_id, updated_at', { col: 'user_id', asc: true }, (q) => q.not('updated_at', 'is', null)).catch(() => []),
    fetchDirectOrPages<{ user_id: string; completed_at: string | null }>(supabase, 'daily_reading_completions', 'user_id, completed_at', { col: 'user_id', asc: true }, (q) => q.not('completed_at', 'is', null)).catch(() => []),
    fetchDirectOrPages<{ user_id: string; last_answered_at: string | null; is_correct?: boolean }>(supabase, 'user_toeic_question_history', 'user_id, last_answered_at, is_correct', { col: 'user_id', asc: true }).catch(() => []),
    fetchDirectOrPages<{ user_id: string; created_at: string | null }>(supabase, 'user_roadmap_assessments', 'user_id, created_at', { col: 'user_id', asc: true }).catch(() => []),
    fetchDirectOrPages<{ user_id: string; last_studied_at: string | null }>(supabase, 'user_vocab_packs', 'user_id, last_studied_at', { col: 'user_id', asc: true }, (q) => q.not('last_studied_at', 'is', null)).catch(() => []),
    fetchDirectOrPages<{ user_id: string; current_streak?: number; last_active_date: string | null }>(supabase, 'user_gamification', 'user_id, current_streak, last_active_date', { col: 'user_id', asc: true }, (q) => q.not('last_active_date', 'is', null)).catch(() => []),
    fetchDirectOrPages<{ id: string; added_by: string | null; classroom_id: string | null; created_at: string }>(supabase, 'words', 'id, added_by, classroom_id, created_at', { col: 'id', asc: true }).catch(() => []),
  ]);

  const classroomOwner = new Map<string, string>();
  for (const c of classroomRows) {
    classroomOwner.set(c.id, c.teacher_id);
  }

  const wordCountByUser = new Map<string, number>();
  const lastWordByUser = new Map<string, string>();
  const lastActiveByUser = new Map<string, number>();
  const bumpActive = (uid: string, ts: string | null | undefined) => {
    if (!ts) return;
    const t = new Date(ts).getTime();
    if (!Number.isFinite(t)) return;
    if (t > (lastActiveByUser.get(uid) ?? 0)) lastActiveByUser.set(uid, t);
  };

  for (const w of wordRows) {
    const uid = w.added_by || (w.classroom_id ? classroomOwner.get(w.classroom_id) : null);
    if (!uid) continue;
    wordCountByUser.set(uid, (wordCountByUser.get(uid) ?? 0) + 1);
    bumpActive(uid, w.created_at);
    if (w.created_at) {
      const cur = lastWordByUser.get(uid);
      if (!cur || new Date(w.created_at).getTime() > new Date(cur).getTime()) {
        lastWordByUser.set(uid, w.created_at);
      }
    }
  }

  const quizCountByUser = new Map<string, number>();
  for (const q of quizRows) {
    quizCountByUser.set(q.user_id, (quizCountByUser.get(q.user_id) ?? 0) + 1);
    bumpActive(q.user_id, q.completed_at);
  }

  const learnedByUser = new Map<string, number>();
  const reviewTotalByUser = new Map<string, number>();
  const lapsesByUser = new Map<string, number>();
  const lastReviewedByUser = new Map<string, number>();
  const dueCountByUser = new Map<string, number>();
  const nowMs = Date.now();

  for (const s of srsRows) {
    const uid = s.user_id;
    const rc = s.review_count ?? 0;
    const lp = s.lapses ?? 0;
    if (rc >= 1) learnedByUser.set(uid, (learnedByUser.get(uid) ?? 0) + 1);
    if (rc > 0) reviewTotalByUser.set(uid, (reviewTotalByUser.get(uid) ?? 0) + rc);
    if (lp > 0) lapsesByUser.set(uid, (lapsesByUser.get(uid) ?? 0) + lp);
    if (s.last_reviewed_at) {
      const t = new Date(s.last_reviewed_at).getTime();
      if (Number.isFinite(t) && t > (lastReviewedByUser.get(uid) ?? 0)) {
        lastReviewedByUser.set(uid, t);
      }
    }
    if (s.next_review_date) {
      const dueTs = new Date(s.next_review_date).getTime();
      if (Number.isFinite(dueTs) && dueTs <= nowMs) {
        dueCountByUser.set(uid, (dueCountByUser.get(uid) ?? 0) + 1);
      }
    }
    bumpActive(uid, s.last_reviewed_at);
  }

  // Grammar (Master + Micro)
  const grammarCountByUser = new Map<string, number>();
  const lastGrammarByUser = new Map<string, string>();
  for (const g of grammarRows) {
    grammarCountByUser.set(g.user_id, (grammarCountByUser.get(g.user_id) ?? 0) + 1);
    if (g.last_reviewed_at) {
      bumpActive(g.user_id, g.last_reviewed_at);
      const cur = lastGrammarByUser.get(g.user_id);
      if (!cur || new Date(g.last_reviewed_at).getTime() > new Date(cur).getTime()) {
        lastGrammarByUser.set(g.user_id, g.last_reviewed_at);
      }
    }
  }
  for (const gm of grammarMicroRows) {
    grammarCountByUser.set(gm.user_id, (grammarCountByUser.get(gm.user_id) ?? 0) + 1);
    if (gm.updated_at) {
      bumpActive(gm.user_id, gm.updated_at);
      const cur = lastGrammarByUser.get(gm.user_id);
      if (!cur || new Date(gm.updated_at).getTime() > new Date(cur).getTime()) {
        lastGrammarByUser.set(gm.user_id, gm.updated_at);
      }
    }
  }

  // Daily Reading
  const readingCountByUser = new Map<string, number>();
  const lastReadingByUser = new Map<string, string>();
  for (const r of readingRows) {
    readingCountByUser.set(r.user_id, (readingCountByUser.get(r.user_id) ?? 0) + 1);
    if (r.completed_at) {
      bumpActive(r.user_id, r.completed_at);
      const cur = lastReadingByUser.get(r.user_id);
      if (!cur || new Date(r.completed_at).getTime() > new Date(cur).getTime()) {
        lastReadingByUser.set(r.user_id, r.completed_at);
      }
    }
  }

  // TOEIC
  const toeicCountByUser = new Map<string, number>();
  const toeicCorrectByUser = new Map<string, number>();
  const lastToeicByUser = new Map<string, string>();
  for (const t of toeicRows) {
    toeicCountByUser.set(t.user_id, (toeicCountByUser.get(t.user_id) ?? 0) + 1);
    if (t.is_correct) {
      toeicCorrectByUser.set(t.user_id, (toeicCorrectByUser.get(t.user_id) ?? 0) + 1);
    }
    if (t.last_answered_at) {
      bumpActive(t.user_id, t.last_answered_at);
      const cur = lastToeicByUser.get(t.user_id);
      if (!cur || new Date(t.last_answered_at).getTime() > new Date(cur).getTime()) {
        lastToeicByUser.set(t.user_id, t.last_answered_at);
      }
    }
  }

  // Assessments
  const assessmentCountByUser = new Map<string, number>();
  const lastAssessmentByUser = new Map<string, string>();
  for (const a of assessmentRows) {
    assessmentCountByUser.set(a.user_id, (assessmentCountByUser.get(a.user_id) ?? 0) + 1);
    if (a.created_at) {
      bumpActive(a.user_id, a.created_at);
      const cur = lastAssessmentByUser.get(a.user_id);
      if (!cur || new Date(a.created_at).getTime() > new Date(cur).getTime()) {
        lastAssessmentByUser.set(a.user_id, a.created_at);
      }
    }
  }

  // Vocab Packs
  const vocabPackCountByUser = new Map<string, number>();
  const lastVocabPackByUser = new Map<string, string>();
  for (const vp of vocabPackRows) {
    vocabPackCountByUser.set(vp.user_id, (vocabPackCountByUser.get(vp.user_id) ?? 0) + 1);
    if (vp.last_studied_at) {
      bumpActive(vp.user_id, vp.last_studied_at);
      const cur = lastVocabPackByUser.get(vp.user_id);
      if (!cur || new Date(vp.last_studied_at).getTime() > new Date(cur).getTime()) {
        lastVocabPackByUser.set(vp.user_id, vp.last_studied_at);
      }
    }
  }

  // Gamification
  const streakByUser = new Map<string, number>();
  const lastStreakByUser = new Map<string, string>();
  for (const gm of gamificationRows) {
    if (typeof gm.current_streak === 'number') {
      streakByUser.set(gm.user_id, gm.current_streak);
    }
    if (gm.last_active_date) {
      lastStreakByUser.set(gm.user_id, gm.last_active_date);
      bumpActive(gm.user_id, `${gm.last_active_date}T00:00:00.000Z`);
    }
  }

  return buildCrmPayload({
    profileRows,
    orderRows,
    groupRows,
    memberRows,
    enrollRows,
    wordCountByUser,
    lastWordByUser,
    lastActiveByUser,
    learnedByUser,
    reviewTotalByUser,
    lapsesByUser,
    lastReviewedByUser,
    dueCountByUser,
    quizCountByUser,
    grammarCountByUser,
    lastGrammarByUser,
    readingCountByUser,
    lastReadingByUser,
    toeicCountByUser,
    toeicCorrectByUser,
    lastToeicByUser,
    assessmentCountByUser,
    lastAssessmentByUser,
    vocabPackCountByUser,
    lastVocabPackByUser,
    streakByUser,
    lastStreakByUser,
    engine: 'rest_parallel',
    tookMs: Date.now() - t0,
  });
}

/**
 * GET /api/admin/crm
 * CRM khách hàng: mọi user + gói/nguồn/vòng đời/doanh thu + funnel signup + segment.
 * Tối ưu hoá hiệu năng cực hạn với:
 * - Engine A: PostgreSQL RPC (1 query, ~200ms)
 * - Engine B: Concurrent Batch REST Pipeline (fallback song song, tránh bão hoà pool)
 * - In-Memory Stale-While-Revalidate Caching (phản hồi <5ms cho các request kế tiếp)
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase: ServiceClient = createServiceClient();

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', auth.userId)
      .maybeSingle();

    const adminEmails = getAdminEmails();
    const callerEmail = (callerProfile?.email || auth.email || '').toLowerCase().trim();
    const isAdminRole = callerProfile?.role === 'admin';
    const isWhitelisted = Boolean(callerEmail && adminEmails.includes(callerEmail));

    if (!isAdminRole && !isWhitelisted) {
      return NextResponse.json(
        { success: false, error: 'Cần quyền admin (Tài khoản chưa có role admin hoặc email chưa được thêm vào ADMIN_EMAILS)' },
        { status: 403 },
      );
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === '1' || url.searchParams.get('refresh') === 'true';

    const now = Date.now();

    // ── Kiểm tra cache trong bộ nhớ (SWR) ──
    if (!forceRefresh && globalCrmCache) {
      const age = now - globalCrmCache.timestamp;
      // Dữ liệu còn tươi (< 60s): trả về tức thì trong <5ms
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({
          ...globalCrmCache.data,
          meta: {
            ...globalCrmCache.data.meta,
            cached: true,
            cachedAt: new Date(globalCrmCache.timestamp).toISOString(),
            ageMs: age,
          },
        });
      }

      // Dữ liệu cũ nhưng trong hạn Stale-While-Revalidate (< 5 phút):
      // Trả về dữ liệu cũ ngay lập tức, đồng thời kích hoạt cập nhật ngầm
      if (age < CACHE_STALE_MS) {
        if (!isRevalidating) {
          isRevalidating = true;
          fetchFreshCrmData(supabase)
            .then(fresh => {
              globalCrmCache = { data: fresh, timestamp: Date.now() };
            })
            .catch(err => {
              console.error('[CRM SWR Revalidate Error]:', err);
            })
            .finally(() => {
              isRevalidating = false;
            });
        }

        return NextResponse.json({
          ...globalCrmCache.data,
          meta: {
            ...globalCrmCache.data.meta,
            cached: true,
            stale: true,
            cachedAt: new Date(globalCrmCache.timestamp).toISOString(),
            ageMs: age,
          },
        });
      }
    }

    // Tải mới dữ liệu (fresh fetch)
    const freshData = await fetchFreshCrmData(supabase);
    globalCrmCache = { data: freshData, timestamp: Date.now() };

    return NextResponse.json(freshData, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    return safeErrorResponse(error, 'Failed to fetch CRM data');
  }
}
