const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function detailAudit() {
  const { data: lessons, error } = await supabase.from('grammar_lessons').select('*').order('id');
  if (error) { console.error(error); return; }

  for (const l of lessons) {
    console.log(`\n======================================================`);
    console.log(`LESSON: ${l.title}`);

    // Theory issues
    const theoryLines = (l.theory || '').split('\n');
    theoryLines.forEach((line, lineIdx) => {
      if (/🟡|THẺ|Ô\s+[A-Z0-9]|cần thuộc|—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*|##\s*\d+\.\s*\d+/i.test(line)) {
        console.log(`  [Theory L${lineIdx+1}] ${line}`);
      }
    });

    // Traps issues
    const traps = (l.sections && l.sections.traps) || [];
    traps.forEach((t, tIdx) => {
      if (/🟡|THẺ|Ô\s+[A-Z0-9]|cần thuộc|SAI|ĐÚNG|^\d+\.\s*\d+/i.test(t)) {
        console.log(`  [Trap ${tIdx}] ${t}`);
      }
    });

    // CheatSheet issues
    const cheatSheet = (l.sections && l.sections.cheatSheetHtml) || '';
    const csLines = cheatSheet.split('\n');
    csLines.forEach((line, csIdx) => {
      if (/🟡|THẺ|Ô\s+[A-Z0-9]|cần thuộc|—\s*\*SAI\*|—\s*\*ĐÚNG\*/i.test(line)) {
        console.log(`  [CheatSheet L${csIdx+1}] ${line.slice(0, 120)}`);
      }
    });

    // Exercises issues
    const exercises = l.exercises || [];
    exercises.forEach((ex, exIdx) => {
      const q = ex.question || ex.q || '';
      const exp = ex.explanation || ex.why || '';
      const opts = ex.options || [];
      const hasQNoise = /^(?:Câu\s*\d+[\.:]?\s*)+\d+[\.:]/i.test(q) || /^(?:\d+[\.:\)]\s*)+\d+[\.:\)]/i.test(q) || /🟡|THẺ|Ô\s+[A-Z0-9]/i.test(q);
      const hasExpNoise = /🟡|THẺ|Ô\s+[A-Z0-9]|cần thuộc/i.test(exp);
      const hasOptNoise = opts.some(o => /^[A-D]\.\s*[A-D]\./i.test(o));
      if (hasQNoise || hasExpNoise || hasOptNoise) {
        console.log(`  [Ex ${exIdx+1}] Q: ${q.slice(0, 80)}`);
        if (hasExpNoise) console.log(`         Exp: ${exp.slice(0, 100)}`);
        if (hasOptNoise) console.log(`         Opts: ${JSON.stringify(opts)}`);
      }
    });
  }
}

detailAudit();
