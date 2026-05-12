const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function sendBroadcast() {
  console.log('--- Gửi broadcast (web_url only) ---');
  
  try {
    const res = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: '⏰ LingoPro - Ôn từ vựng ngay!', vi: '⏰ LingoPro - Ôn từ vựng ngay!' },
        contents: {
          en: 'Bạn có từ vựng cần ôn tập! Tap vào đây để học ngay 🧠',
          vi: 'Bạn có từ vựng cần ôn tập! Tap vào đây để học ngay 🧠',
        },
        // Safari Web Push chỉ cần web_url (không kèm url)
        web_url: 'https://lingopro-nu.vercel.app/student',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );
    console.log('Kết quả gửi:', JSON.stringify(res.data, null, 2));
    
    if (res.data.id) {
      await new Promise(r => setTimeout(r, 4000));
      const check = await axios.get(
        `https://onesignal.com/api/v1/notifications/${res.data.id}?app_id=${ONESIGNAL_APP_ID}`,
        { headers: { Authorization: `Basic ${ONESIGNAL_REST_API_KEY}` } }
      );
      const d = check.data;
      console.log('\n📊 Kết quả sau 4 giây:');
      console.log(`  Thành công: ${d.successful}`);
      console.log(`  Thất bại: ${d.failed}`);
      console.log(`  Lỗi: ${d.errored}`);
      console.log('  Platform:', JSON.stringify(d.platform_delivery_stats, null, 2));
    }
  } catch (err) {
    console.error('Lỗi:', err.response?.data || err.message);
  }
}

sendBroadcast();
