import { NextResponse } from 'next/server';
import { createServiceClient, fetchAllRows } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse, getAdminEmails } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

type ProfileRow = { id: string; email: string; full_name: string; role: string; created_at: string };
type QuizRow = { user_id: string; accuracy: number; completed_at: string };

/**
 * GET /api/admin/stats
 * Returns all users with their activity stats for the admin dashboard.
 * Auth: Admin only (JWT + email whitelist).
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    // ── Auth: admin only ──
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase = createServiceClient();
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
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }


    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    const today = new Date().toISOString().split('T')[0];
    const profileList = (profiles || []) as ProfileRow[];
    const userIds = profileList.map((p) => p.id);

    // ── Bulk-fetch thay cho N+1 (trước đây ~3 query/user → bão hoà pool Supabase) ──
    // Do query `in(id, ...)` có thể dài quá URL length limit hoặc trả về > 1000 dòng, ta chunk id.
    const CHUNK_SIZE = 50;
    const classrooms: { id: string; teacher_id: string }[] = [];
    const quizRows: QuizRow[] = [];

    for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + CHUNK_SIZE);
      const [classRes, qRes] = await Promise.all([
        supabase.from('classrooms').select('id, teacher_id').eq('name', '__personal__').in('teacher_id', chunk),
        fetchAllRows((f, t) => supabase.from('quiz_results').select('user_id, accuracy, completed_at').in('user_id', chunk).range(f, t))
      ]);
      if (classRes.data) classrooms.push(...classRes.data);
      if (qRes) quizRows.push(...qRes);
    }

    const classroomIds = classrooms.map((c) => c.id);
    const classroomToUser = new Map(classrooms.map((c) => [c.id, c.teacher_id]));

    const wordRows: { classroom_id: string; created_at: string }[] = [];
    for (let i = 0; i < classroomIds.length; i += CHUNK_SIZE) {
      const chunk = classroomIds.slice(i, i + CHUNK_SIZE);
      const wRes = await fetchAllRows((f, t) => supabase.from('words').select('classroom_id, created_at').in('classroom_id', chunk).range(f, t));
      if (wRes) wordRows.push(...wRes);
    }

    // Gộp per-user trong bộ nhớ (thay cho việc truy vấn từng user)
    const wordCountMap = new Map<string, number>();
    const wordsTodayMap = new Map<string, number>();
    const lastActiveMap = new Map<string, string>();
    const bumpLastActive = (uid: string, ts: string | null | undefined) => {
      if (!ts) return;
      const prev = lastActiveMap.get(uid);
      if (!prev || new Date(ts).getTime() > new Date(prev).getTime()) lastActiveMap.set(uid, ts);
    };
    for (const w of wordRows) {
      const uid = classroomToUser.get(w.classroom_id);
      if (!uid) continue;
      wordCountMap.set(uid, (wordCountMap.get(uid) || 0) + 1);
      if (w.created_at?.startsWith(today)) wordsTodayMap.set(uid, (wordsTodayMap.get(uid) || 0) + 1);
      bumpLastActive(uid, w.created_at);
    }

    const quizCountMap = new Map<string, number>();
    const quizSumMap = new Map<string, number>();
    for (const q of quizRows) {
      quizCountMap.set(q.user_id, (quizCountMap.get(q.user_id) || 0) + 1);
      quizSumMap.set(q.user_id, (quizSumMap.get(q.user_id) || 0) + (q.accuracy || 0));
      bumpLastActive(q.user_id, q.completed_at);
    }

    const users = profileList.map((profile) => {
      const quizCount = quizCountMap.get(profile.id) || 0;
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
        wordCount: wordCountMap.get(profile.id) || 0,
        wordsToday: wordsTodayMap.get(profile.id) || 0,
        quizCount,
        avgAccuracy: quizCount > 0 ? (quizSumMap.get(profile.id) || 0) / quizCount : 0,
        lastActive: lastActiveMap.get(profile.id) || null,
      };
    });

    // Aggregate totals
    const totalWords = users.reduce((sum, u) => sum + u.wordCount, 0);
    const totalQuizzes = users.reduce((sum, u) => sum + u.quizCount, 0);

    return NextResponse.json({ success: true, users, totalWords, totalQuizzes });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to fetch admin stats');
  }
}
