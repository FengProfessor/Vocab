const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkB13() {
  const { data } = await supabase.from('grammar_lessons').select('theory').eq('order_index', 13).single();
  const parts = data.theory.split(/\n(?=#{2,3}\s+)/g);
  console.log('Parts count:', parts.length);
  parts.forEach((p, i) => {
    console.log(`Part ${i+1}:`, p.slice(0, 80));
  });
}

checkB13().catch(console.error);
