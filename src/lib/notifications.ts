import axios from 'axios';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * Gửi push notification đến TẤT CẢ người dùng
 */
export async function sendPushNotificationToAll(title: string, message: string, url: string = '/') {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal] Keys missing');
    return null;
  }

  const response = await axios.post(
    'https://onesignal.com/api/v1/notifications',
    {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['All'],
      headings: { en: title, vi: title },
      contents: { en: message, vi: message },
      url: `https://lingopro-nu.vercel.app${url}`,
    },
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
    }
  );
  return response.data;
}

/**
 * Gửi push notification đến MỘT user cụ thể theo external_user_id (Supabase UUID)
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  message: string,
  url: string = '/student'
) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal] Keys missing');
    return null;
  }

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        // Gửi đúng user theo external_user_id = Supabase UUID
        include_aliases: {
          external_id: [userId],
        },
        target_channel: 'push',
        headings: { en: title, vi: title },
        contents: { en: message, vi: message },
        url: `https://lingopro-nu.vercel.app${url}`,
        // iOS specific
        ios_sound: 'default',
        ios_badge_type: 'Increase',
        ios_badge_count: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );
    console.log(`[OneSignal] Sent to user ${userId}:`, response.data);
    return response.data;
  } catch (err: any) {
    console.error(`[OneSignal] Failed to send to ${userId}:`, err.response?.data || err.message);
    return null;
  }
}

// Alias for backward compatibility
export const sendPushNotification = sendPushNotificationToAll;
