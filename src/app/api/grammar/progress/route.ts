import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { FSRSRating } from '@/lib/srs';
import { scheduleNext, stateToText, textToState } from '@/lib/fsrs';

/** Map độ chính xác bài tập (0-1) → rating FSRS. */
function accuracyToRating(acc: number): FSRSRating {
  if (acc >= 0.9) return 4; // Easy
  if (acc >= 0.7) return 3; // Good
  if (acc >= 0.5) return 2; // Hard
  return 1; // Again
}

/** Kiểu trả về cho view=topics */
export interface TopicProgressSummary {
  topicId: string;
  title: string;
  titleVi: string | null;
  level: string;
  totalLessons: number;
  masteredLessons: number;
  avgMasteryScore: number;
  nextDueDate: string | null;
}

/** GET /api/grammar/progress — tiến độ học grammar của user hiện tại (auth required).
 *  ?view=topics → trả TopicProgressSummary[] thay vì GrammarProgress[]
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const url = new URL(req.url);
    const view = url.searchParams.get('view');

    // ── view=topics: trả summary theo từng topic ──
    if (view === 'topics') {
      // Lấy tất cả lessons kèm topic info
      const { data: lessons, error: lessonErr } = await supabase
        .from('grammar_lessons')
        .select('id, topic_id, topic:grammar_topics(id, title, title_vi, level)');
      if (lessonErr) throw lessonErr;

      // Lấy progress của user
      const { data: progressRows, error: progErr } = await supabase
        .from('grammar_progress')
        .select('lesson_id, state, mastery_score, next_review_date')
        .eq('user_id', userId);
      if (progErr) throw progErr;

      const progressByLesson = new Map<string, { state: string; mastery_score: number; next_review_date: string }>();
      for (const p of progressRows ?? []) {
        progressByLesson.set(p.lesson_id, p);
      }

      // Group lessons theo topic
      const topicMap = new Map<string, {
        title: string;
        titleVi: string | null;
        level: string;
        lessonIds: string[];
      }>();

      for (const lesson of lessons ?? []) {
        const t = lesson.topic as unknown as { id: string; title: string; title_vi: string | null; level: string } | null;
        if (!t) continue;
        if (!topicMap.has(t.id)) {
          topicMap.set(t.id, { title: t.title, titleVi: t.title_vi, level: t.level, lessonIds: [] });
        }
        topicMap.get(t.id)!.lessonIds.push(lesson.id);
      }

      const now = Date.now();
      const summaries: TopicProgressSummary[] = [];

      for (const [topicId, info] of topicMap) {
        const total = info.lessonIds.length;
        let mastered = 0;
        let scoreSum = 0;
        let scored = 0;
        let nextDue: string | null = null;

        for (const lid of info.lessonIds) {
          const p = progressByLesson.get(lid);
          if (!p) continue;
          if (p.state === 'mastered' || p.mastery_score >= 80) mastered++;
          scoreSum += p.mastery_score;
          scored++;
          // Tìm bài due gần nhất
          if (new Date(p.next_review_date).getTime() <= now) {
            if (!nextDue || new Date(p.next_review_date) < new Date(nextDue)) {
              nextDue = p.next_review_date;
            }
          }
        }

        summaries.push({
          topicId,
          title: info.title,
          titleVi: info.titleVi,
          level: info.level,
          totalLessons: total,
          masteredLessons: mastered,
          avgMasteryScore: scored > 0 ? Math.round(scoreSum / scored) : 0,
          nextDueDate: nextDue,
        });
      }

      return NextResponse.json({ success: true, data: summaries });
    }

    // ── default: trả flat GrammarProgress[] (backward compat) ──
    const { data, error } = await supabase
      .from('grammar_progress')
      .select('*, lesson:grammar_lessons(id, title, topic_id)')
      .eq('user_id', userId);
    if (error) throw error;

    const now = Date.now();
    const dueCount = ((data || []) as { next_review_date: string }[]).filter(
      (p) => new Date(p.next_review_date).getTime() <= now
    ).length;
    return NextResponse.json({ success: true, data: data || [], dueCount });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/grammar/progress  Body: { lessonId, accuracy }
 * Cập nhật SRS sau khi học xong 1 bài (accuracy = độ chính xác bài tập 0-1).
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const supabase = createServiceClient();

    // Ưu tiên JWT; fallback về body.userId cho backward compat (sẽ xóa sau)
    let userId: string | undefined;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const body = await req.json();
    const { lessonId, accuracy } = body;
    if (!userId) userId = body.userId; // fallback — sẽ remove sau khi FE cập nhật

    if (!userId || !lessonId || typeof accuracy !== 'number') {
      return NextResponse.json(
        { success: false, error: 'lessonId, accuracy (number) are required + auth token' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('grammar_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const rating = accuracyToRating(accuracy);
    const prev = existing
      ? {
          stability: existing.stability,
          difficulty: existing.difficulty,
          interval_days: existing.interval_days,
          review_count: existing.review_count,
          state: textToState(existing.state),
          lapses: existing.lapses,
          learning_steps: existing.learning_steps,
          next_review_date: existing.next_review_date,
          last_reviewed_at: existing.last_reviewed_at,
        }
      : null;
    const next = scheduleNext(prev, rating);

    // EMA cho mastery_score: smooth qua nhiều session, không overwrite từ lần submit cuối.
    // new = α * current + (1 - α) * old, với α = 0.3.
    // Nếu chưa có session nào → dùng current trực tiếp.
    const clampedAcc = Math.max(0, Math.min(1, accuracy));
    const currentScore = Math.round(clampedAcc * 100);
    const ALPHA = 0.3;
    const oldScore = existing?.mastery_score;
    const masteryScore = typeof oldScore === 'number'
      ? Math.round(ALPHA * currentScore + (1 - ALPHA) * oldScore)
      : currentScore;
    // Giữ 'mastered' theo điểm thành thạo; còn lại lấy state FSRS.
    const state = masteryScore >= 80 ? 'mastered' : stateToText(next.state);

    const { data, error } = await supabase
      .from('grammar_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          stability: next.stability,
          difficulty: next.difficulty,
          interval_days: next.interval_days,
          review_count: next.review_count,
          lapses: next.lapses,
          learning_steps: next.learning_steps,
          next_review_date: next.next_review_date,
          last_reviewed_at: next.last_reviewed_at,
          state,
          mastery_score: masteryScore,
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
