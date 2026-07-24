import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // ── Auth: verify JWT → lấy userId từ token, KHÔNG tin client ──
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const { fcmToken } = (await req.json()) as { fcmToken?: string };

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length > 500) {
      return NextResponse.json({ success: false, error: 'Valid fcmToken is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Token FCM = 1 thiết bị/browser. Claim độc quyền:
    // cùng token gắn nhiều user (đổi tài khoản trên 1 máy) → broadcast/cron bắn 2 TB xuống 1 phone.
    const { error: stealErr } = await supabase
      .from('fcm_tokens')
      .delete()
      .eq('token', fcmToken)
      .neq('user_id', userId);
    if (stealErr) {
      console.warn('[FCM] exclusive token claim skipped:', stealErr.message);
    }
    // Legacy: gỡ token này khỏi profile user khác
    await supabase
      .from('profiles')
      .update({ fcm_token: null })
      .eq('fcm_token', fcmToken)
      .neq('id', userId);

    // Upsert token hiện tại.
    const { error: tokErr } = await supabase
      .from('fcm_tokens')
      .upsert(
        { user_id: userId, token: fcmToken, last_used_at: new Date().toISOString() },
        { onConflict: 'user_id,token' }
      );
    if (tokErr) {
      // Bảng chưa tồn tại (migration chưa chạy) → bỏ qua, vẫn dùng legacy bên dưới
      console.warn('[FCM] fcm_tokens upsert skipped:', tokErr.message);
    } else {
      // 1 user = 1 endpoint active: gỡ token cũ (app cài 2 lần / MT+DT) → cron không bắn N TB.
      // Máy khác muốn nhận lại: mở app trên máy đó (register ghi đè).
      const { error: pruneErr, count: pruned } = await supabase
        .from('fcm_tokens')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .neq('token', fcmToken);
      if (pruneErr) {
        console.warn('[FCM] prune old tokens skipped:', pruneErr.message);
      } else if (pruned && pruned > 0) {
        console.log(`[FCM] Pruned ${pruned} old token(s) for user ${userId.slice(0, 8)}`);
      }
    }

    // Legacy: vẫn ghi profiles.fcm_token để tương thích ngược
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', userId);

    if (error) {
      return safeErrorResponse(error, 'Failed to update token');
    }

    console.log(`[FCM] Token registered for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Internal Server Error');
  }
}

/**
 * GET /api/push/fcm-register — đếm token sống của user hiện tại.
 * Dùng cho banner tự-lành: permission='granted' nhưng 0 token → mời "Kết nối lại".
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const supabase = createServiceClient();
    // Lấy last_used_at để tính tuổi token tươi nhất (banner reconnect dùng cả count=0 LẪN token cũ).
    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('last_used_at')
      .eq('user_id', auth.userId)
      .order('last_used_at', { ascending: false });

    if (error) {
      // Bảng thiếu / lỗi → coi như không xác định được, trả -1 để client KHÔNG hiện banner sai
      console.warn('[FCM] count tokens failed:', error.message);
      return NextResponse.json({ success: true, count: -1, staleDays: null });
    }

    let total = data?.length ?? 0;
    // Tuổi (ngày) của token được dùng gần nhất = MAX(last_used_at). Token cũ → nguy cơ chết.
    let staleDays: number | null = null;
    const freshest = data?.[0]?.last_used_at;
    if (freshest) {
      staleDays = Math.floor((Date.now() - new Date(freshest).getTime()) / 86_400_000);
    }

    // Fallback legacy: fcm_tokens trống nhưng profiles.fcm_token còn → tính 1, tuổi không xác định
    if (total === 0) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('fcm_token')
        .eq('id', auth.userId)
        .maybeSingle();
      if (prof?.fcm_token) { total = 1; staleDays = null; }
    }

    return NextResponse.json({ success: true, count: total, staleDays });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Internal Server Error');
  }
}
