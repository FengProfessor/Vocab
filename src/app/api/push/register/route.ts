import { NextResponse } from 'next/server';
import axios from 'axios';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * POST /api/push/register
 * Body: { userId, playerId }
 * Gắn OneSignal player_id (subscription) với Supabase userId (external_id)
 */
export async function POST(req: Request) {
  try {
    const { userId, playerId } = await req.json();

    if (!userId || !playerId) {
      return NextResponse.json({ error: 'userId and playerId required' }, { status: 400 });
    }

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return NextResponse.json({ error: 'OneSignal not configured' }, { status: 500 });
    }

    // Gắn external_user_id vào OneSignal player
    const response = await axios.patch(
      `https://onesignal.com/api/v1/players/${playerId}`,
      {
        app_id: ONESIGNAL_APP_ID,
        external_user_id: userId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );

    console.log(`[Push/Register] Linked player ${playerId} → user ${userId}`, response.data);
    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    console.error('[Push/Register] Error:', err.response?.data || err.message);
    return NextResponse.json(
      { error: err.response?.data || err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/push/send-test
 * Body: { userId }
 * Gửi thông báo test đến user cụ thể
 */
export async function PUT(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [userId] },
        target_channel: 'push',
        headings: { en: '🧪 Test Thành Công!', vi: '🧪 Test Thành Công!' },
        contents: {
          en: 'LingoPro đã gắn thông báo với tài khoản của bạn. Bây giờ nhắc học sẽ gửi đúng về máy bạn! 🎉',
          vi: 'LingoPro đã gắn thông báo với tài khoản của bạn. Bây giờ nhắc học sẽ gửi đúng về máy bạn! 🎉',
        },
        url: 'https://lingopro-nu.vercel.app/student',
        ios_sound: 'default',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.response?.data || err.message }, { status: 500 });
  }
}
