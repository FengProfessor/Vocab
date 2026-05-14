const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function sendSuccessPayload() {
  console.log('--- Gửi bằng payload từng thành công lúc 11:49 ---');
  
  try {
    const res = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: '⏰ Đến giờ ôn tập!', vi: '⏰ Đến giờ ôn tập!' },
        contents: {
          en: 'Bạn có từ vựng cần ôn tập rồi! Vào LingoPro học ngay nhé 🧠',
          vi: 'Bạn có từ vựng cần ôn tập rồi! Vào LingoPro học ngay nhé 🧠',
        },
        // Dùng url (không phải web_url) như bản cũ
        url: 'https://lingopro-nu.vercel.app/student',
        ios_sound: 'default',
        ios_badge_type: 'Increase',
        ios_badge_count: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );
    console.log('Kết quả:', res.data);
  } catch (err) {
    console.error('Lỗi:', err.response?.data || err.message);
  }
}

sendSuccessPayload();
