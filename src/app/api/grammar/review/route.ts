import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * GET /api/grammar/review?days=14
 * Trả về các grammar_exercises mà user đã từng làm SAI trong N ngày qua,
 * dedupe theo exercise_id (giữ lần sai gần nhất), sắp xếp theo recency.
 * Dùng cho "deck ôn lại câu sai" của học sinh.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get('days') || '14', 10);
    const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 90 ? daysParam : 14;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Lấy kết quả SAI trong N ngày
    const { data: results, error: resErr } = await supabase
      .from('grammar_results')
      .select('exercise_id, chosen_answer, completed_at')
      .eq('user_id', user.id)
      .eq('is_correct', false)
      .gte('completed_at', sinceDate.toISOString())
      .order('completed_at', { ascending: false });
    if (resErr) throw resErr;

    // Dedupe theo exercise_id, giữ lần sai gần nhất (results đã sort desc)
    const seen = new Set<string>();
    const exerciseIds: string[] = [];
    for (const r of results || []) {
      if (!seen.has(r.exercise_id)) {
        seen.add(r.exercise_id);
        exerciseIds.push(r.exercise_id);
      }
    }

    if (exerciseIds.length === 0) {
      return NextResponse.json({ success: true, data: [], count: 0 });
    }

    const { data: exercises, error: exErr } = await supabase
      .from('grammar_exercises')
      .select('*')
      .in('id', exerciseIds);
    if (exErr) throw exErr;

    // Giữ đúng thứ tự recency từ exerciseIds
    const exById = new Map((exercises || []).map((e) => [e.id, e]));
    const ordered = exerciseIds
      .map((id) => exById.get(id))
      .filter((e): e is NonNullable<typeof e> => !!e);

    return NextResponse.json({ success: true, data: ordered, count: ordered.length, days });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[GrammarReview] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
