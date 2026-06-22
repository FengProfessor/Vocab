import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';

// Fail-closed: ADMIN_EMAILS chưa cấu hình → mảng rỗng → mọi request 403
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

const DAY = 24 * 60 * 60 * 1000;

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
  wordCount: number;
  quizCount: number;
  totalPaid: number;
  groupId: string | null;
}

/**
 * GET /api/admin/crm
 * CRM khách hàng: mọi user + gói/nguồn/vòng đời/doanh thu + funnel signup + segment.
 * Auth: Admin only (JWT + ADMIN_EMAILS whitelist).
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    if (ADMIN_EMAILS.length === 0) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }
    const supabase = createServiceClient();
    const { data: callerProfile } = await supabase.from('profiles').select('email').eq('id', auth.userId).single();
    const callerEmail = callerProfile?.email?.toLowerCase() ?? '';
    if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // ── Bulk fetch (tránh N+1) ──
    const [
      { data: profiles, error: pErr },
      { data: orders },
      { data: groups },
      { data: members },
      { data: classrooms },
      { data: enrollments },
    ] = await Promise.all([
      supabase.from('profiles')
        .select('id, email, full_name, role, created_at, plan, plan_expires_at')
        .order('created_at', { ascending: false }),
      supabase.from('orders').select('user_id, amount, status, paid_at'),
      supabase.from('groups').select('id, owner_id, status'),
      supabase.from('group_members').select('group_id, user_id'),
      supabase.from('classrooms').select('id, teacher_id').eq('name', '__personal__'),
      supabase.from('enrollments').select('student_id'),
    ]);
    if (pErr) throw pErr;

    const profileRows = (profiles ?? []) as ProfileRow[];
    const orderRows = (orders ?? []) as OrderRow[];
    const groupRows = (groups ?? []) as GroupRow[];
    const memberRows = (members ?? []) as MemberRow[];
    const classroomRows = (classrooms ?? []) as ClassroomRow[];
    const enrollRows = (enrollments ?? []) as EnrollRow[];

    // Map classroom_id → owner (để gộp words → user)
    const classroomOwner = new Map<string, string>();
    const userClassrooms = new Map<string, string[]>();
    for (const c of classroomRows) {
      classroomOwner.set(c.id, c.teacher_id);
      const arr = userClassrooms.get(c.teacher_id) ?? [];
      arr.push(c.id);
      userClassrooms.set(c.teacher_id, arr);
    }

    // Words + quiz: bulk, gộp theo user
    const classroomIds = classroomRows.map(c => c.id);
    const [{ data: words }, { data: quizzes }] = await Promise.all([
      classroomIds.length
        ? supabase.from('words').select('classroom_id, created_at').in('classroom_id', classroomIds)
        : Promise.resolve({ data: [] as WordRow[] }),
      supabase.from('quiz_results').select('user_id, completed_at'),
    ]);
    const wordRows = (words ?? []) as WordRow[];
    const quizRows = (quizzes ?? []) as QuizRow[];

    const wordCountByUser = new Map<string, number>();
    const lastActiveByUser = new Map<string, number>();
    const bumpActive = (uid: string, ts: string | null) => {
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

      // Vòng đời (dựa vào ngày ký + lần hoạt động cuối)
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
    const kpis = {
      totalUsers: customers.length,
      newThisWeek: customers.filter(c => new Date(c.created_at).getTime() >= weekAgo).length,
      payingUsers: customers.filter(c => c.paying).length,
      activeUsers: byLifecycle.active + byLifecycle.new,
      churnedUsers: byLifecycle.churned,
      totalRevenue: orderRows.reduce((s, o) => s + (o.status === 'paid' ? (o.amount || 0) : 0), 0),
      activeGroups: groupActive.size,
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
