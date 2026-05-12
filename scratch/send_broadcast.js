const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Gửi đến TẤT CẢ subscriber (broadcast) - không cần external_id
async function sendBroadcast() {
  console.log('--- Gửi broadcast đến tất cả subscriber ---');
  
  try {
    const res = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: '⏰ Đến giờ ôn từ vựng!', vi: '⏰ Đến giờ ôn từ vựng!' },
        contents: {
          en: 'Bạn có từ vựng cần ôn tập rồi! Vào LingoPro học ngay nhé 🧠',
          vi: 'Bạn có từ vựng cần ôn tập rồi! Vào LingoPro học ngay nhé 🧠',
        },
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
    console.log('Kết quả:', JSON.stringify(res.data, null, 2));
    if (res.data.errors) {
      console.log('⚠️ Lỗi:', res.data.errors);
    } else {
      console.log(`✅ Đã gửi đến ${res.data.recipients} thiết bị! ID: ${res.data.id}`);
    }
  } catch (err) {
    console.error('Lỗi:', err.response?.data || err.message);
  }
}

sendBroadcast();
