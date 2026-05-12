const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function listPlayers() {
  console.log('--- Danh sách thiết bị đã đăng ký trong OneSignal ---');
  
  try {
    const res = await axios.get(
      `https://onesignal.com/api/v1/players?app_id=${ONESIGNAL_APP_ID}&limit=10`,
      {
        headers: { Authorization: `Basic ${ONESIGNAL_REST_API_KEY}` },
      }
    );
    
    const players = res.data.players || [];
    console.log(`Tổng số thiết bị: ${res.data.total_count}`);
    console.log('');
    
    players.forEach((p, i) => {
      console.log(`[${i+1}] ID: ${p.id}`);
      console.log(`     External User ID: ${p.external_user_id || '⚠️ CHƯA GẮN (ẩn danh)'}`);
      console.log(`     Device: ${p.device_type === 0 ? 'iOS' : p.device_type === 1 ? 'Android' : 'Web/Other ('+p.device_type+')'}`);
      console.log(`     Last Active: ${p.last_active ? new Date(p.last_active * 1000).toLocaleString('vi-VN') : 'Unknown'}`);
      console.log(`     Subscribed: ${p.notification_types === 1 ? '✅ Có' : '❌ Không'}`);
      console.log('');
    });
  } catch (err) {
    console.error('Lỗi:', err.response?.data || err.message);
  }
}

listPlayers();
