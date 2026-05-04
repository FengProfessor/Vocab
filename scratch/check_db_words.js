const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWords() {
  console.log('--- Kiểm tra từ vựng gần đây ---');
  
  const { data: words, error } = await supabase
    .from('words')
    .select('word, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Lỗi:', error);
    return;
  }
  
  console.log('5 từ mới nhất:');
  words.forEach(w => console.log(`- ${w.word} (Lúc: ${w.created_at})`));
}

checkWords();
