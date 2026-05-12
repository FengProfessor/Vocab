const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const USER_ID = '41124548-ffb7-4584-aa87-e9b6d005b662';
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function sendTestToUser() {
  console.log(`--- Gửi test notification đến user: ${USER_ID} ---`);
  
  try {
    const res = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [USER_ID] },
        target_channel: 'push',
        headings: { en: '🎯 LingoPro - Test thành công!', vi: '🎯 LingoPro - Test thành công!' },
        contents: {
          en: 'Nếu bạn thấy thông báo này, hệ thống đã gắn đúng tài khoản. Nhắc học sẽ về đúng máy bạn! 🎉',
          vi: 'Nếu bạn thấy thông báo này, hệ thống đã gắn đúng tài khoản. Nhắc học sẽ về đúng máy bạn! 🎉',
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
      console.log('⚠️ Có lỗi:', res.data.errors);
    } else {
      console.log('✅ Đã gửi! ID:', res.data.id);
    }
  } catch (err) {
    console.error('Lỗi:', err.response?.data || err.message);
  }
}

sendTestToUser();
