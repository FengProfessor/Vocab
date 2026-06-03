import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { userId, fcmToken } = (await req.json()) as { userId?: string; fcmToken?: string };

    if (!userId || !fcmToken) {
      return NextResponse.json({ success: false, error: 'userId and fcmToken are required' }, { status: 400 });
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
      console.error('Error updating fcm_token:', error);
      return NextResponse.json({ success: false, error: 'Failed to update token' }, { status: 500 });
    }

    console.log(`[FCM] Token registered for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('FCM Register Error:', msg);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
