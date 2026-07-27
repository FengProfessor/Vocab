import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, forbidden, safeErrorResponse } from '@/lib/api-security';

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

    // Chống IDOR: studentId phải là học viên đã enroll lớp này (không thì GV có thể ghi
    // SRS của user bất kỳ qua lớp __personal__ của chính mình).
    const { data: enr } = await supabase
      .from('enrollments')
      .select('id')
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (!enr) return forbidden('Student not enrolled in this classroom');

    const hasExplicitWordIds = Array.isArray(wordIds) && wordIds.length > 0;
    let targetWordIds = wordIds || [];

    // Khi client chỉ định wordIds: chỉ giữ những từ THỰC SỰ thuộc lớp này
    // (không cho reset lịch SRS của từ ngoài phạm vi lớp được uỷ quyền).
    if (hasExplicitWordIds) {
      const { data: scoped, error: scopeErr } = await supabase
        .from('words')
        .select('id')
        .eq('classroom_id', classroomId)
        .in('id', targetWordIds);
      if (scopeErr) throw scopeErr;
      targetWordIds = (scoped || []).map((w) => (w as { id: string }).id);
    }

    // If no word IDs specified, fetch top 5 most difficult words for this student
    if (!hasExplicitWordIds && targetWordIds.length === 0) {
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
    return safeErrorResponse(error, 'Không giao được bài luyện');
  }
}
