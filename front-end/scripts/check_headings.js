const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllHeadings() {
  const { data: lessons } = await supabase.from('grammar_lessons').select('id, title, theory');
  for (const l of lessons) {
    const lines = (l.theory || '').split('\n');
    lines.forEach((line, idx) => {
      if (/^#{2,4}\s+/.test(line)) {
        // Print headings
        if (/^#{2,4}\s+\d+[\.\)]\s*/.test(line) || /Ô|THẺ/i.test(line)) {
          console.log(`[${l.title}] L${idx+1}: ${line}`);
        }
      }
    });
  }
}
checkAllHeadings();
