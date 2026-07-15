import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { stabilityToLevel } from '@/lib/srs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    // lite=1: dashboard chỉ cần heatmap 30 ngày — không quét full SRS (giảm tải khi quá tải)
    const lite = req.nextUrl.searchParams.get('lite') === '1';

    if (lite) {
      const { data: recentRows } = await supabase
        .from('srs_progress')
        .select('last_reviewed_at')
        .eq('user_id', userId)
        .gte('last_reviewed_at', thirtyDaysAgo)
        .not('last_reviewed_at', 'is', null);

      const toLocalKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const dayMap: Record<string, number> = {};
      for (const r of recentRows ?? []) {
        if (!r.last_reviewed_at) continue;
        const day = toLocalKey(new Date(r.last_reviewed_at));
        dayMap[day] = (dayMap[day] ?? 0) + 1;
      }
      const dailyActivity = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
        const key = toLocalKey(d);
        return { date: key, count: dayMap[key] ?? 0 };
      });

      return NextResponse.json(
        { success: true, data: { dailyActivity } },
        { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } },
      );
    }

    const [srsRes, quizRes, recentSrsRes, gamificationRes, weakRes] = await Promise.all([
      // Tất cả SRS progress
      supabase
        .from('srs_progress')
        .select('stability, difficulty, review_count, next_review_date, word_id')
        .eq('user_id', userId),
      // Quiz history
      supabase
        .from('quiz_results')
        .select('score, total_questions, accuracy, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      // 30 ngày gần nhất — dùng last_reviewed_at
      supabase
        .from('srs_progress')
        .select('last_reviewed_at')
        .eq('user_id', userId)
        .gte('last_reviewed_at', thirtyDaysAgo),
      // Gamification XP
      supabase
        .from('user_gamification')
        .select('total_xp, current_streak, today_xp')
        .eq('user_id', userId)
        .single(),
      // Top 5 từ yếu nhất (stability thấp nhất, đã có ít nhất 1 review)
      supabase
        .from('srs_progress')
        .select('word_id, stability, difficulty, next_review_date, review_count, words(word, translation)')
        .eq('user_id', userId)
        .gt('review_count', 0)
        .order('stability', { ascending: true })
        .limit(5),
    ]);

    const srsRows = srsRes.data ?? [];
    const quizRows = quizRes.data ?? [];
    const recentRows = recentSrsRes.data ?? [];
    const gamRow = gamificationRes.data;
    const weakRows = weakRes.data ?? [];

    // Word stats
    const total = srsRows.length;
    const levelCounts = [0, 0, 0, 0, 0, 0];
    let totalStability = 0;
    let wordsDue = 0;

    for (const r of srsRows) {
      const s = r.stability ?? 0;
      totalStability += s;
      const lvl = Math.min(5, stabilityToLevel(s) - 1); // stabilityToLevel trả 1-6, map về 0-5
      levelCounts[lvl]++;
      if (r.next_review_date && new Date(r.next_review_date) <= todayEnd) {
        wordsDue++;
      }
    }

    // Daily activity heatmap (30 ngày) — key theo local date, không dùng UTC ISO
    const toLocalKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const dayMap: Record<string, number> = {};
    for (const r of recentRows) {
      const reviewed = r.last_reviewed_at;
      if (!reviewed) continue;
      // last_reviewed_at là timestamptz ISO → convert sang local day
      const day = toLocalKey(new Date(reviewed));
      dayMap[day] = (dayMap[day] ?? 0) + 1;
    }
    const dailyActivity = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
      const key = toLocalKey(d);
      return { date: key, count: dayMap[key] ?? 0 };
    });

    // Streak tính từ dailyActivity (liên tiếp từ hôm nay về trước)
    let streak = 0;
    for (let i = 29; i >= 0; i--) {
      if (dailyActivity[i].count > 0) streak++;
      else break;
    }

    // Quiz stats
    const avgAccuracy = quizRows.length
      ? Math.round(quizRows.reduce((s, r) => s + (r.accuracy ?? 0), 0) / quizRows.length)
      : 0;
    const bestScore = quizRows.length
      ? Math.max(...quizRows.map((r) => Math.round(((r.score ?? 0) / (r.total_questions ?? 1)) * 100)))
      : 0;

    // Weak words — r.words là single object do FK relation (Supabase auto-detect FK)
    const weakWords = weakRows.map((r) => {
      const raw = r.words;
      const wordData = (Array.isArray(raw) ? raw[0] : raw) as { word: string; translation: string | null } | null;
      return {
        word_id: r.word_id,
        word: wordData?.word ?? '',
        translation: wordData?.translation ?? '',
        stability: r.stability ?? 0,
        difficulty: r.difficulty ?? 0,
        review_count: r.review_count ?? 0,
        next_review_date: r.next_review_date,
        level: stabilityToLevel(r.stability ?? 0),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          wordStats: {
            total,
            levelCounts,
            avgStability: total ? Math.round(totalStability / total) : 0,
            wordsDue,
          },
          dailyActivity,
          quizHistory: quizRows.map((r) => ({
            accuracy: r.accuracy ?? 0,
            score: r.score ?? 0,
            total: r.total_questions ?? 0,
            created_at: r.created_at,
          })),
          studyStreak: streak,
          avgAccuracy,
          bestScore,
          weakWords,
          gamification: gamRow
            ? { totalXp: gamRow.total_xp ?? 0, streak: gamRow.current_streak ?? 0, todayXp: gamRow.today_xp ?? 0 }
            : null,
        },
      },
      {
        // Private browser cache 30s — giảm spam khi user chuyển tab stats
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[StudentStats] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
