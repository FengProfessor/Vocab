const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Kiểm tra chi tiết notification vừa gửi
async function checkNotification(notifId) {
  console.log(`--- Kiểm tra notification: ${notifId} ---`);
  try {
    const res = await axios.get(
      `https://onesignal.com/api/v1/notifications/${notifId}?app_id=${ONESIGNAL_APP_ID}`,
      { headers: { Authorization: `Basic ${ONESIGNAL_REST_API_KEY}` } }
    );
    const d = res.data;
    console.log('Trạng thái:', d.status_type === 1 ? '✅ Đã gửi' : d.status_type);
    console.log('Tổng gửi:', d.converted);
    console.log('Nhận thành công:', d.successful);
    console.log('Thất bại:', d.failed);
    console.log('Đang chờ:', d.remaining);
    console.log('Lỗi:', d.errors);
    console.log('Platform stats:', d.platform_delivery_stats);
    console.log('\nFull data:', JSON.stringify(d, null, 2));
  } catch (err) {
    console.error('Lỗi:', err.response?.data || err.message);
  }
}

// Kiểm tra notification vừa gửi
checkNotification('7fbc7db4-102d-4783-aefd-e6e04dc14828');
