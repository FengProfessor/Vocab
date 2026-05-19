import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendPushNotificationToUser } from '@/lib/notifications';

/**
 * GET /api/cron/push-due
 * Vercel Cron: chạy mỗi giờ, quét tất cả user có từ đến hạn và gửi push notification.
 * 
 * Authorization: Bearer <CRON_SECRET> hoặc query ?secret=<CRON_SECRET>
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    const envSecret = process.env.CRON_SECRET;

    const isAuthorized =
      authHeader === `Bearer ${envSecret}` ||
      secret === envSecret;

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // Lấy tất cả user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');

    if (!profiles?.length) {
      console.log('[Cron] No profiles found');
      return NextResponse.json({ notified: 0, message: 'No profiles found' });
    }

    console.log(`[Cron] Found ${profiles.length} profiles`);
    const results: any[] = [];

    for (const profile of profiles) {
      try {
        // Lấy classrooms mà user enrolled vào (hoặc created nếu teacher)
        let classroomIds: string[] = [];

        if ((profile as any).role === 'teacher') {
          // Teacher: tìm classrooms của teacher
          const { data } = await supabase
            .from('classrooms')
            .select('id')
            .eq('teacher_id', profile.id);
          classroomIds = data?.map(c => c.id) || [];
        } else {
          // Student: tìm classrooms đã enroll
          const { data } = await supabase
            .from('enrollments')
            .select('classroom_id')
            .eq('student_id', profile.id);
          classroomIds = data?.map(e => e.classroom_id) || [];
        }

        if (!classroomIds.length) {
          continue;
        }

        // Đếm từ đến hạn: (1) chưa có SRS record, hoặc (2) next_review_date <= now
        const { data: dueWords } = await supabase
          .from('words')
          .select('id')
          .in('classroom_id', classroomIds);

        let dueCount = 0;
        if (dueWords?.length) {
          // Lọc từ nào chưa được ôn hoặc quá hạn
          const { data: srsData } = await supabase
            .from('srs_progress')
            .select('word_id, next_review_date')
            .eq('user_id', profile.id)
            .in('word_id', dueWords.map(w => w.id));

          const srsByWordId = new Map(srsData?.map(s => [s.word_id, s.next_review_date]) || []);

          dueCount = dueWords.filter(w => {
            const reviewDate = srsByWordId.get(w.id);
            return !reviewDate || new Date(reviewDate) <= new Date(now);
          }).length;
        }

        if (dueCount === 0) continue;

        const firstName = (profile.full_name || 'bạn').split(' ').pop();

        // Gửi push notification đến user qua FCM
        const sendResult = await sendPushNotificationToUser(
          profile.id,
          '⏰ Thời Điểm Ôn Tập!',
          `${firstName} ơi, bạn có ${dueCount} từ đang chờ ôn tập. Học ngay để không quên nhé! 🧠`,
          '/student'
        );

        const sent = !!(sendResult as any)?.messageId;

        results.push({
          userId: profile.id,
          name: profile.full_name,
          dueCount,
          sent,
        });
      } catch (err: any) {
        console.error(`[Cron] Error processing user ${profile.id}:`, err.message);
      }
    }

    const notified = results.filter(r => r.sent).length;
    console.log(`[Cron/push-due] Sent ${notified}/${profiles.length} notifications`);

    return NextResponse.json({
      success: true,
      total: profiles.length,
      notified,
      results
    });
  } catch (err: any) {
    console.error('[Cron/push-due] Fatal error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
