import { NextRequest, NextResponse } from 'next/server';
import {
  buildDailyActivity,
  dateKeyInTimeZone,
  resolveDisplayStreak,
} from '@/lib/gamification';
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
    // lite=1: dashboard heatmap + studyStreak — không quét full SRS
    const lite = req.nextUrl.searchParams.get('lite') === '1';

    if (lite) {
      const [recentRes, gamRes] = await Promise.all([
        supabase
          .from('srs_progress')
          .select('last_reviewed_at')
          .eq('user_id', userId)
          .gte('last_reviewed_at', thirtyDaysAgo)
          .not('last_reviewed_at', 'is', null),
        supabase
          .from('user_gamification')
          .select('current_streak, last_active_date')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const dailyActivity = buildDailyActivity(
        (recentRes.data ?? []).map((r) => r.last_reviewed_at as string | null),
        30,
        now,
      );
      const studyStreak = resolveDisplayStreak({
        currentStreak: gamRes.data?.current_streak,
        lastActiveDate: gamRes.data?.last_active_date,
        dailyActivity,
        now,
      });
      const todayKey = dateKeyInTimeZone(now);
      const todayWords = dailyActivity.find((d) => d.date === todayKey)?.count ?? 0;

      return NextResponse.json(
        {
          success: true,
          data: {
            dailyActivity,
            studyStreak,
            todayWords,
            todayKey,
          },
        },
        { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } },
      );
    }

    const [srsRes, quizRes, recentSrsRes, gamificationRes, weakRes] = await Promise.all([
      supabase
        .from('srs_progress')
        .select('stability, difficulty, review_count, next_review_date, word_id')
        .eq('user_id', userId),
      supabase
        .from('quiz_results')
        .select('score, total_questions, accuracy, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('srs_progress')
        .select('last_reviewed_at')
        .eq('user_id', userId)
        .gte('last_reviewed_at', thirtyDaysAgo),
      supabase
        .from('user_gamification')
        .select('total_xp, current_streak, today_xp, last_active_date')
        .eq('user_id', userId)
        .single(),
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

    const total = srsRows.length;
    const levelCounts = [0, 0, 0, 0, 0, 0];
    let totalStability = 0;
    let wordsDue = 0;

    for (const r of srsRows) {
      const s = r.stability ?? 0;
      totalStability += s;
      const lvl = Math.min(5, stabilityToLevel(s) - 1);
      levelCounts[lvl]++;
      if (r.next_review_date && new Date(r.next_review_date) <= todayEnd) {
        wordsDue++;
      }
    }

    // Heatmap + streak: lịch Asia/Ho_Chi_Minh — liên tiếp, không tổng ngày
    const dailyActivity = buildDailyActivity(
      recentRows.map((r) => r.last_reviewed_at as string | null),
      30,
      now,
    );
    const studyStreak = resolveDisplayStreak({
      currentStreak: gamRow?.current_streak,
      lastActiveDate: gamRow?.last_active_date,
      dailyActivity,
      now,
    });

    const avgAccuracy = quizRows.length
      ? Math.round(quizRows.reduce((s, r) => s + (r.accuracy ?? 0), 0) / quizRows.length)
      : 0;
    const bestScore = quizRows.length
      ? Math.max(...quizRows.map((r) => Math.round(((r.score ?? 0) / (r.total_questions ?? 1)) * 100)))
      : 0;

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
          studyStreak,
          avgAccuracy,
          bestScore,
          weakWords,
          gamification: gamRow
            ? {
                totalXp: gamRow.total_xp ?? 0,
                streak: studyStreak,
                todayXp: gamRow.today_xp ?? 0,
              }
            : null,
        },
      },
      {
        headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[StudentStats] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
