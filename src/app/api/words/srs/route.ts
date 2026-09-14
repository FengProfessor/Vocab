import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { mapQualityToRating } from '@/lib/srs';
import { scheduleNext } from '@/lib/fsrs';
import { XP_BY_QUALITY } from '@/lib/gamification';
import { getAuthUser, unauthorized, isValidString, safeErrorResponse } from '@/lib/api-security';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';

/**
 * Mirror student progress to enrolled classrooms and personal classroom in background.
 * Uses targeted single-row indexed queries and TTL caches to avoid blocking the client.
 */
async function mirrorSrsProgress(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  word: any,
  newSRS: any
) {
  try {
    const enrollCacheKey = `student-enrollments:${userId}`;
    let enrollments = cacheGet<any[]>(enrollCacheKey);
    if (!enrollments) {
      const { data } = await supabase
        .from('enrollments')
        .select('classroom_id, classroom:classrooms(id, teacher_id, name)')
        .eq('student_id', userId);
      enrollments = data || [];
      cacheSet(enrollCacheKey, enrollments, 2 * 60_000);
    }

    if (enrollments && enrollments.length > 0 && word?.word) {
      const cleanWord = word.word.trim();
      const targetEnrollments = enrollments.filter(
        (e: any) => e.classroom_id !== word.classroom_id && (e.classroom as any)?.teacher_id
      );

      for (const enr of targetEnrollments) {
        const targetClassroomId = enr.classroom_id;
        const classTeacherId = (enr.classroom as any)?.teacher_id;
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
          const { data: insertedWord, error: insErr } = await supabase
            .from('words')
            .insert({
              classroom_id: targetClassroomId,
              added_by: classTeacherId,
              word: cleanWord,
              translation: word.translation || '⏳ Analyzing...',
              ipa: word.ipa || '',
              pos: word.pos || '',
              example: word.example || '',
              example_vi: word.example_vi || null,
              image_url: word.image_url || null,
              image_source: word.image_source || 'global_dict',
              image_confidence: word.image_confidence ?? null,
              synonyms: word.synonyms || [],
              antonyms: word.antonyms || [],
              dictionary_data: word.dictionary_data || null,
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
      .select('*, classroom:classrooms(teacher_id, name)')
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

    const rating = mapQualityToRating(quality);

    const { data: existingSRS } = await supabase
      .from('srs_progress')
      .select('stability, difficulty, interval_days, review_count, state, lapses, learning_steps, last_reviewed_at')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .maybeSingle();

    const newSRS = scheduleNext(existingSRS, rating);

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

    // Background mirroring and side-effects — does NOT block the HTTP response!
    void mirrorSrsProgress(supabase, userId, word, newSRS);

    // Award XP + streak (only if xp > 0, to avoid DB exception on zero XP)
    const xp = XP_BY_QUALITY[quality] ?? 5;
    if (xp > 0) {
      void supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp }).then(({ error: xpError }) => {
        if (xpError) console.error('[Gamification] award_xp failed:', xpError.message);
      });
    }

    void supabase
      .rpc('refresh_vocab_pack_progress', { p_user_id: userId, p_word_id: wordId })
      .then(({ error: progressError }) => {
        if (progressError) console.error('[VocabPack] Progress refresh failed:', progressError.message);
      });

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
