import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse, getAdminEmails } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;
const PAGE = 1000;

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

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Fetch toàn bộ rows (vượt mặc định 1000 của PostgREST). */
async function fetchAllPages<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await run(from, from + PAGE - 1);
    if (error) throw error;
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

/**
 * GET /api/admin/crm
 * CRM khách hàng: mọi user + gói/nguồn/vòng đời/doanh thu + funnel signup + segment.
 * Học thật: srs_progress (learned / review / lapses) + last_reviewed_at cho activity.
 * Auth: Admin only (JWT + ADMIN_EMAILS whitelist).
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

    // ── Bulk fetch (paginate — PostgREST mặc định max 1000 rows/request) ──
    const [profileRows, orderRows, groupRows, memberRows, classroomRows, enrollRows] =
      await Promise.all([
        fetchAllPages<ProfileRow>((from, to) =>
          supabase
            .from('profiles')
            .select('id, email, full_name, role, created_at, plan, plan_expires_at')
            .order('created_at', { ascending: false })
            .range(from, to) as PromiseLike<{ data: ProfileRow[] | null; error: { message: string } | null }>,
        ),
        fetchAllPages<OrderRow>((from, to) =>
          supabase
            .from('orders')
            .select('user_id, amount, status, paid_at')
            .order('paid_at', { ascending: false, nullsFirst: false })
            .range(from, to) as PromiseLike<{ data: OrderRow[] | null; error: { message: string } | null }>,
        ),
        fetchAllPages<GroupRow>((from, to) =>
          supabase
            .from('groups')
            .select('id, owner_id, status')
            .order('id')
            .range(from, to) as PromiseLike<{ data: GroupRow[] | null; error: { message: string } | null }>,
        ),
        fetchAllPages<MemberRow>((from, to) =>
          supabase
            .from('group_members')
            .select('group_id, user_id')
            .order('group_id')
            .range(from, to) as PromiseLike<{ data: MemberRow[] | null; error: { message: string } | null }>,
        ),
        fetchAllPages<ClassroomRow>((from, to) =>
          supabase
            .from('classrooms')
            .select('id, teacher_id')
            .eq('name', '__personal__')
            .order('id')
            .range(from, to) as PromiseLike<{ data: ClassroomRow[] | null; error: { message: string } | null }>,
        ),
        fetchAllPages<EnrollRow>((from, to) =>
          supabase
            .from('enrollments')
            .select('student_id')
            .order('student_id')
            .range(from, to) as PromiseLike<{ data: EnrollRow[] | null; error: { message: string } | null }>,
        ),
      ]);

    // Map classroom_id → owner (để gộp words → user)
    const classroomOwner = new Map<string, string>();
    for (const c of classroomRows) {
      classroomOwner.set(c.id, c.teacher_id);
    }

    // Words + quiz + SRS: paginate + order ổn định
    // Parallelize: words chunks + quiz + SRS chạy đồng thời (trước: serial chunk → rồi quiz/srs)
    const classroomIds = classroomRows.map(c => c.id);
    const CHUNK_SIZE = 50;
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

    // Chạy tất cả song song: N word chunks + quiz + SRS
    const [wordChunkResults, quizRows, srsRows] = await Promise.all([
      Promise.all(wordChunkPromises),
      fetchAllPages<QuizRow>((from, to) =>
        supabase
          .from('quiz_results')
          .select('user_id, completed_at')
          .order('user_id')
          .range(from, to) as PromiseLike<{ data: QuizRow[] | null; error: { message: string } | null }>,
      ),
      fetchAllPages<SrsRow>((from, to) =>
        supabase
          .from('srs_progress')
          .select('user_id, review_count, lapses, last_reviewed_at, next_review_date')
          .order('user_id')
          .range(from, to) as PromiseLike<{ data: SrsRow[] | null; error: { message: string } | null }>,
      ),
    ]);
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

    // SRS: từ đã ôn / tổng lượt ôn / lần quên / ôn cuối / due + activity
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
      // Due: có next_review_date và đã đến hạn (kể cả thẻ mới chưa ôn)
      if (s.next_review_date) {
        const dueTs = new Date(s.next_review_date).getTime();
        if (Number.isFinite(dueTs) && dueTs <= nowMs) {
          dueCountByUser.set(uid, (dueCountByUser.get(uid) ?? 0) + 1);
        }
      }
      bumpActive(uid, s.last_reviewed_at);
    }

    // Group role + revenue
    const groupOwners = new Map<string, string>();   // user_id → group_id
    const groupActive = new Set<string>();
    for (const g of groupRows) {
      if (g.status === 'active') { groupOwners.set(g.owner_id, g.id); groupActive.add(g.id); }
    }
    const groupMember = new Map<string, string>();    // user_id → group_id (active groups)
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

      // Nguồn (ưu tiên cao → thấp)
      let source: CrmSource = 'direct';
      if (groupOwners.has(p.id)) source = 'group_owner';
      else if (groupMember.has(p.id)) source = 'group_member';
      else if (p.role === 'teacher') source = 'teacher';
      else if (enrolledStudents.has(p.id)) source = 'classroom';

      // Vòng đời: signup + lastActive (lưu từ / quiz / ôn SRS)
      const created = new Date(p.created_at).getTime();
      const lastTs = lastActiveByUser.get(p.id) ?? 0;
      const daysSinceActive = lastTs ? (now - lastTs) / DAY : Infinity;
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
        lastActive: lastTs ? new Date(lastTs).toISOString() : null,
        wordCount: wordCountByUser.get(p.id) ?? 0,
        learnedCount: learnedByUser.get(p.id) ?? 0,
        reviewTotal: reviewTotalByUser.get(p.id) ?? 0,
        lapsesTotal: lapsesByUser.get(p.id) ?? 0,
        lastReviewedAt: lastReviewedByUser.has(p.id)
          ? new Date(lastReviewedByUser.get(p.id)!).toISOString()
          : null,
        dueCount: dueCountByUser.get(p.id) ?? 0,
        quizCount: quizCountByUser.get(p.id) ?? 0,
        totalPaid: paidByUser.get(p.id) ?? 0,
        groupId: groupOwners.get(p.id) ?? groupMember.get(p.id) ?? null,
      };
    });

    // ── Funnel: signup theo ngày (90 ngày gần nhất) ──
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

    // ── Segments ──
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
    // Free power: ≥150 từ đã lưu — lead upsell (case Ngọc Lan 250)
    const freeHot150 = customers.filter(c => c.plan === 'free' && c.wordCount >= 150).length;
    const freeHot200 = customers.filter(c => c.plan === 'free' && c.wordCount >= 200).length;
    // Chăm sóc ôn tập — đếm theo ngày lịch VN (UTC+7)
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
      learners, // user có ≥1 từ đã ôn SRS
      churnedUsers: byLifecycle.churned,
      totalRevenue: orderRows.reduce((s, o) => s + (o.status === 'paid' ? (o.amount || 0) : 0), 0),
      activeGroups: groupActive.size,
      freeHot150,
      freeHot200,
      reviewedToday,
      withDue,
      neverReviewed,
    };

    return NextResponse.json({
      success: true,
      customers,
      funnel,
      segments: { byPlan, byRole, byLifecycle, bySource },
      kpis,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to fetch CRM data');
  }
}
