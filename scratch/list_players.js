const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function listPlayersRaw() {
  const res = await axios.get(
    `https://onesignal.com/api/v1/players?app_id=${ONESIGNAL_APP_ID}&limit=10`,
    { headers: { Authorization: `Basic ${ONESIGNAL_REST_API_KEY}` } }
  );
  
  const players = res.data.players || [];
  console.log('Total:', res.data.total_count);
  players.forEach((p, i) => {
    console.log(`\n[${i+1}] player_id: ${p.id}`);
    console.log(`     notification_types: ${p.notification_types}`);
    console.log(`     device_type: ${p.device_type}`);
    console.log(`     last_active: ${new Date(p.last_active * 1000).toLocaleString('vi-VN')}`);
    console.log(`     invalid_identifier: ${p.invalid_identifier}`);
    console.log(`     test_type: ${p.test_type}`);
  });
}

listPlayersRaw();
