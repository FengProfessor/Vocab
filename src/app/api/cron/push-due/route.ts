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

/**
 * Chế độ "dày nhưng không spam":
 * - Cron poll mỗi ~15p → từ vừa đến hạn được bắt sớm (không chờ mốc 8/12/20).
 * - COOLDOWN_MINUTES = khoảng cách tối thiểu giữa 2 lần push nếu user VẪN chưa ôn
 *   (1–2h; mặc định 90p). Poll 15p chỉ để phát hiện due, không gửi lại mỗi 15p.
 * - QUIET_HOURS: im ban đêm (giờ VN).
 * - last_due_push_slot lưu `ts:{epochMs}` = mốc gửi gần nhất (true cooldown, không bucket lịch).
 */
const COOLDOWN_MINUTES = 90;
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;
/** [start, end) theo phút trong ngày VN — im lặng. 22:30→05:30. */
const QUIET_START_MIN = 22 * 60 + 30; // 22:30
const QUIET_END_MIN = 5 * 60 + 30;    // 05:30

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

/** true nếu đang trong khung im lặng ban đêm (phút trong ngày VN). */
function isQuietTime(hour: number, minute: number): boolean {
  const m = hour * 60 + minute;
  // Wrap qua nửa đêm (22:30→05:30): im khi m >= 22:30 hoặc m < 05:30
  if (QUIET_START_MIN > QUIET_END_MIN) {
    return m >= QUIET_START_MIN || m < QUIET_END_MIN;
  }
  if (QUIET_START_MIN < QUIET_END_MIN) {
    return m >= QUIET_START_MIN && m < QUIET_END_MIN;
  }
  return false; // start === end → không im
}

