import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendPushNotificationToUser } from '@/lib/notifications';

// firebase-admin cần Node runtime; cron route không được cache
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string;
  fcm_token: string | null;
  notification_hour: number | null;
};
type PushResult = { userId: string; name: string | null; dueCount: number; sent: boolean };

/**
 * Lấy giờ hiện tại theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7, không DST).
 * Vercel serverless chạy theo UTC nên phải convert thủ công.
 */
function getVietnamHour(): number {
  const str = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    hour12: false,
  }).format(new Date());
  return parseInt(str, 10) % 24; // hour12:false có thể trả '24' lúc nửa đêm
}

/**
 * GET /api/cron/push-due
 * Chạy MỖI GIỜ (Vercel Pro cron `0 * * * *`, hoặc external cron trên Hobby).
 * Chỉ gửi push cho user có `notification_hour` === giờ VN hiện tại + có fcm_token + có từ đến hạn.
 * Idempotent: chạy lại trong cùng giờ chỉ gửi đúng nhóm user của giờ đó.
 *
 * Authorization: Bearer <CRON_SECRET> hoặc query ?secret=<CRON_SECRET>
 * Test thủ công: ?hour=20 (ép giờ mục tiêu) hoặc ?all=1 (bỏ lọc giờ, gửi mọi user có từ due).
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    const envSecret = process.env.CRON_SECRET;

    const isAuthorized =
      !!envSecret && (authHeader === `Bearer ${envSecret}` || secret === envSecret);

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Giờ mục tiêu: mặc định = giờ VN hiện tại; ?hour= để test
    const hourParam = searchParams.get('hour');
    const sendAll = searchParams.get('all') === '1';
    const targetHour =
      hourParam !== null ? parseInt(hourParam, 10) % 24 : getVietnamHour();

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // Chỉ lấy user có fcm_token; lọc theo notification_hour trừ khi ?all=1
    let query = supabase
      .from('profiles')
      .select('id, full_name, role, fcm_token, notification_hour')
      .not('fcm_token', 'is', null);

    if (!sendAll) {
      query = query.eq('notification_hour', targetHour);
    }

    const { data: profiles, error: profErr } = await query;

    if (profErr) {
      console.error('[Cron/push-due] Profile query error:', profErr.message);
      return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
    }

    if (!profiles?.length) {
      console.log(`[Cron/push-due] No candidate users for hour ${targetHour} (VN)`);
      return NextResponse.json({ success: true, vnHour: targetHour, total: 0, notified: 0, results: [] });
    }

    console.log(`[Cron/push-due] ${profiles.length} candidate(s) for hour ${targetHour} (VN)`);
    const results: PushResult[] = [];

    for (const profile of profiles as ProfileRow[]) {
      try {
        // Lấy classrooms mà user enrolled vào (hoặc created nếu teacher)
        let classroomIds: string[] = [];

        if (profile.role === 'teacher') {
          const { data } = await supabase
            .from('classrooms')
            .select('id')
            .eq('teacher_id', profile.id);
          classroomIds = data?.map(c => c.id) || [];
        } else {
          const { data } = await supabase
            .from('enrollments')
            .select('classroom_id')
            .eq('student_id', profile.id);
          classroomIds = data?.map(e => e.classroom_id) || [];
        }

        if (!classroomIds.length) continue;

        // Đếm từ đến hạn: (1) chưa có SRS record, hoặc (2) next_review_date <= now
        const { data: dueWords } = await supabase
          .from('words')
          .select('id')
          .in('classroom_id', classroomIds);

        let dueCount = 0;
        if (dueWords?.length) {
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

        const sendResult = await sendPushNotificationToUser(
          profile.id,
          '⏰ Thời Điểm Ôn Tập!',
          `${firstName} ơi, bạn có ${dueCount} từ đang chờ ôn tập. Học ngay để không quên nhé! 🧠`,
          '/student'
        );

        const sent = !!(sendResult as { messageId?: string } | undefined)?.messageId;

        results.push({ userId: profile.id, name: profile.full_name, dueCount, sent });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Cron/push-due] Error processing user ${profile.id}:`, errMsg);
      }
    }

    const notified = results.filter(r => r.sent).length;
    console.log(`[Cron/push-due] Sent ${notified}/${profiles.length} notifications (hour ${targetHour} VN)`);

    return NextResponse.json({
      success: true,
      vnHour: targetHour,
      total: profiles.length,
      notified,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Cron/push-due] Fatal error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
