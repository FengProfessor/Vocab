import { sessionErrorResponse } from '@/lib/session-response';
import { getWebUser } from '@/lib/server-auth-session';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';
import { cleanGrammarAnswer, GrammarExercise } from '@/lib/grammar-exercises';

const REVIEW_QUEUE_TTL_MS = 14 * 24 * 60 * 60_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CachedWrongAttempt {
  exercise: GrammarExercise;
  completedAt: string;
}

/**
 * GET /api/grammar/review?days=14
 * Trả về các bài tập ngữ pháp mà user đang còn làm SAI trong N ngày qua
 * (lọc theo lần làm gần nhất của mỗi câu: nếu đã sửa đúng ở lần gần nhất thì loại khỏi hàng đợi).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await getWebUser(req);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get('days') || '14', 10);
    const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 90 ? daysParam : 14;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceMs = sinceDate.getTime();

    // Lấy toàn bộ kết quả trong N ngày để chỉ giữ những câu có lần làm gần nhất là SAI
    const { data: results, error: resErr } = await supabase
      .from('grammar_results')
      .select('exercise_id, is_correct, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', sinceDate.toISOString())
      .order('completed_at', { ascending: false });
    if (resErr) throw resErr;

    const latestByExId = new Map<string, boolean>();
    const wrongExerciseIds: string[] = [];
    for (const r of results || []) {
      if (!r?.exercise_id || latestByExId.has(r.exercise_id)) continue;
      latestByExId.set(r.exercise_id, Boolean(r.is_correct));
      if (!r.is_correct) {
        wrongExerciseIds.push(r.exercise_id);
      }
    }

    let dbExercises: Record<string, unknown>[] = [];
    if (wrongExerciseIds.length > 0) {
      const { data: exercises, error: exErr } = await supabase
        .from('grammar_exercises')
        .select('*')
        .in('id', wrongExerciseIds);
      if (exErr) throw exErr;
      const exById = new Map((exercises || []).map((e) => [e.id, e]));
      dbExercises = wrongExerciseIds
        .map((id) => exById.get(id))
        .filter((e): e is NonNullable<typeof e> => !!e);
    }

    // Gộp thêm hàng đợi câu sai từ bài tự học (pre-...) trong cache
    const cacheKey = `grammar:review_queue:${user.id}`;
    const cachedQueue = (cacheGet<CachedWrongAttempt[]>(cacheKey) || []).filter((item) => {
      const ts = item?.completedAt ? new Date(item.completedAt).getTime() : 0;
      return item?.exercise?.question && ts >= sinceMs;
    });

    const seenQuestions = new Set<string>();
    const combined: unknown[] = [];

    for (const ex of dbExercises) {
      const q = cleanGrammarAnswer(String(ex.question || ''));
      if (q && !seenQuestions.has(q)) {
        seenQuestions.add(q);
        combined.push(ex);
      }
    }

    for (const item of cachedQueue) {
      const q = cleanGrammarAnswer(item.exercise.question);
      if (q && !seenQuestions.has(q)) {
        seenQuestions.add(q);
        combined.push(item.exercise);
      }
    }

    return NextResponse.json({
      success: true,
      data: combined,
      count: combined.length,
      days,
    });
  } catch (e: unknown) {
    const sessionFailure = sessionErrorResponse(e);
    if (sessionFailure) return sessionFailure;
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[GrammarReview] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/grammar/review
 * Body: { exerciseId?, isCorrect: boolean, timeSpentMs?: number, exercise?: GrammarExercise }
 * Lưu kết quả từng câu để phục vụ deck "Ôn câu sai (14 ngày)".
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await getWebUser(req);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const isCorrect = Boolean(body.isCorrect);
    const exercise = body.exercise as GrammarExercise | undefined;
    const rawExerciseId = String(body.exerciseId || exercise?.id || '').trim();
    const timeSpentMs = typeof body.timeSpentMs === 'number' ? Math.max(0, Math.round(body.timeSpentMs)) : 0;

    // 1. Nếu exerciseId là UUID hợp lệ trong grammar_exercises → ghi vào bảng grammar_results
    if (UUID_RE.test(rawExerciseId)) {
      const { error: insertErr } = await supabase.from('grammar_results').insert({
        user_id: user.id,
        exercise_id: rawExerciseId,
        is_correct: isCorrect,
        time_spent_ms: timeSpentMs,
      });
      if (insertErr) {
        console.warn('[GrammarReview] DB insert warning:', insertErr.message);
      }
    }

    // 2. Cập nhật hàng đợi cache cho cả bài tập tự học (pre-...) lẫn bài tập DB
    if (exercise && exercise.question) {
      const cacheKey = `grammar:review_queue:${user.id}`;
      const existing = cacheGet<CachedWrongAttempt[]>(cacheKey) || [];
      const normQ = cleanGrammarAnswer(exercise.question);
      const filtered = existing.filter(
        (item) =>
          item.exercise.id !== exercise.id &&
          cleanGrammarAnswer(item.exercise.question) !== normQ,
      );
      if (!isCorrect) {
        filtered.unshift({
          exercise,
          completedAt: new Date().toISOString(),
        });
      }
      cacheSet(cacheKey, filtered.slice(0, 100), REVIEW_QUEUE_TTL_MS);
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const sessionFailure = sessionErrorResponse(e);
    if (sessionFailure) return sessionFailure;
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

