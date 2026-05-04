const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAllToNow() {
  console.log('--- Đặt lại toàn bộ lịch học về BÂY GIỜ ---');
  
  const { error } = await supabase
    .from('srs_progress')
    .update({ 
      next_review_date: new Date().toISOString()
    })
    .not('id', 'is', null); // update all
    
  if (error) {
    console.error('Lỗi:', error);
  } else {
    console.log('✅ Đã đặt lại toàn bộ từ vựng về trạng thái ĐẾN HẠN ôn tập.');
  }
}

resetAllToNow();
