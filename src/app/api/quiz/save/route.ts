import { NextResponse } from 'next/server';
import { createServiceClient, type QuizType } from '@/lib/supabase';
import { XP_PER_CORRECT_QUIZ } from '@/lib/gamification';
import { getAuthUser, unauthorized, isNumberInRange, safeErrorResponse } from '@/lib/api-security';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOrCreatePersonalClassroom(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', userId)
    .eq('name', '__personal__')
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('classrooms')
    .insert({
      teacher_id: userId,
      name: '__personal__',
      description: 'Personal word list',
      invite_code: `P-${userId.slice(0, 8).toUpperCase()}`,
    })
    .select('id')
    .single();
  if (error) {
    const { data: retry } = await supabase
      .from('classrooms')
      .select('id')
      .eq('teacher_id', userId)
      .eq('name', '__personal__')
      .maybeSingle();
    if (retry?.id) return retry.id;
    throw error;
  }
  return created.id;
}

/**
 * POST /api/quiz/save
 * Auth: Bearer JWT required. Body: { classroomId?, score, totalQuestions, quizType, wordIds? }
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const {
      classroomId, score, totalQuestions,
      quizType = 'vocabulary',
      wordIds,
    } = await req.json();

    // Validate input ranges trước khi đụng DB
    if (!isNumberInRange(totalQuestions, 1, 1000)) {
      return NextResponse.json({ success: false, error: 'totalQuestions must be 1-1000' }, { status: 400 });
    }
    if (!isNumberInRange(score, 0, totalQuestions)) {
      return NextResponse.json({ success: false, error: 'score must be 0..totalQuestions' }, { status: 400 });
    }
    const validQuizType: QuizType = quizType === 'grammar' ? 'grammar' : 'vocabulary';

    let finalClassroomId = typeof classroomId === 'string' ? classroomId.trim() : '';

    const supabase = createServiceClient();

    // Determine if the target classroom is missing, the literal string '__personal__', or non-UUID
    let isPersonal = !finalClassroomId || finalClassroomId === '__personal__' || !UUID_REGEX.test(finalClassroomId);
    if (finalClassroomId && UUID_REGEX.test(finalClassroomId)) {
      const { data: cls } = await supabase
        .from('classrooms')
        .select('name')
        .eq('id', finalClassroomId)
        .maybeSingle();
      if (cls?.name === '__personal__') {
        isPersonal = true;
      }
    }

    // For verbal assignments: if student is enrolled in a classroom, route quizzes
    // to their enrolled classroom so the teacher dashboard captures their progress
    if (isPersonal) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('classroom_id, joined_at')
        .eq('student_id', userId)
        .order('joined_at', { ascending: false });

      if (enrollments && enrollments.length > 0) {
        if (enrollments.length === 1) {
          finalClassroomId = enrollments[0].classroom_id;
          isPersonal = false;
        } else {
          // Multiple enrolled classrooms: if wordIds are provided, match against words in classrooms
          let matchedClassroomId: string | null = null;
          if (Array.isArray(wordIds) && wordIds.length > 0) {
            const validWordIds = wordIds.filter((id): id is string => typeof id === 'string' && UUID_REGEX.test(id));
            if (validWordIds.length > 0) {
              const { data: sourceWords } = await supabase
                .from('words')
                .select('word')
                .in('id', validWordIds);
              const wordStrings = (sourceWords || []).map((w) => w.word.trim().toLowerCase());

              if (wordStrings.length > 0) {
                const enrolledIds = enrollments.map((e) => e.classroom_id);
                const { data: candidateWords } = await supabase
                  .from('words')
                  .select('classroom_id, word')
                  .in('classroom_id', enrolledIds)
                  .in('word', wordStrings);

                const countsByClass = new Map<string, number>();
                for (const cw of candidateWords || []) {
                  if (wordStrings.includes(cw.word.trim().toLowerCase())) {
                    countsByClass.set(cw.classroom_id, (countsByClass.get(cw.classroom_id) || 0) + 1);
                  }
                }

                let maxCount = 0;
                for (const [cid, cnt] of countsByClass.entries()) {
                  if (cnt > maxCount) {
                    maxCount = cnt;
                    matchedClassroomId = cid;
                  }
                }
              }
            }
          }

          finalClassroomId = matchedClassroomId || enrollments[0].classroom_id;
          isPersonal = false;
        }
      }
    }

    // Fallback: personal classroom = '__personal__' (if not enrolled in any class or still personal)
    if (!finalClassroomId || isPersonal) {
      finalClassroomId = await getOrCreatePersonalClassroom(supabase, userId);
    }

    // accuracy là GENERATED column (score/total) — KHÔNG insert tay
    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        user_id: userId,
        classroom_id: finalClassroomId,
        quiz_type: validQuizType,
        score,
        total_questions: totalQuestions,
      })
      .select()
      .single();

    if (error) {
      const dbMsg = typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: string }).message)
        : 'db error';
      console.error('[QuizSave] insert failed:', dbMsg, error);
      return NextResponse.json(
        { success: false, error: 'Failed to save quiz results' },
        { status: 500 },
      );
    }

    // Award XP + streak. Only award when score > 0 (award_xp raises DB exception on xp <= 0)
    const xp = score * XP_PER_CORRECT_QUIZ;
    if (xp > 0) {
      const { error: xpError } = await supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp });
      if (xpError) console.error('[Gamification] award_xp failed:', xpError.message);
    }

    return NextResponse.json({ success: true, data, xpAwarded: xp });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Internal Server Error');
  }
}
