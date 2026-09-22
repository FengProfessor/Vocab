import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { mapQualityToRating } from '@/lib/srs';
import { scheduleNext } from '@/lib/fsrs';
import { XP_BY_QUALITY } from '@/lib/gamification';
import { getAuthUser, unauthorized, isValidString, safeErrorResponse } from '@/lib/api-security';
import { cacheGet, cacheSet, invalidateServerWordSummaryCache } from '@/lib/ttl-cache';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Mirror student progress to enrolled classrooms and personal classroom in background.
 * Uses targeted single-row indexed queries and TTL caches to avoid blocking the client.
 */
interface MirrorWord {
  id?: string;
  word?: string;
  classroom_id?: string;
}

interface MirrorEnrollment {
  classroom_id: string;
  classroom?: { id?: string; teacher_id?: string; name?: string } | null;
}

async function mirrorSrsProgress(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  word: MirrorWord | null | undefined,
  newSRS: ReturnType<typeof scheduleNext>
) {
  try {
    const enrollCacheKey = `student-enrollments:${userId}`;
    let enrollments = cacheGet<MirrorEnrollment[]>(enrollCacheKey);
    if (!enrollments) {
      const { data } = await supabase
        .from('enrollments')
        .select('classroom_id, classroom:classrooms(id, teacher_id, name)')
        .eq('student_id', userId);
      enrollments = (data || []) as unknown as MirrorEnrollment[];
      cacheSet(enrollCacheKey, enrollments, 2 * 60_000);
    }

    if (enrollments && enrollments.length > 0 && word?.word) {
      const cleanWord = word.word.trim();
      const targetEnrollments = enrollments.filter(
        (e) => e.classroom_id !== word.classroom_id && e.classroom?.teacher_id
      );

      for (const enr of targetEnrollments) {
        const targetClassroomId = enr.classroom_id;
        const classTeacherId = enr.classroom?.teacher_id;
        if (!targetClassroomId || !classTeacherId) continue;

        // Check if word already exists in target classroom (single row query)
        const { data: existingWord } = await supabase
          .from('words')
          .select('id')
          .eq('classroom_id', targetClassroomId)
          .ilike('word', cleanWord)
          .maybeSingle();

        let targetWordId = existingWord?.id;

        // If not in classroom yet, insert it on behalf of the teacher
        if (!targetWordId) {
          const { data: fullWord } = await supabase
            .from('words')
            .select('translation, ipa, pos, example, example_vi, image_url, image_source, image_confidence, synonyms, antonyms, dictionary_data')
            .eq('id', word.id)
            .maybeSingle();

          const { data: insertedWord, error: insErr } = await supabase
            .from('words')
            .insert({
              classroom_id: targetClassroomId,
              added_by: classTeacherId,
              word: cleanWord,
              translation: fullWord?.translation || '⏳ Analyzing...',
              ipa: fullWord?.ipa || '',
              pos: fullWord?.pos || '',
              example: fullWord?.example || '',
              example_vi: fullWord?.example_vi || null,
              image_url: fullWord?.image_url || null,
              image_source: fullWord?.image_source || 'global_dict',
              image_confidence: fullWord?.image_confidence ?? null,
              synonyms: fullWord?.synonyms || [],
              antonyms: fullWord?.antonyms || [],
              dictionary_data: fullWord?.dictionary_data || null,
            })
            .select('id')
            .maybeSingle();

          if (!insErr && insertedWord?.id) {
            targetWordId = insertedWord.id;
          }
        }

        if (targetWordId) {
          await supabase.from('srs_progress').upsert({
            user_id: userId,
            word_id: targetWordId,
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
          }, { onConflict: 'user_id,word_id' });
        }
      }
    }

    // Also mirror to personal classroom if reviewing within a teacher classroom
    const personalCacheKey = `personal-cls:${userId}`;
    let personalClsId = cacheGet<string>(personalCacheKey);
    if (!personalClsId) {
      const { data: personalCls } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', userId)
        .eq('name', '__personal__')
        .maybeSingle();
      if (personalCls?.id) {
        personalClsId = personalCls.id;
        cacheSet(personalCacheKey, personalClsId, 10 * 60_000);
      }
    }

    if (personalClsId && personalClsId !== word?.classroom_id && word?.word) {
      const cleanWord = word.word.trim();
      const { data: existingPersonalWord } = await supabase
        .from('words')
        .select('id')
        .eq('classroom_id', personalClsId)
        .ilike('word', cleanWord)
        .maybeSingle();

      const personalWordId = existingPersonalWord?.id;

      if (personalWordId) {
        await supabase.from('srs_progress').upsert({
          user_id: userId,
          word_id: personalWordId,
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
        }, { onConflict: 'user_id,word_id' });
      }
    }
    invalidateServerWordSummaryCache(userId);
  } catch (mirrorErr) {
    console.warn('[SRS] Failed to mirror progress:', mirrorErr);
  }
}

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

    const { wordId, quality, reviewId } = await req.json();

    const validReviewId = typeof reviewId === 'string' && UUID_PATTERN.test(reviewId);
    if (!isValidString(wordId, 100) || ![0, 3, 4, 5].includes(quality) || !validReviewId) {
      return NextResponse.json(
        { success: false, error: 'wordId, reviewId (UUID) and quality (0|3|4|5) are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const wordRes = await supabase
        .from('words')
        .select('id, word, added_by, classroom_id, classroom:classrooms(teacher_id, name)')
        .eq('id', wordId)
        .maybeSingle();

    const word = wordRes.data;
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

    const rating = mapQualityToRating(quality);
    let newSRS: ReturnType<typeof scheduleNext> | null = null;
    let applyStatus: 'applied' | 'duplicate' | 'conflict' = 'conflict';

    // CAS retry: không để hai lượt chấm gần nhau cùng ghi đè từ một trạng thái cũ.
    for (let attempt = 0; attempt < 3 && applyStatus === 'conflict'; attempt += 1) {
      const { data: existingSRS, error: readError } = await supabase
        .from('srs_progress')
        .select('stability, difficulty, interval_days, review_count, state, lapses, learning_steps, next_review_date, last_reviewed_at')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .maybeSingle();
      if (readError) return safeErrorResponse(readError, 'Failed to read progress');

      newSRS = scheduleNext(existingSRS, rating);
      const { data: rpcStatus, error: applyError } = await supabase.rpc('apply_srs_review', {
        p_user_id: userId,
        p_word_id: wordId,
        p_review_id: reviewId,
        p_quality: quality,
        p_expected_last_reviewed_at: existingSRS?.last_reviewed_at ?? null,
        p_stability: newSRS.stability,
        p_difficulty: newSRS.difficulty,
        p_interval_days: newSRS.interval_days,
        p_review_count: newSRS.review_count,
        p_state: newSRS.state,
        p_lapses: newSRS.lapses,
        p_learning_steps: newSRS.learning_steps,
        p_next_review_date: newSRS.next_review_date,
        p_last_reviewed_at: newSRS.last_reviewed_at,
      });
      if (applyError) return safeErrorResponse(applyError, 'Failed to save progress');
      applyStatus = rpcStatus as typeof applyStatus;
    }

    if (!newSRS || applyStatus === 'conflict') {
      return NextResponse.json({ success: false, error: 'Concurrent review conflict; please retry' }, { status: 409 });
    }

    // Purge server word summary RAM cache so next summary query reflects review changes immediately
    invalidateServerWordSummaryCache(userId);

    // Background mirroring and side-effects — does NOT block the HTTP response!
    if (applyStatus === 'applied') void mirrorSrsProgress(supabase, userId, word, newSRS);

    // Award XP + streak (only if xp > 0, to avoid DB exception on zero XP)
    const xp = XP_BY_QUALITY[quality] ?? 5;
    if (applyStatus === 'applied' && xp > 0) {
      void supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp }).then(({ error: xpError }) => {
        if (xpError) console.error('[Gamification] award_xp failed:', xpError.message);
      });
    }

    if (applyStatus === 'applied') void supabase
      .rpc('refresh_vocab_pack_progress', { p_user_id: userId, p_word_id: wordId })
      .then(({ error: progressError }) => {
        if (progressError) console.error('[VocabPack] Progress refresh failed:', progressError.message);
      });

    return NextResponse.json(
      { success: true, duplicate: applyStatus === 'duplicate', srs: newSRS, xpAwarded: applyStatus === 'applied' ? xp : 0 },
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
