import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase';
import { sendPushNotificationToUser } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, fcm_token')
      .eq('id', user.id)
      .single();

    if (!profile?.fcm_token) {
      return NextResponse.json({
        success: false,
        error: 'FCM token chưa đăng ký. Hãy bấm "Lấy & Lưu FCM Token" trước.',
      }, { status: 400 });
    }

    let classroomIds: string[] = [];
    if (profile.role === 'teacher') {
      const { data } = await supabase
        .from('classrooms').select('id').eq('teacher_id', user.id);
      classroomIds = data?.map(c => c.id) || [];
    } else {
      const { data } = await supabase
        .from('enrollments').select('classroom_id').eq('student_id', user.id);
      classroomIds = data?.map(e => e.classroom_id) || [];
    }

    if (!classroomIds.length) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy classroom nào' }, { status: 400 });
    }

    // Lấy tối đa 5 từ để đặt thành due
    const { data: words } = await supabase
      .from('words')
      .select('id, word')
      .in('classroom_id', classroomIds)
      .limit(5);

    if (!words?.length) {
      return NextResponse.json({ success: false, error: 'Không có từ nào trong classroom' }, { status: 400 });
    }

    const dueDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const wordIds = words.map(w => w.id);

    // Chỉ UPDATE next_review_date cho record đã tồn tại — không động vào stability/difficulty
    const { error: updateError } = await supabase
      .from('srs_progress')
      .update({ next_review_date: dueDate })
      .eq('user_id', user.id)
      .in('word_id', wordIds);

    // Từ chưa có srs_progress record sẽ mặc định là due (cron coi !reviewDate = due)

    // Đếm tổng due thực tế sau khi cập nhật
    const { data: allWords } = await supabase
      .from('words')
      .select('id')
      .in('classroom_id', classroomIds);

    let dueCount = 0;
    if (allWords?.length) {
      const { data: srsData } = await supabase
        .from('srs_progress')
        .select('word_id, next_review_date')
        .eq('user_id', user.id)
        .in('word_id', allWords.map(w => w.id));

      const srsByWordId = new Map(srsData?.map(s => [s.word_id, s.next_review_date]) || []);
      const now = new Date();
      dueCount = allWords.filter(w => {
        const reviewDate = srsByWordId.get(w.id);
        return !reviewDate || new Date(reviewDate) <= now;
      }).length;
    }

    const firstName = (profile.full_name || 'bạn').split(' ').pop();
    const result = await sendPushNotificationToUser(
      user.id,
      '⏰ [TEST] Thời Điểm Ôn Tập!',
      `${firstName} ơi, bạn có ${dueCount} từ đang chờ ôn tập. Học ngay để không quên nhé! 🧠`,
      '/student'
    );

    const sent = !!(result as { messageId?: string })?.messageId;

    return NextResponse.json({
      success: sent,
      updateError: updateError?.message ?? null,
      wordsMarkedDue: words.map(w => w.word),
      totalDueCount: dueCount,
      notificationResult: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
