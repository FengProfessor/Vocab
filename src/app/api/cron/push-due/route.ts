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
    const envSecret = process.env.CRON_SECRET || 'lingopro_cron_2024';

    console.log(`[Cron/Auth] secret=${secret}, envSecret=${envSecret}, authHeader=${authHeader}`);

    const isAuthorized =
      authHeader === `Bearer ${envSecret}` ||
      secret === envSecret ||
      secret === 'lingopro_secret_123'; // backward compat

    console.log(`[Cron/Auth] isAuthorized=${isAuthorized}`);

    if (!isAuthorized) {
      console.log('[Cron/Auth] UNAUTHORIZED');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        console.log(`[Cron] Processing profile:`, JSON.stringify(profile));

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

        console.log(`[Cron] User ${profile.id} (${profile.full_name}): role=${(profile as any).role}, classrooms=${classroomIds.length}`, classroomIds);

        if (!classroomIds.length) {
          console.log(`[Cron] Skipping user ${profile.id} - no classrooms`);
          continue;
        }

        // Đếm từ đến hạn: chưa có SRS record, hoặc next_review_date <= now
        const { count } = await supabase
          .from('words')
          .select('id', { count: 'exact', head: true })
          .in('classroom_id', classroomIds)
          .or(
            `id.not.in.(select word_id from srs_progress where user_id=eq.${profile.id}),id.in.(select word_id from srs_progress where user_id=eq.${profile.id} and next_review_date=lte.${now})`
          );

        const dueCount = count || 0;
        if (dueCount === 0) continue;

        const firstName = (profile.full_name || 'bạn').split(' ').pop();

        // Gửi push notification đến user qua FCM
        const result = await sendPushNotificationToUser(
          profile.id,
          '⏰ Thời Điểm Ôn Tập!',
          `${firstName} ơi, bạn có ${dueCount} từ đang chờ ôn tập. Học ngay để không quên nhé! 🧠`,
          '/student'
        );

        results.push({
          userId: profile.id,
          name: profile.full_name,
          dueCount,
          sent: !!result,
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
      results,
    });
  } catch (err: any) {
    console.error('[Cron/push-due] Fatal error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
