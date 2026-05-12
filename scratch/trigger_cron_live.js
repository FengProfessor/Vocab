const axios = require('axios');

async function triggerCron() {
  const url = 'https://lingopro-nu.vercel.app/api/cron/telegram-due?secret=lingopro_secret_123';
  console.log('--- Đang quét hệ thống (Triggering Cron) ---');
  
  try {
    const res = await axios.get(url);
    console.log('Phản hồi từ máy chủ:', res.data);
    console.log('------------------------------------------');
    console.log('XONG! Nếu bạn vừa học xong 30s trước, thông báo sẽ nổ ngay bây giờ.');
  } catch (err) {
    console.error('Lỗi khi gọi Cron:', err.response?.data || err.message);
  }
}

triggerCron();
