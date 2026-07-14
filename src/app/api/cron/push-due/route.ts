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
  last_due_push_slot?: string | null;
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

/** Phút hiện tại (0-59) theo giờ VN — dùng suy ra số trang khi chia tải theo thời gian. */
function getVietnamMinute(): number {
  const str = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    minute: '2-digit',
  }).format(new Date());
  return parseInt(str, 10) % 60;
}

/** Ngày hiện tại theo giờ VN, dạng 'YYYY-MM-DD' (để ghép slot khử push trùng). */
function getVietnamDateStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
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

    // Slot khử trùng: 1 user chỉ nhận 1 push/mốc/ngày dù nhiều nguồn cron cùng bắn.
    // Bỏ qua khi test (?hour= hoặc ?all=1) để không vướng dedup lúc thử.
    const isTest = hourParam !== null || sendAll;
    const slotKey = `${getVietnamDateStr()}-${targetHour}`;

    // ── Chia tải theo thời gian (chống timeout khi nhiều user) — OPT-IN ──
    // Mặc định (không truyền ?size=/?page=): xử lý TOÀN BỘ như cũ → an toàn tới ~vài trăm user
    // với 1 trigger/mốc. Khi scale 1000+: đặt lịch cron NHIỀU lần TRONG mốc giờ, mỗi lần thêm
    // ?size=250 → route tự cắt trang theo phút VN (mỗi `step` phút = 1 trang; 8:00→p0, 8:05→p1...).
    // Truyền ?page= để ép trang cụ thể. Test (?all=1/?hour=) luôn xử lý toàn bộ.
    const pageParam = searchParams.get('page');
    const paginated = !isTest && (pageParam !== null || searchParams.has('size'));
    const size = Math.min(Math.max(parseInt(searchParams.get('size') || '250', 10) || 250, 1), 1000);
    const stepMin = Math.min(Math.max(parseInt(searchParams.get('step') || '5', 10) || 5, 1), 30);
    const page = pageParam !== null
      ? Math.max(parseInt(pageParam, 10) || 0, 0)
      : Math.floor(getVietnamMinute() / stepMin);

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

    // Sắp xếp ổn định theo id → cắt trang (thứ tự nhất quán giữa các lần gọi trong slot).
    const allIds = Array.from(userIds).sort();
    const totalCandidates = allIds.length;
    const totalPages = paginated ? Math.ceil(totalCandidates / size) : 1;
    const pageIds = paginated ? allIds.slice(page * size, page * size + size) : allIds;

    if (pageIds.length === 0) {
      // Trang vượt quá danh sách (đã hết user) → no-op.
      return NextResponse.json({
        success: true, vnHour: targetHour, page, totalPages, totalCandidates,
        total: 0, notified: 0, results: [],
      });
    }

    // Chunk .in() ≤200 id/lần để né giới hạn độ dài URL của PostgREST khi trang lớn.
    const IN_CHUNK = 200;
    const profiles: ProfileRow[] = [];
    for (let i = 0; i < pageIds.length; i += IN_CHUNK) {
      const slice = pageIds.slice(i, i + IN_CHUNK);
      const { data, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, role, fcm_token, last_due_push_slot')
        .in('id', slice);
      if (profErr) {
        console.error('[Cron/push-due] Profile query error:', profErr.message);
        return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
      }
      if (data) profiles.push(...(data as ProfileRow[]));
    }

    if (!profiles.length) {
      console.log(`[Cron/push-due] No candidate users for hour ${targetHour} (VN)`);
      return NextResponse.json({ success: true, vnHour: targetHour, page, totalPages, total: 0, notified: 0, results: [] });
    }

    console.log(`[Cron/push-due] page ${page}/${totalPages} — ${profiles.length} candidate(s) for hour ${targetHour} (VN)`);

    // Xử lý 1 user: đếm từ đến hạn → gửi push. Trả null nếu không có từ due.
    const processUser = async (profile: ProfileRow): Promise<PushResult | null> => {
      // (1) Từ user ĐANG học đến hạn — nguồn chính, tính TRỰC TIẾP từ srs_progress.
      // Bao cả từ cá nhân (lưu qua extension/dictionary/pack tự học) LẪN từ trong lớp
      // đã bắt đầu học. Học sinh tự học không vào lớp vẫn được nhắc ôn.
      const { count: dueStarted } = await supabase
        .from('srs_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .lte('next_review_date', now);

      let dueCount = dueStarted ?? 0;

      // (2) Từ MỚI được giao trong lớp (chưa có srs record) — nhắc học sinh bắt đầu.
      // Chỉ tính khi user có lớp; nếu không có lớp thì bỏ qua, không chặn (1).
      let classroomIds: string[] = [];
      if (profile.role === 'teacher') {
        const { data } = await supabase.from('classrooms').select('id').eq('teacher_id', profile.id);
        classroomIds = data?.map(c => c.id) || [];
      } else {
        const { data } = await supabase.from('enrollments').select('classroom_id').eq('student_id', profile.id);
        classroomIds = data?.map(e => e.classroom_id) || [];
      }

      if (classroomIds.length) {
        const { data: classWords } = await supabase
          .from('words')
          .select('id')
          .in('classroom_id', classroomIds);
        if (classWords?.length) {
          const { data: srsRows } = await supabase
            .from('srs_progress')
            .select('word_id')
            .eq('user_id', profile.id)
            .in('word_id', classWords.map(w => w.id));
          const started = new Set(srsRows?.map(s => s.word_id) || []);
          const newInClass = classWords.filter(w => !started.has(w.id)).length;
          dueCount += newInClass;
        }
      }

      if (dueCount === 0) return null;

      // Khử trùng đa nguồn cron: claim slot bằng UPDATE có điều kiện (atomic per-row trong
      // Postgres). Chỉ nguồn claim được mới gửi; nguồn khác thấy slot trùng → 0 row → skip.
      // Nếu cột chưa tồn tại (migration chưa chạy) → claimErr → vẫn gửi như cũ (không chặn).
      const prevSlot = profile.last_due_push_slot ?? null;
      if (!isTest) {
        const { data: claimed, error: claimErr } = await supabase
          .from('profiles')
          .update({ last_due_push_slot: slotKey })
          .eq('id', profile.id)
          .or(`last_due_push_slot.is.null,last_due_push_slot.neq.${slotKey}`)
          .select('id');
        if (claimErr) {
          console.warn('[Cron/push-due] dedup claim skipped:', claimErr.message);
        } else if (!claimed?.length) {
          return null; // slot đã được nguồn cron khác gửi
        }
      }

      const firstName = (profile.full_name || 'bạn').split(' ').pop();

      const sendResult = await sendPushNotificationToUser(
        profile.id,
        '⏰ Thời Điểm Ôn Tập!',
        `${firstName} ơi, bạn có ${dueCount} từ đang chờ ôn tập. Học ngay để không quên nhé! 🧠`,
        '/student'
      );

      const sent = !!(sendResult as { messageId?: string } | undefined)?.messageId;

      // Gửi fail → rollback slot để mốc sau / cron retry còn cơ hội (tránh claim xong im lặng).
      if (!sent && !isTest) {
        const { error: rbErr } = await supabase
          .from('profiles')
          .update({ last_due_push_slot: prevSlot })
          .eq('id', profile.id)
          .eq('last_due_push_slot', slotKey);
        if (rbErr) console.warn('[Cron/push-due] slot rollback failed:', rbErr.message);
        else console.warn(`[Cron/push-due] send fail → rollback slot for ${profile.id.slice(0, 8)}`);
      }

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
      page,
      totalPages,
      totalCandidates,
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
