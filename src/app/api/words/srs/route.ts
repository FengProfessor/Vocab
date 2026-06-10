import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { mapQualityToRating } from '@/lib/srs';
import { scheduleNext } from '@/lib/fsrs';
import { XP_BY_QUALITY } from '@/lib/gamification';
import { getAuthUser, unauthorized, isValidString, safeErrorResponse } from '@/lib/api-security';

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

    // ts-fsrs lo tái dựng Card + suy luận state cho dữ liệu cũ (xem lib/fsrs.ts)
    const fsrsRating = mapQualityToRating(quality);
    const newSRS = scheduleNext(existing, fsrsRating);

    // Upsert into srs_progress with FSRS columns
    const { data, error } = await supabase
      .from('srs_progress')
      .upsert(
        {
          user_id: userId,
          word_id: wordId,
          stability: newSRS.stability,
          difficulty: newSRS.difficulty,
          interval_days: newSRS.interval_days,
          review_count: newSRS.review_count,
          state: newSRS.state,
          lapses: newSRS.lapses,
          learning_steps: newSRS.learning_steps,
          next_review_date: newSRS.next_review_date,
          last_reviewed_at: newSRS.last_reviewed_at,
          algorithm_version: 'ts-fsrs',
        },
        { onConflict: 'user_id,word_id' }
      )
      .select()
      .single();

    if (error) {
      return safeErrorResponse(error, 'Failed to save progress');
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
    return safeErrorResponse(error, 'Internal Server Error');
  }
}
