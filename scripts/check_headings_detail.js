const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHeadings() {
  const { data: lessons } = await supabase.from('grammar_lessons').select('order_index, title, theory').order('order_index');
  for (const l of lessons) {
    const lines = (l.theory || '').split('\n');
    lines.forEach((line, idx) => {
      if (line.startsWith('#')) {
        // check if heading has numbering
        if (/^#{1,4}\s+\d+[\.\)]\s+\d+[\.\)]/i.test(line) || /^#{1,4}\s+\d+[\.\)]\s+[A-Z0-9][\.\)]/i.test(line)) {
          console.log(`[B${l.order_index} Heading L${idx+1}]:`, line);
        }
      }
    });
  }
}

checkHeadings().catch(console.error);
