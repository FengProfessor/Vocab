import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { calculateNextReview, defaultSRS, SRSData, FSRSRating } from '@/lib/srs';

/** Map độ chính xác bài tập (0-1) → rating FSRS. */
function accuracyToRating(acc: number): FSRSRating {
  if (acc >= 0.9) return 4; // Easy
  if (acc >= 0.7) return 3; // Good
  if (acc >= 0.5) return 2; // Hard
  return 1; // Again
}

/** GET /api/grammar/progress?userId=xxx — tiến độ học grammar của user. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grammar_progress')
      .select('*, lesson:grammar_lessons(id, title, topic_id)')
      .eq('user_id', userId);
    if (error) throw error;

    const now = Date.now();
    const dueCount = (data || []).filter(
      (p: any) => new Date(p.next_review_date).getTime() <= now
    ).length;
    return NextResponse.json({ success: true, data: data || [], dueCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/grammar/progress  Body: { userId, lessonId, accuracy }
 * Cập nhật SRS sau khi học xong 1 bài (accuracy = độ chính xác bài tập 0-1).
 */
export async function POST(req: Request) {
  try {
    const { userId, lessonId, accuracy } = await req.json();
    if (!userId || !lessonId || typeof accuracy !== 'number') {
      return NextResponse.json(
        { error: 'userId, lessonId, accuracy (number) are required' },
        { status: 400 }
      );
    }
    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from('grammar_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const current: SRSData = existing
      ? {
          stability: existing.stability || 0,
          difficulty: existing.difficulty || 0,
          interval: existing.interval_days || 0,
          reviewCount: existing.review_count || 0,
          nextReviewDate: existing.next_review_date,
          lastReviewDate: existing.last_reviewed_at || undefined,
        }
      : defaultSRS();

    const rating = accuracyToRating(accuracy);
    const next = calculateNextReview(current, rating);
    const state = rating === 1 ? 'relearning' : next.reviewCount <= 1 ? 'learning' : 'review';

    const { data, error } = await supabase
      .from('grammar_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          stability: next.stability,
          difficulty: next.difficulty,
          interval_days: next.interval,
          review_count: next.reviewCount,
          next_review_date: next.nextReviewDate,
          last_reviewed_at: next.lastReviewDate,
          state,
          mastery_score: Math.round(Math.max(0, Math.min(1, accuracy)) * 100),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