function formatHm(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse mốc gửi gần nhất từ last_due_push_slot (`ts:1716…`). Legacy slot (YYYY-MM-DD-…) → null = hết cooldown. */
function parsePushTs(slot: string | null | undefined): number | null {
  if (!slot || !slot.startsWith('ts:')) return null;
  const n = Number(slot.slice(3));
  return Number.isFinite(n) ? n : null;
}

function makePushSlot(nowMs: number = Date.now()): string {
  return `ts:${nowMs}`;
}

/** true nếu user còn trong cửa sổ cooldown (đã nhận push gần đây). */
function inCooldown(slot: string | null | undefined, nowMs: number = Date.now()): boolean {
  const prevTs = parsePushTs(slot);
  if (prevTs === null) return false;
  return nowMs - prevTs < COOLDOWN_MS;
}

/** Title/body theo độ "nặng" due — user lười thì copy gắt hơn. */
function buildCopy(firstName: string, dueCount: number): { title: string; body: string } {
  if (dueCount >= 40) {
    return {
      title: '🔥 Cháy bài rồi — ôn ngay!',
      body: `${firstName} ơi, ${dueCount} từ đang chờ. Càng để lâu càng quên. 2 phút thôi! 🧠`,
    };
  }
  if (dueCount >= 15) {
    return {
      title: '⏰ Nhiều từ đến hạn!',
      body: `${firstName} ơi, bạn có ${dueCount} từ cần ôn. Học ngay kẻo mất streak 🧠`,
    };
  }
  if (dueCount >= 5) {
    return {
      title: '⏰ Từ đến hạn — ôn luôn!',
      body: `${firstName} ơi, ${dueCount} từ đang chờ ôn. Mở app học ngay nhé! 🧠`,
    };
  }
  return {
    title: '⏰ Từ vừa đến hạn!',
    body: `${firstName} ơi, có ${dueCount} từ đến hạn ôn. Học ngay để không quên nhé! 🧠`,
  };
}

/**
 * GET /api/cron/push-due
 * Poll ~15p (GitHub Actions). User có token + có từ due → push sớm khi vừa đến hạn;
 * nếu vẫn chưa ôn thì re-nag sau COOLDOWN_MINUTES (~90p), không spam mỗi lần poll.
 * Im ban đêm (QUIET_*).
 *
 * Authorization: Bearer <CRON_SECRET> (không dùng ?secret= — tránh leak access log)
 * Test: ?all=1 (bỏ quiet + dedup), ?hour=N (ép giờ VN), ?force=1 (bỏ quiet giờ).
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { assertCronAuthorized } = await import('@/lib/api-security');
    const denied = assertCronAuthorized(req);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);

    // Giờ mục tiêu: mặc định = giờ VN hiện tại; ?hour= để test
    const hourParam = searchParams.get('hour');
    const sendAll = searchParams.get('all') === '1';
    const forceQuiet = searchParams.get('force') === '1';
    const targetHour =
      hourParam !== null ? parseInt(hourParam, 10) % 24 : getVietnamHour();
    const targetMinute = hourParam !== null ? 0 : getVietnamMinute();

    // Im ban đêm 22:30–05:30 VN — trừ test (?all=1 / ?force=1)
    if (!sendAll && !forceQuiet && isQuietTime(targetHour, targetMinute)) {
      return NextResponse.json({
        success: true,
        vnHour: targetHour,
        vnMinute: targetMinute,
        skipped: 'quiet hours',
        quiet: { start: formatHm(QUIET_START_MIN), end: formatHm(QUIET_END_MIN) },
        total: 0,
        notified: 0,
        results: [],
      });
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // Cooldown: 1 user tối đa 1 push / COOLDOWN_MINUTES khi vẫn còn due (tránh spam 15p).
    // Bỏ qua khi test (?hour= hoặc ?all=1) để không vướng dedup lúc thử.
    const isTest = hourParam !== null || sendAll;
    const runStartedAt = Date.now();

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
      console.log(`[Cron/push-due] No users with tokens (VN ${targetHour}:${String(targetMinute).padStart(2, '0')})`);
      return NextResponse.json({
        success: true, vnHour: targetHour, vnMinute: targetMinute, total: 0, notified: 0, results: [],
      });
    }

    // Sắp xếp ổn định theo id → cắt trang (thứ tự nhất quán giữa các lần gọi trong slot).
    const allIds = Array.from(userIds).sort();
    const totalCandidates = allIds.length;
    const totalPages = paginated ? Math.ceil(totalCandidates / size) : 1;
    const pageIds = paginated ? allIds.slice(page * size, page * size + size) : allIds;

    if (pageIds.length === 0) {
      // Trang vượt quá danh sách (đã hết user) → no-op.
      return NextResponse.json({
        success: true, vnHour: targetHour, vnMinute: targetMinute, page, totalPages, totalCandidates,
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
      console.log(`[Cron/push-due] No candidate users (VN ${targetHour}:${String(targetMinute).padStart(2, '0')})`);
      return NextResponse.json({
        success: true, vnHour: targetHour, vnMinute: targetMinute, page, totalPages, total: 0, notified: 0, results: [],
      });
    }

    console.log(
      `[Cron/push-due] page ${page}/${totalPages} — ${profiles.length} candidate(s) ` +
      `cooldown=${COOLDOWN_MINUTES}m (VN ${targetHour}:${String(targetMinute).padStart(2, '0')})`
    );

    // ── Bulk-count từ đến hạn qua RPC (1 query cho CẢ trang, thay N+1) ──
    // Nếu RPC chưa tồn tại (migration 20260714 chưa chạy prod) → dueMap=null → fallback
    // tính inline từng user như cũ. Deploy trước migration KHÔNG vỡ.
    let dueMap: Map<string, number> | null = null;
    {
      const { data: counts, error: rpcErr } = await supabase.rpc('push_due_counts', {
        p_user_ids: profiles.map(p => p.id),
        p_now: now,
      });
      if (rpcErr) {
        console.warn('[Cron/push-due] push_due_counts RPC unavailable → fallback inline:', rpcErr.message);
      } else if (counts) {
        dueMap = new Map(
          (counts as { user_id: string; due_count: number | string }[])
            .map(r => [r.user_id, Number(r.due_count)])
        );
      }
    }

    // Fallback: đếm due cho 1 user bằng nhiều query (dùng khi RPC chưa có).
    const computeDueInline = async (profile: ProfileRow): Promise<number> => {
      const { count: dueStarted } = await supabase
        .from('srs_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .lte('next_review_date', now);
      let dueCount = dueStarted ?? 0;

      let classroomIds: string[] = [];
      if (profile.role === 'teacher') {
        const { data } = await supabase.from('classrooms').select('id').eq('teacher_id', profile.id);
        classroomIds = data?.map(c => c.id) || [];
      } else {
        const { data } = await supabase.from('enrollments').select('classroom_id').eq('student_id', profile.id);
        classroomIds = data?.map(e => e.classroom_id) || [];
      }
      if (classroomIds.length) {
        const { data: classWords } = await supabase.from('words').select('id').in('classroom_id', classroomIds);
        if (classWords?.length) {
          const { data: srsRows } = await supabase
            .from('srs_progress').select('word_id')
            .eq('user_id', profile.id).in('word_id', classWords.map(w => w.id));
          const started = new Set(srsRows?.map(s => s.word_id) || []);
          dueCount += classWords.filter(w => !started.has(w.id)).length;
        }
      }
      return dueCount;
    };

    // Xử lý 1 user: lấy dueCount (từ RPC map hoặc inline) → gửi push. Null nếu không có từ due.
    const processUser = async (profile: ProfileRow): Promise<PushResult | null> => {
      const dueCount = dueMap ? (dueMap.get(profile.id) ?? 0) : await computeDueInline(profile);

      if (dueCount === 0) return null;

      // Cooldown thật: đã push gần đây (< COOLDOWN_MINUTES) → bỏ qua, chờ poll sau.
      const prevSlot = profile.last_due_push_slot ?? null;
      if (!isTest && inCooldown(prevSlot, runStartedAt)) {
        return null;
      }

      // Claim optimistic: UPDATE chỉ khi last_due_push_slot vẫn = giá trị đã đọc
      // (hoặc null). 2 cron song song → chỉ 1 claim được → tránh double push.
      // Nếu cột chưa tồn tại (migration chưa chạy) → claimErr → vẫn gửi như cũ.
      const newSlot = makePushSlot(Date.now());
      if (!isTest) {
        let claimQ = supabase
          .from('profiles')
          .update({ last_due_push_slot: newSlot })
          .eq('id', profile.id);
        claimQ = prevSlot === null
          ? claimQ.is('last_due_push_slot', null)
          : claimQ.eq('last_due_push_slot', prevSlot);
        const { data: claimed, error: claimErr } = await claimQ.select('id');
        if (claimErr) {
          console.warn('[Cron/push-due] dedup claim skipped:', claimErr.message);
        } else if (!claimed?.length) {
          return null; // race / đã được nguồn khác claim
        }
      }

      const firstName = (profile.full_name || 'bạn').split(' ').pop() || 'bạn';
      const { title, body } = buildCopy(firstName, dueCount);

      const sendResult = await sendPushNotificationToUser(
        profile.id,
        title,
        body,
        '/student'
      );

      const sent = !!(sendResult as { messageId?: string } | undefined)?.messageId;

      // Gửi fail → rollback slot để poll sau còn cơ hội (tránh claim xong im lặng).
      if (!sent && !isTest) {
        const { error: rbErr } = await supabase
          .from('profiles')
          .update({ last_due_push_slot: prevSlot })
          .eq('id', profile.id)
          .eq('last_due_push_slot', newSlot);
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
    console.log(
      `[Cron/push-due] Sent ${notified}/${profiles.length} notifications ` +
      `(cooldown ${COOLDOWN_MINUTES}m, VN ${targetHour}:${String(targetMinute).padStart(2, '0')})`
    );

    return NextResponse.json({
      success: true,
      vnHour: targetHour,
      vnMinute: targetMinute,
      cooldownMinutes: COOLDOWN_MINUTES,
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
