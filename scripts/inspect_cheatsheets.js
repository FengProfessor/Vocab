const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectCheatSheets() {
  const { data: lessons } = await supabase
    .from('grammar_lessons')
    .select('order_index, title, sections')
    .order('order_index');

  for (const l of lessons) {
    const cs = l.sections?.cheatSheetHtml || '';
    console.log(`\n=== BUOI ${l.order_index}: ${l.title} ===`);
    console.log(`CheatSheet length: ${cs.length}`);
    if (!cs) {
      console.log('NO CHEATSHEET!');
      continue;
    }
    
    // Check for noise in cs:
    const noiseChecks = [
      { name: 'Card/Cell tag', regex: /(?:🟡|THẺ|Thẻ|Ô\s+[A-Z0-9]|Khung\s+[A-Z0-9])/iu },
      { name: 'cần thuộc', regex: /cần thuộc/i },
      { name: 'SAI/ĐÚNG label', regex: /—\s*\*?SAI\*?|—\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\)/i },
      { name: 'Duplicate numbering', regex: /(?:^|\s)(\d+)[\.\)]\s+(\d+)[\.\)]/ },
      { name: 'Button/Bar/Script tags', regex: /<button|<div class=["']bar["']|<script|<div class=["']foot["']/i }
    ];

    noiseChecks.forEach(nc => {
      if (nc.regex.test(cs)) {
        console.log(`  ❌ FOUND ${nc.name}:`);
        const matches = cs.match(new RegExp(nc.regex, 'gi'));
        console.log('    Matches:', matches?.slice(0, 5));
      }
    });
  }
}

inspectCheatSheets().catch(console.error);
