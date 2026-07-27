import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';
import { effectiveCurrentStreak } from '@/lib/gamification';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarInitials: string;
  xp: number;
  streak: number;
  wordsLearned: number;
  accuracy: number;
}

type Period = 'week' | 'month' | 'all';

function getPeriodStartDate(period: Period): string | null {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { id: classroomId } = await params;
    const period = (req.nextUrl.searchParams.get('period') ?? 'week') as Period;
    if (!['week', 'month', 'all'].includes(period)) {
      return NextResponse.json({ success: false, error: 'period must be week|month|all' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Xác nhận classroom tồn tại và user có quyền truy cập (enrolled hoặc là teacher)
    const { data: classroom, error: classroomErr } = await supabase
      .from('classrooms')
      .select('id, name, teacher_id')
      .eq('id', classroomId)
      .single();

    if (classroomErr || !classroom) {
      return NextResponse.json({ success: false, error: 'Classroom not found' }, { status: 404 });
    }

    // Kiểm tra quyền: phải là student đã enroll hoặc teacher của lớp
    const isTeacher = classroom.teacher_id === auth.userId;
    if (!isTeacher) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('classroom_id')
        .eq('classroom_id', classroomId)
        .eq('student_id', auth.userId)
        .maybeSingle();
      if (!enrollment) {
        return NextResponse.json({ success: false, error: 'Not enrolled in this classroom' }, { status: 403 });
      }
    }

    // Lấy danh sách student_id trong classroom
    const { data: enrollments, error: enrollErr } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroomId);

    if (enrollErr || !enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        period,
        classroomName: classroom.name,
      });
    }

    const studentIds = enrollments.map((e) => e.student_id as string);

    const periodStart = getPeriodStartDate(period);

    // 4 truy vấn độc lập → chạy song song (trước đây tuần tự = 4x round-trip).
    // srs_progress scope thẳng theo classroom qua inner join words → không kéo toàn bộ
    // srs của lớp/kho khác rồi lọc trong JS (trước đây tải cả nghìn hàng thừa).
    const [
      { data: profiles, error: profilesErr },
      { data: gamifRows },
      { data: srsRows },
      { data: quizRows },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds),
      supabase
        .from('user_gamification')
        .select('user_id, total_xp, today_xp, current_streak, last_active_date, today_date')
        .in('user_id', studentIds),
      supabase
        .from('srs_progress')
        .select('user_id, word_id, words!inner(classroom_id)')
        .eq('words.classroom_id', classroomId)
        .in('user_id', studentIds)
        .gte('review_count', 1),
      supabase
        .from('quiz_results')
        .select('user_id, accuracy')
        .eq('classroom_id', classroomId)
        .in('user_id', studentIds),
    ]);

    if (profilesErr || !profiles) {
      return NextResponse.json({ success: false, error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Map gamification theo user_id
    type GamifRow = {
      user_id: string;
      total_xp: number;
      today_xp: number;
      current_streak: number;
      last_active_date: string | null;
      today_date: string | null;
    };
    const gamifMap = new Map<string, GamifRow>(
      (gamifRows ?? []).map((g) => [g.user_id as string, g as GamifRow])
    );

    // Count words learned per user (srsRows đã scope theo classroom qua inner join)
    const wordsLearnedMap = new Map<string, number>();
    for (const row of srsRows ?? []) {
      const uid = row.user_id as string;
      wordsLearnedMap.set(uid, (wordsLearnedMap.get(uid) ?? 0) + 1);
    }

    // Avg accuracy per user
    const accuracyMap = new Map<string, { sum: number; count: number }>();
    for (const row of quizRows ?? []) {
      const uid = row.user_id as string;
      const existing = accuracyMap.get(uid) ?? { sum: 0, count: 0 };
      accuracyMap.set(uid, { sum: existing.sum + (row.accuracy as number), count: existing.count + 1 });
    }

    // Xây dựng danh sách leaderboard
    const entries = profiles.map((p) => {
      const uid = p.id as string;
      const gamif = gamifMap.get(uid);

      // Tính XP theo period
      let xp = 0;
      if (period === 'all') {
        xp = gamif?.total_xp ?? 0;
      } else if (period === 'week' || period === 'month') {
        // Dùng today_xp nếu last_active_date trong kỳ, else 0
        // Đơn giản hóa: dùng today_xp cho week, total_xp cho month/all
        // Thực tế cần bảng lịch sử XP theo ngày — hiện tại dùng total_xp làm proxy
        if (period === 'week') {
          // Nếu user active trong 7 ngày qua, dùng total_xp (proxy)
          // TODO: khi có bảng xp_history thì dùng sum(xp) WHERE date >= periodStart
          const lastActive = gamif?.last_active_date;
          const isActive = lastActive && lastActive >= (periodStart ?? '');
          xp = isActive ? (gamif?.total_xp ?? 0) : 0;
        } else {
          const lastActive = gamif?.last_active_date;
          const isActive = lastActive && lastActive >= (periodStart ?? '');
          xp = isActive ? (gamif?.total_xp ?? 0) : 0;
        }
      }

      const acc = accuracyMap.get(uid);
      const accuracy = acc ? Math.round(acc.sum / acc.count) : 0;

      // Streak liên tiếp còn sống (0 nếu last_active > 1 ngày — không phải tổng ngày học)
      const streak = gamif
        ? effectiveCurrentStreak(gamif.current_streak, gamif.last_active_date)
        : 0;

      return {
        userId: uid,
        name: (p.full_name as string) || 'Unknown',
        avatarInitials: toInitials((p.full_name as string) || 'U'),
        xp,
        streak,
        wordsLearned: wordsLearnedMap.get(uid) ?? 0,
        accuracy,
      };
    });

    // Sort by xp DESC, wordsLearned DESC làm tiebreaker
    entries.sort((a, b) => b.xp - a.xp || b.wordsLearned - a.wordsLearned);

    const leaderboard: LeaderboardEntry[] = entries.slice(0, 20).map((e, i) => ({
      rank: i + 1,
      ...e,
    }));

    return NextResponse.json(
      {
        success: true,
        data: leaderboard,
        period,
        classroomName: classroom.name as string,
      },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
    );
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không tải được bảng xếp hạng');
  }
}
