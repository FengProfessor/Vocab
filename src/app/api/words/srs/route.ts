import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { calculateNextReview, mapQualityToRating } from '@/lib/srs';
import { XP_BY_QUALITY } from '@/lib/gamification';
import { getAuthUser, unauthorized, isValidString } from '@/lib/api-security';

/**
 * POST /api/words/srs
 * Auth: Bearer JWT required. Body: { wordId, quality: 0 | 3 | 4 | 5 }
 * Upserts an srs_progress row using FSRS v5 algorithm.
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const { wordId, quality } = await req.json();

    if (!isValidString(wordId, 100) || ![0, 3, 4, 5].includes(quality)) {
      return NextResponse.json(
        { success: false, error: 'wordId (string) and quality (0|3|4|5) are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get current SRS entry if exists
    const { data: existing } = await supabase
      .from('srs_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single();

    // Port existing SM-2 data to FSRS if stability/difficulty are missing
    const currentSRS = existing
      ? {
          stability: Number(existing.stability) || Number(existing.interval_days) || 0,
          difficulty: Number(existing.difficulty) || 5,
          interval: existing.interval_days,
          reviewCount: existing.review_count,
          nextReviewDate: existing.next_review_date,
          lastReviewDate: existing.last_reviewed_at || existing.created_at,
        }
      : {
          stability: 0,
          difficulty: 0,
          interval: 0,
          reviewCount: 0,
          nextReviewDate: new Date().toISOString(),
          lastReviewDate: new Date().toISOString(),
        };

    const fsrsRating = mapQualityToRating(quality);
    const newSRS = calculateNextReview(currentSRS, fsrsRating);

    // Upsert into srs_progress with FSRS columns
    const { data, error } = await supabase
      .from('srs_progress')
      .upsert(
        {
          user_id: userId,
          word_id: wordId,
          stability: newSRS.stability,
          difficulty: newSRS.difficulty,
          interval_days: newSRS.interval,
          review_count: newSRS.reviewCount,
          next_review_date: newSRS.nextReviewDate,
          last_reviewed_at: new Date().toISOString(),
          algorithm_version: 'fsrs-v5',
        },
        { onConflict: 'user_id,word_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('SRS Upsert Error:', error.message);
      return NextResponse.json({ success: false, error: 'Failed to save progress', details: error.message }, { status: 500 });
    }

    // Award XP (fire-and-forget, không block response)
    const xp = XP_BY_QUALITY[quality] ?? 5;
    void supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp });

    return NextResponse.json(
      { success: true, srs: newSRS, data, xpAwarded: xp },
      {
        headers: {
          // Dữ liệu SRS riêng từng user → tuyệt đối không cache
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/words/srs Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: msg },
      { status: 500 }
    );
  }
}
