const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTheory() {
  const { data: lessons, error } = await supabase.from('grammar_lessons').select('id, title, theory').order('id');
  if (error) { console.error(error); return; }

  lessons.forEach(l => {
    const lines = (l.theory || '').split('\n');
    const matches = [];
    lines.forEach((line, idx) => {
      // Check for headings with Ô, THẺ, numbers
      if (/^#{1,4}\s+.*(?:🟡|THẺ|Ô\s+[A-Z0-9])/i.test(line)) {
        matches.push(`[L${idx+1}] HEADING: ${line}`);
      }
      if (/cần thuộc/i.test(line)) {
        matches.push(`[L${idx+1}] CAN_THUOC: ${line}`);
      }
      if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i.test(line)) {
        matches.push(`[L${idx+1}] SAI_DUNG: ${line}`);
      }
      if (/①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩/.test(line)) {
        matches.push(`[L${idx+1}] CIRCLED: ${line}`);
      }
      if (/^#{1,4}\s+\d+\.\s*\d+\./.test(line)) {
        matches.push(`[L${idx+1}] DUP_NUM: ${line}`);
      }
      if (/`slide[\d\s–-]*`/i.test(line) || /\bNói:\s*["“]/i.test(line) || /^\s*>\s*\*\*Nói:\*\*/i.test(line)) {
        matches.push(`[L${idx+1}] SCRIPT_LEAK: ${line}`);
      }
    });
    if (matches.length > 0) {
      console.log(`\n=== ${l.title} (${matches.length} matches) ===`);
      matches.slice(0, 15).forEach(m => console.log('  ' + m));
      if (matches.length > 15) console.log(`  ... and ${matches.length - 15} more`);
    }
  });
}
checkTheory();
