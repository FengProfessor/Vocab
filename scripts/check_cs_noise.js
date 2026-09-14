const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCheatSheets() {
  const { data: lessons } = await supabase.from('grammar_lessons').select('id, title, sections');
  lessons.forEach((l, idx) => {
    const cs = l.sections?.cheatSheetHtml || '';
    console.log(`Buổi ${idx+1} (${l.title}): cheatSheet len = ${cs.length}`);
    if (cs.length > 0) {
      // Check for noise in cheatSheet
      const matches = cs.match(/(?:THẺ\s+[A-Z0-9]|(?:^|[^\w\u00C0-\u1EF9])Ô\s+[A-Z0-9]|cần thuộc|—\s*\*SAI\*|—\s*\*ĐÚNG\*|\d+[\.\)]\s*\d+[\.\)])/gi);
      if (matches) console.log('  Matches in CS:', matches);
    }
  });
}
checkCheatSheets();
