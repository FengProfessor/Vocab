const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Thiết bị [5] - Last active hôm nay 11:18
const PLAYER_ID = '7aa09f84-1c13-4d2c-bf3c-bfddd346171f';

async function sendToPlayer() {
  console.log(`--- Gửi trực tiếp đến Player ID: ${PLAYER_ID} ---`);
  
  try {
    const res = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [PLAYER_ID],
        headings: { en: '🎯 LingoPro Test!', vi: '🎯 LingoPro Test!' },
        contents: {
          en: 'Nhận được không? Nếu có, thông báo đã hoạt động! 🎉',
          vi: 'Nhận được không? Nếu có, thông báo đã hoạt động! 🎉',
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
    console.log('Kết quả:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Lỗi:', err.response?.data || err.message);
  }
}

sendToPlayer();
