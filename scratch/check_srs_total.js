const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSRS() {
  console.log('--- Kiểm tra SRS cho từ TOTAL ---');
  
  // Find the word id
  const { data: wordData } = await supabase
    .from('words')
    .select('id')
    .eq('word', 'TOTAL')
    .single();
    
  if (!wordData) {
    console.log('Không tìm thấy từ TOTAL trong bảng words');
    return;
  }
  
  const { data: srs, error } = await supabase
    .from('srs_progress')
    .select('*')
    .eq('word_id', wordData.id);
    
  if (error) {
    console.error('Lỗi SRS:', error);
    return;
  }
  
  if (srs && srs.length > 0) {
    console.log('Đã có bản ghi SRS cho TOTAL:', srs[0]);
  } else {
    console.log('CHƯA CÓ bản ghi SRS cho TOTAL!');
  }
}

checkSRS();
