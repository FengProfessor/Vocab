const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTotalDetails() {
  console.log('--- Chi tiết từ TOTAL ---');
  
  const { data: word, error } = await supabase
    .from('words')
    .select('*')
    .eq('word', 'TOTAL')
    .single();
    
  if (error) {
    console.error('Lỗi:', error);
    return;
  }
  
  console.log('Word Record:', JSON.stringify(word, null, 2));
}

checkTotalDetails();
