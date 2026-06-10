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

    // Đa thiết bị: mỗi (user, token) là 1 dòng. Upsert để không trùng.
    const { error: tokErr } = await supabase
      .from('fcm_tokens')
      .upsert(
        { user_id: userId, token: fcmToken, last_used_at: new Date().toISOString() },
        { onConflict: 'user_id,token' }
      );
    if (tokErr) {
      // Bảng chưa tồn tại (migration chưa chạy) → bỏ qua, vẫn dùng legacy bên dưới
      console.warn('[FCM] fcm_tokens upsert skipped:', tokErr.message);
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
    const { count, error } = await supabase
      .from('fcm_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId);

    if (error) {
      // Bảng thiếu / lỗi → coi như không xác định được, trả -1 để client KHÔNG hiện banner sai
      console.warn('[FCM] count tokens failed:', error.message);
      return NextResponse.json({ success: true, count: -1 });
    }

    // Fallback legacy: fcm_tokens trống nhưng profiles.fcm_token còn → vẫn tính là 1
    let total = count ?? 0;
    if (total === 0) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('fcm_token')
        .eq('id', auth.userId)
        .maybeSingle();
      if (prof?.fcm_token) total = 1;
    }

    return NextResponse.json({ success: true, count: total });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Internal Server Error');
  }
}
