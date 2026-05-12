const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetWatermark() {
  console.log('--- Đặt lại mốc thông báo (Reset Watermark) ---');
  
  const { error } = await supabase
    .from('telegram_sessions')
    .update({ 
      session_data: { last_notified_count: 0, last_notified_time: '1970-01-01' }
    })
    .not('user_id', 'is', null);
    
  if (error) {
    console.error('Lỗi:', error);
  } else {
    console.log('✅ Đã đặt lại mốc thông báo. Lần quét tới CHẮC CHẮN sẽ nổ thông báo!');
  }
}

resetWatermark();
