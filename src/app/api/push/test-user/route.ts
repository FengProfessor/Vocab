import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendPushNotificationToUser } from '@/lib/notifications';

// firebase-admin cần Node runtime; không cache
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/push/test-user — gửi 1 push THẬT tới ĐÚNG 1 user (test có mục tiêu).
 * Không đụng học sinh khác. Gate bằng CRON_SECRET (admin only).
 *
 *   ?secret=<CRON_SECRET>&user=<email|user_id>
 *
 * Trả về số token + kết quả gửi (sentCount / error) để chẩn đoán push.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const authHeader = req.headers.get('authorization');
  const envSecret = process.env.CRON_SECRET;

  const isAuthorized =
    !!envSecret && (authHeader === `Bearer ${envSecret}` || secret === envSecret);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const q = searchParams.get('user');
  if (!q) {
    return NextResponse.json({ success: false, error: 'Missing ?user=<email|id>' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Tìm đúng 1 user theo id (uuid) hoặc email
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .or(isUuid ? `id.eq.${q}` : `email.ilike.${q}`)
    .limit(1);

  const target = profs?.[0];
  if (!target) {
    return NextResponse.json({ success: false, error: `No user matches "${q}"` }, { status: 404 });
  }

  // Đếm token trước khi gửi (để phân biệt "0 token" vs "gửi fail")
  const { data: toks } = await supabase.from('fcm_tokens').select('token').eq('user_id', target.id);
  const { data: prof } = await supabase.from('profiles').select('fcm_token').eq('id', target.id).single();
  const tokenCount = new Set([
    ...(toks?.map(t => t.token).filter(Boolean) as string[] || []),
    ...(prof?.fcm_token ? [prof.fcm_token] : []),
  ]).size;

  const result = await sendPushNotificationToUser(
    target.id,
    '🔔 Test LingoPro',
    'Đây là thông báo thử. Nếu bạn thấy tin này thì push đã hoạt động! 🎉',
    '/student'
  );

  return NextResponse.json({
    success: true,
    user: { id: target.id, email: target.email, name: target.full_name },
    tokenCount,
    result,
  });
}
