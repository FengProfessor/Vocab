import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendEmail, dueReminderHtml } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Chỉ email khi PUSH coi như chết: 0 token sống HOẶC token tươi nhất cũ ≥ ngưỡng này.
// = tầng leo thang sau khi banner in-app (>=5 ngày) bị phớt lờ.
const STALE_EMAIL_DAYS = 7;

type Prof = { id: string; full_name: string | null; role: string; email: string | null };

/**
 * GET /api/cron/email-due — nhắc ôn tập QUA EMAIL cho user mà push đã chết.
 * Auth: Bearer <CRON_SECRET> hoặc ?secret=. Chạy 1 mốc/ngày (cron-job.org).
 * Test: ?test=email@x.com (gửi 1 mail mẫu, bỏ qua mọi gate). ?dry=1 (tính, không gửi).
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    const envSecret = process.env.CRON_SECRET;
    const ok = !!envSecret && (authHeader === `Bearer ${envSecret}` || secret === envSecret);
    if (!ok) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    // ?test= → gửi 1 email mẫu, bỏ gate (kiểm tra deliverability)
    const testEmail = searchParams.get('test');
    if (testEmail) {
      const r = await sendEmail(testEmail, '⏰ [TEST] Nhắc ôn tập — LingoPro', dueReminderHtml('Bạn', 5));
      return NextResponse.json({ success: !r.error, test: testEmail, result: r });
    }
    const dry = searchParams.get('dry') === '1';
    const now = Date.now();
    const staleMs = STALE_EMAIL_DAYS * 86_400_000;

    // Ứng viên: student có email
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('role', 'student')
      .not('email', 'is', null);
    if (profErr) return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
    if (!profiles?.length) return NextResponse.json({ success: true, total: 0, sent: 0, results: [] });

    const processUser = async (p: Prof) => {
      if (!p.email || p.email.endsWith('@lingopro.test')) return null; // bỏ tài khoản demo

      // Push còn sống? → KHÔNG email (tránh nhắc trùng)
      const { data: toks } = await supabase
        .from('fcm_tokens').select('last_used_at').eq('user_id', p.id)
        .order('last_used_at', { ascending: false }).limit(1);
      const freshest = toks?.[0]?.last_used_at ? new Date(toks[0].last_used_at).getTime() : 0;
      const pushDead = !freshest || now - freshest >= staleMs;
      if (!pushDead) return null;

      // Đếm từ đến hạn (giống cron push-due)
      const { data: enr } = await supabase.from('enrollments').select('classroom_id').eq('student_id', p.id);
      const classroomIds = enr?.map(e => e.classroom_id) || [];
      if (!classroomIds.length) return null;
      const { data: words } = await supabase.from('words').select('id').in('classroom_id', classroomIds);
      if (!words?.length) return null;
      const { data: srs } = await supabase.from('srs_progress')
        .select('word_id, next_review_date').eq('user_id', p.id).in('word_id', words.map(w => w.id));
      const srsMap = new Map(srs?.map(s => [s.word_id, s.next_review_date]) || []);
      const dueCount = words.filter(w => {
        const d = srsMap.get(w.id);
        return !d || new Date(d) <= new Date();
      }).length;
      if (dueCount === 0) return null;

      if (dry) return { userId: p.id, email: p.email, dueCount, sent: false, dry: true };
      const r = await sendEmail(p.email, `⏰ ${dueCount} từ đang chờ ôn tập — LingoPro`, dueReminderHtml(p.full_name || 'bạn', dueCount));
      return { userId: p.id, email: p.email, dueCount, sent: !r.error, error: r.error };
    };

    const CONC = 8;
    const all = profiles as Prof[];
    const results: NonNullable<Awaited<ReturnType<typeof processUser>>>[] = [];
    for (let i = 0; i < all.length; i += CONC) {
      const settled = await Promise.allSettled(all.slice(i, i + CONC).map(processUser));
      settled.forEach(s => { if (s.status === 'fulfilled' && s.value) results.push(s.value); });
    }

    const sent = results.filter(r => r.sent).length;
    console.log(`[Cron/email-due] sent ${sent}/${results.length} (candidates ${all.length})`);
    return NextResponse.json({ success: true, total: all.length, eligible: results.length, sent, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Cron/email-due] Fatal:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
