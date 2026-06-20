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

    const { data: word } = await supabase
      .from('words')
      .select('added_by, classroom_id, classroom:classrooms(teacher_id)')
      .eq('id', wordId)
      .maybeSingle();
    if (!word) {
      return NextResponse.json({ success: false, error: 'Word not found' }, { status: 404 });
    }
    const classroom = word.classroom as { teacher_id?: string } | { teacher_id?: string }[] | null;
    const teacherId = Array.isArray(classroom) ? classroom[0]?.teacher_id : classroom?.teacher_id;
    const ownsWord = word.added_by === userId || teacherId === userId;
    const { data: enrollment } = ownsWord
      ? { data: true }
      : await supabase
          .from('enrollments')
          .select('id')
          .eq('classroom_id', word.classroom_id)
          .eq('student_id', userId)
          .maybeSingle();
    if (!ownsWord && !enrollment) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

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

    // Award XP + streak. PHẢI await: supabase builder lazy thenable,
    // `void` không trigger `.then` → request không bao giờ gửi (XP/streak mất).
    const xp = XP_BY_QUALITY[quality] ?? 5;
    const { error: xpError } = await supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp });
    if (xpError) console.error('[Gamification] award_xp failed:', xpError.message);
    const { error: progressError } = await supabase
      .rpc('refresh_vocab_pack_progress', { p_user_id: userId, p_word_id: wordId });
    if (progressError) console.error('[VocabPack] Progress refresh failed:', progressError.message);

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
