import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';

/**
 * POST /api/teacher/assign-drill
 * Body: { studentId: string, classroomId: string, wordIds?: string[] }
 * Resets the next_review_date of specified words (or top 5 difficult words if not specified)
 * to today's date so they show up as due for the student.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { studentId, classroomId, wordIds } = body as {
      studentId: string;
      classroomId: string;
      wordIds?: string[];
    };

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

    let targetWordIds = wordIds || [];

    // If no word IDs specified, fetch top 5 most difficult words for this student
    if (targetWordIds.length === 0) {
      const { data: progressList, error: fetchErr } = await supabase
        .from('srs_progress')
        .select('word_id, difficulty, stability, words!inner(classroom_id)')
        .eq('user_id', studentId)
        .eq('words.classroom_id', classroomId)
        .order('difficulty', { ascending: false })
        .order('stability', { ascending: true })
        .limit(5);

      if (fetchErr) throw fetchErr;

      targetWordIds = (progressList || []).map((p) => (p as { word_id: string }).word_id);
    }

    if (targetWordIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No words found to assign for review.',
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Update next_review_date to today for the target words
    const { error: updateErr } = await supabase
      .from('srs_progress')
      .update({ next_review_date: todayStr })
      .eq('user_id', studentId)
      .in('word_id', targetWordIds);

    if (updateErr) throw updateErr;

    // Fetch the word details to include in the response message
    const { data: words } = await supabase
      .from('words')
      .select('word')
      .in('id', targetWordIds);

    const wordListStr = words?.map(w => w.word).join(', ') || '';

    return NextResponse.json({
      success: true,
      count: targetWordIds.length,
      words: words?.map(w => w.word) || [],
      message: `Assigned ${targetWordIds.length} words for extra practice: ${wordListStr}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Assign Drill API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
