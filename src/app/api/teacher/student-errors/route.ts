import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';

/**
 * GET /api/teacher/student-errors?studentId=xxx&classroomId=yyy
 * Fetches the top 10 most difficult words for a specific student in a classroom.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const classroomId = searchParams.get('classroomId');

    if (!studentId || !classroomId) {
      return NextResponse.json({ success: false, error: 'Missing studentId or classroomId' }, { status: 400 });
    }

    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const supabase = createServiceClient();

    // Chỉ giáo viên của lớp mới được xem/giao bài cho học viên lớp đó
    const { data: cls } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .maybeSingle();
    if (!cls || cls.teacher_id !== auth.userId) return unauthorized();

    // Query srs_progress for the student, filtering words in the specified classroom
    const { data: progressList, error } = await supabase
      .from('srs_progress')
      .select('difficulty, stability, review_count, last_reviewed_at, next_review_date, words!inner(id, word, translation, pos, example)')
      .eq('user_id', studentId)
      .eq('words.classroom_id', classroomId)
      // High difficulty first, then lower stability, then higher review count
      .order('difficulty', { ascending: false })
      .order('stability', { ascending: true })
      .limit(10);

    if (error) throw error;

    interface SRSProgressItem {
      difficulty?: number;
      stability?: number;
      review_count: number;
      last_reviewed_at?: string | null;
      next_review_date: string;
      words: {
        id: string;
        word: string;
        translation?: string;
        pos?: string;
        example?: string;
      };
    }

    // Format results to be flat and clean for the frontend
    const formattedErrors = (progressList || []).map((row) => {
      const p = row as unknown as SRSProgressItem;
      return {
        wordId: p.words.id,
        word: p.words.word,
        translation: p.words.translation,
        pos: p.words.pos,
        example: p.words.example,
        difficulty: p.difficulty,
        stability: p.stability,
        reviewCount: p.review_count,
        lastReviewedAt: p.last_reviewed_at,
        nextReviewDate: p.next_review_date,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedErrors,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Student Errors API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
