import { NextResponse } from 'next/server';
import { createServiceClient, type QuizType } from '@/lib/supabase';
import { XP_PER_CORRECT_QUIZ } from '@/lib/gamification';
import { getAuthUser, unauthorized, isNumberInRange } from '@/lib/api-security';

/**
 * POST /api/quiz/save
 * Auth: Bearer JWT required. Body: { classroomId?, score, totalQuestions, quizType }
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const {
      classroomId, score, totalQuestions,
      quizType = 'vocabulary',
    } = await req.json();

    // Validate input ranges trước khi đụng DB
    if (!isNumberInRange(totalQuestions, 1, 1000)) {
      return NextResponse.json({ success: false, error: 'totalQuestions must be 1-1000' }, { status: 400 });
    }
    if (!isNumberInRange(score, 0, totalQuestions)) {
      return NextResponse.json({ success: false, error: 'score must be 0..totalQuestions' }, { status: 400 });
    }
    const validQuizType: QuizType = quizType === 'grammar' ? 'grammar' : 'vocabulary';

    let finalClassroomId = typeof classroomId === 'string' ? classroomId : '';

    const supabase = createServiceClient();

    // Fallback if classroomId is missing: find personal classroom
    if (!finalClassroomId) {
      const { data: cls } = await supabase
        .from('classrooms')
        .select('id')
        .eq('name', 'Personal')
        .eq('teacher_id', userId)
        .single();
      if (cls) finalClassroomId = cls.id;
    }

    if (!finalClassroomId) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }

    const accuracyPct = Math.round((score / totalQuestions) * 100);

    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        user_id: userId,
        classroom_id: finalClassroomId,
        quiz_type: validQuizType,
        score,
        total_questions: totalQuestions,
        accuracy: accuracyPct,
      })
      .select()
      .single();

    if (error) {
      console.error('[Quiz/Save] DB error:', error.message, error.details, error.hint);
      return NextResponse.json({
        success: false,
        error: 'Failed to save quiz results to database',
        details: error.message
      }, { status: 500 });
    }

    // Award XP cho số câu đúng
    void supabase.rpc('award_xp', { p_user_id: userId, p_xp: score * XP_PER_CORRECT_QUIZ });

    return NextResponse.json({ success: true, data, xpAwarded: score * XP_PER_CORRECT_QUIZ });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Quiz/Save] Error:', msg);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
