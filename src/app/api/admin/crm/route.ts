import { sessionErrorResponse } from '@/lib/session-response';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorized, safeErrorResponse, getAdminEmails } from '@/lib/api-security';

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
  wordCount: number;       // từ đã lưu (__personal__)
  learnedCount: number;    // từ đã ôn (srs review_count >= 1)
  reviewTotal: number;     // tổng lượt ôn
  lapsesTotal: number;     // tổng lần quên (Again)
  lastReviewedAt: string | null; // max(last_reviewed_at) — ngày ôn cuối
  dueCount: number;        // số từ đang due (next_review_date <= now)
  quizCount: number;
  totalPaid: number;
  groupId: string | null;
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
  lastActiveByUser?: Map<string, number>;
  learnedByUser?: Map<string, number>;
  reviewTotalByUser?: Map<string, number>;
  lapsesByUser?: Map<string, number>;
  lastReviewedByUser?: Map<string, number>;
  dueCountByUser?: Map<string, number>;
  quizCountByUser?: Map<string, number>;
  engine: 'rpc' | 'rest_parallel';
  tookMs: number;
}): CrmResponseData {
  const {
    profileRows, orderRows, groupRows, memberRows, enrollRows,
    statsMap, wordCountByUser, lastActiveByUser, learnedByUser,
    reviewTotalByUser, lapsesByUser, lastReviewedByUser, dueCountByUser,
    quizCountByUser, engine, tookMs,
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

    if (statsMap) {
      const s = statsMap.get(p.id);
      if (s) {
        wordCount = Number(s.word_count || 0);
        learnedCount = Number(s.learned_count || 0);
        reviewTotal = Number(s.review_total || 0);
        lapsesTotal = Number(s.lapses_total || 0);
        lastReviewedAt = s.last_reviewed_at;
        dueCount = Number(s.due_count || 0);
        quizCount = Number(s.quiz_count || 0);

        const tsWord = s.last_word_at ? new Date(s.last_word_at).getTime() : 0;
        const tsQuiz = s.last_quiz_at ? new Date(s.last_quiz_at).getTime() : 0;
        const tsReview = s.last_reviewed_at ? new Date(s.last_reviewed_at).getTime() : 0;
        lastActiveTs = Math.max(tsWord, tsQuiz, tsReview);
      }
    } else {
      wordCount = wordCountByUser?.get(p.id) ?? 0;
      learnedCount = learnedByUser?.get(p.id) ?? 0;
      reviewTotal = reviewTotalByUser?.get(p.id) ?? 0;
      lapsesTotal = lapsesByUser?.get(p.id) ?? 0;
      lastReviewedAt = lastReviewedByUser?.has(p.id)
        ? new Date(lastReviewedByUser.get(p.id)!).toISOString()
        : null;
      dueCount = dueCountByUser?.get(p.id) ?? 0;
      quizCount = quizCountByUser?.get(p.id) ?? 0;
      lastActiveTs = lastActiveByUser?.get(p.id) ?? 0;
    }

    const created = new Date(p.created_at).getTime();
    const daysSinceActive = lastActiveTs ? (now - lastActiveTs) / DAY : Infinity;
    let lifecycle: CrmLifecycle;
    if (now - created <= 7 * DAY) lifecycle = 'new';
    else if (daysSinceActive <= 7) lifecycle = 'active';
    else if (daysSinceActive <= 30) lifecycle = 'at_risk';
    else lifecycle = 'churned';

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
      lastActive: lastActiveTs ? new Date(lastActiveTs).toISOString() : null,
      wordCount,
      learnedCount,
      reviewTotal,
      lapsesTotal,
      lastReviewedAt,
      dueCount,
      quizCount,
      totalPaid: paidByUser.get(p.id) ?? 0,
      groupId: groupOwners.get(p.id) ?? groupMember.get(p.id) ?? null,
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
  const learners = customers.filter(c => c.learnedCount > 0).length;
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
  const [
    classroomRows,
    quizRows,
    srsRows,
  ] = await Promise.all([
    fetchDirectOrPages<ClassroomRow>(supabase, 'classrooms', 'id, teacher_id', { col: 'id', asc: true }, (q) => q.eq('name', '__personal__')),
    fetchDirectOrPages<QuizRow>(supabase, 'quiz_results', 'user_id, completed_at', { col: 'user_id', asc: true }),
    fetchDirectOrPages<SrsRow>(supabase, 'srs_progress', 'user_id, review_count, lapses, last_reviewed_at, next_review_date', { col: 'user_id', asc: true }),
  ]);

  const classroomOwner = new Map<string, string>();
  for (const c of classroomRows) {
    classroomOwner.set(c.id, c.teacher_id);
  }

  // Query words theo chunk 80 lớp với fetchAllPages nhẹ (không gọi HEAD count thừa)
  const classroomIds = classroomRows.map(c => c.id);
  const CHUNK_SIZE = 80;
  const wordChunkPromises: Promise<WordRow[]>[] = [];
  for (let i = 0; i < classroomIds.length; i += CHUNK_SIZE) {
    const chunk = classroomIds.slice(i, i + CHUNK_SIZE);
    wordChunkPromises.push(
      fetchAllPages<WordRow>((from, to) =>
        supabase
          .from('words')
          .select('classroom_id, created_at')
          .in('classroom_id', chunk)
          .order('classroom_id')
          .range(from, to) as PromiseLike<{ data: WordRow[] | null; error: { message: string } | null }>,
      ),
    );
  }
  const wordChunkResults = await Promise.all(wordChunkPromises);
  const wordRows = wordChunkResults.flat();

  const wordCountByUser = new Map<string, number>();
  const lastActiveByUser = new Map<string, number>();
  const bumpActive = (uid: string, ts: string | null | undefined) => {
    if (!ts) return;
    const t = new Date(ts).getTime();
    if (!Number.isFinite(t)) return;
    if (t > (lastActiveByUser.get(uid) ?? 0)) lastActiveByUser.set(uid, t);
  };

  for (const w of wordRows) {
    const uid = classroomOwner.get(w.classroom_id);
    if (!uid) continue;
    wordCountByUser.set(uid, (wordCountByUser.get(uid) ?? 0) + 1);
    bumpActive(uid, w.created_at);
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

  return buildCrmPayload({
    profileRows,
    orderRows,
    groupRows,
    memberRows,
    enrollRows,
    wordCountByUser,
    lastActiveByUser,
    learnedByUser,
    reviewTotalByUser,
    lapsesByUser,
    lastReviewedByUser,
    dueCountByUser,
    quizCountByUser,
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
