import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendPushNotificationToUser } from '@/lib/notifications';

// firebase-admin cần Node runtime; cron route không được cache
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Xử lý nhiều user/lần → nâng trần thời gian (Hobby mặc định 10s, kill sớm khi user đông).
export const maxDuration = 60;

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string;
  fcm_token: string | null;
};
type PushResult = { userId: string; name: string | null; dueCount: number; sent: boolean };

// Khung giờ nhắc trong ngày (giờ VN). Cron chạy mỗi giờ nhưng chỉ gửi vào các mốc này.
// Nhiều mốc → user ít bỏ lỡ từ đến hạn. Sửa mảng này để đổi lịch nhắc.
const REMINDER_HOURS = [8, 12, 20]; // sáng / trưa / tối

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
 * Chạy MỖI GIỜ (GitHub Actions). Chỉ gửi vào các khung REMINDER_HOURS (giờ VN):
 * mỗi user có fcm_token + có từ đến hạn được nhắc ở từng mốc → ít bỏ lỡ.
 *
 * Authorization: Bearer <CRON_SECRET> hoặc query ?secret=<CRON_SECRET>
 * Test: ?hour=20 (ép giờ; phải thuộc REMINDER_HOURS) hoặc ?all=1 (bỏ cổng giờ, gửi mọi user có từ due).
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

    // Cổng giờ: chỉ nhắc vào các khung REMINDER_HOURS (trừ khi ?all=1 để test)
    if (!sendAll && !REMINDER_HOURS.includes(targetHour)) {
      return NextResponse.json({
        success: true, vnHour: targetHour, skipped: 'not a reminder hour',
        reminderHours: REMINDER_HOURS, total: 0, notified: 0, results: [],
      });
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // Gom user_id CÓ thiết bị: bảng fcm_tokens (đa thiết bị) + legacy profiles.fcm_token.
    // Tránh bỏ sót user chỉ còn token ở fcm_tokens (vd profiles.fcm_token đã bị dọn khi token chết).
    const userIds = new Set<string>();
    const { data: tokenRows } = await supabase.from('fcm_tokens').select('user_id');
    tokenRows?.forEach((r: { user_id: string | null }) => { if (r.user_id) userIds.add(r.user_id); });
    const { data: legacyRows } = await supabase.from('profiles').select('id').not('fcm_token', 'is', null);
    legacyRows?.forEach((r: { id: string }) => { if (r.id) userIds.add(r.id); });

    if (userIds.size === 0) {
      console.log(`[Cron/push-due] No users with tokens for hour ${targetHour} (VN)`);
      return NextResponse.json({ success: true, vnHour: targetHour, total: 0, notified: 0, results: [] });
    }

    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, role, fcm_token')
      .in('id', Array.from(userIds));

    if (profErr) {
      console.error('[Cron/push-due] Profile query error:', profErr.message);
      return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
    }

    if (!profiles?.length) {
      console.log(`[Cron/push-due] No candidate users for hour ${targetHour} (VN)`);
      return NextResponse.json({ success: true, vnHour: targetHour, total: 0, notified: 0, results: [] });
    }

    console.log(`[Cron/push-due] ${profiles.length} candidate(s) for hour ${targetHour} (VN)`);

    // Xử lý 1 user: đếm từ đến hạn → gửi push. Trả null nếu không có lớp/không có từ due.
    const processUser = async (profile: ProfileRow): Promise<PushResult | null> => {
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

      if (!classroomIds.length) return null;

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

      if (dueCount === 0) return null;

      const firstName = (profile.full_name || 'bạn').split(' ').pop();

      const sendResult = await sendPushNotificationToUser(
        profile.id,
        '⏰ Thời Điểm Ôn Tập!',
        `${firstName} ơi, bạn có ${dueCount} từ đang chờ ôn tập. Học ngay để không quên nhé! 🧠`,
        '/student'
      );

      const sent = !!(sendResult as { messageId?: string } | undefined)?.messageId;
      return { userId: profile.id, name: profile.full_name, dueCount, sent };
    };

    // Chạy song song theo lô (tuần tự ~0.5-1s/user → vài chục user là timeout).
    // Concurrency vừa phải để không nghẽn connection Supabase / quota FCM.
    const CONCURRENCY = 15;
    const allProfiles = profiles as ProfileRow[];
    const results: PushResult[] = [];

    for (let i = 0; i < allProfiles.length; i += CONCURRENCY) {
      const batch = allProfiles.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(batch.map(processUser));
      settled.forEach((s, idx) => {
        if (s.status === 'fulfilled') {
          if (s.value) results.push(s.value);
        } else {
          const reason = s.reason instanceof Error ? s.reason.message : String(s.reason);
          console.error(`[Cron/push-due] Error processing user ${batch[idx].id}:`, reason);
        }
      });
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
