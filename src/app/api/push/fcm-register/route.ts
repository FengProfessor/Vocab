import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { userId, fcmToken } = (await req.json()) as { userId?: string; fcmToken?: string };

    if (!userId || !fcmToken) {
      return NextResponse.json({ success: false, error: 'userId and fcmToken are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Lưu fcmToken vào profile của user
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', userId);

    if (error) {
      console.error('Error updating fcm_token:', error);
      return NextResponse.json({ success: false, error: 'Failed to update token' }, { status: 500 });
    }

    console.log(`[FCM] Token updated for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('FCM Register Error:', msg);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
