const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Player mới nhất - đăng ký lúc 12:14 hôm nay
const NEWEST_PLAYER = '7d46375b-2992-4a24-b5ff-5d8e82d3d486';

async function sendDirectAndCheck() {
  console.log('--- Gửi trực tiếp vào player mới nhất ---');
  
  const res = await axios.post(
    'https://onesignal.com/api/v1/notifications',
    {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [NEWEST_PLAYER],
      headings: { en: '🎯 Test Thông Báo Nền!', vi: '🎯 Test Thông Báo Nền!' },
      contents: {
        en: 'Nếu thấy tin này khi app tắt → hệ thống hoạt động hoàn toàn! 🎉',
        vi: 'Nếu thấy tin này khi app tắt → hệ thống hoạt động hoàn toàn! 🎉',
      },
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
  
  // Chờ 5 giây rồi kiểm tra delivery
  await new Promise(r => setTimeout(r, 5000));
  
  const check = await axios.get(
    `https://onesignal.com/api/v1/notifications/${res.data.id}?app_id=${ONESIGNAL_APP_ID}`,
    { headers: { Authorization: `Basic ${ONESIGNAL_REST_API_KEY}` } }
  );
  
  const d = check.data;
  console.log('\n📊 Delivery report:');
  console.log(`  successful: ${d.successful}`);
  console.log(`  failed: ${d.failed}`);
  console.log(`  errored: ${d.errored}`);
  console.log(`  errors: ${JSON.stringify(d.errors)}`);
}

sendDirectAndCheck().catch(console.error);
