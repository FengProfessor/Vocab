import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, fcmToken } = await req.json();

    if (!userId || !fcmToken) {
      return NextResponse.json({ error: 'userId and fcmToken are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Lưu fcmToken vào profile của user
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', userId);

    if (error) {
      console.error('Error updating fcm_token:', error);
      return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
    }

    console.log(`[FCM] Token updated for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('FCM Register Error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
