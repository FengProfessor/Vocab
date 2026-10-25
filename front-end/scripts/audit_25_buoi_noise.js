const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auditLessons() {
  const { data: lessons, error } = await supabase.from('grammar_lessons').select('*').order('id');
  if (error) { console.error(error); return; }
  console.log('Total lessons:', lessons.length);
  
  lessons.forEach((l, idx) => {
    const issues = [];
    const theory = l.theory || '';
    const traps = (l.sections && l.sections.traps) || [];
    const cheatSheet = (l.sections && l.sections.cheatSheetHtml) || '';
    const exercises = l.exercises || [];

    // Check theory
    if (/🟡|THẺ\s+[A-Z0-9]|Ô\s+[A-Z0-9]/i.test(theory)) issues.push('theory: THE/O label');
    if (/cần thuộc/i.test(theory)) issues.push('theory: cần thuộc');
    if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i.test(theory)) issues.push('theory: SAI/DUNG');
    if (/①|②|③|④|⑤/i.test(theory)) issues.push('theory: circled numbers');
    if (/##\s*\d+\.\s*\d+\./.test(theory) || /###\s*\d+\.\s*\d+\./.test(theory)) issues.push('theory: dup numbering');

    // Check traps
    traps.forEach((t, tIdx) => {
      if (/🟡|THẺ|Ô\s+[A-Z0-9]/i.test(t)) issues.push('traps[' + tIdx + ']: THE/O');
      if (/cần thuộc/i.test(t)) issues.push('traps[' + tIdx + ']: cần thuộc');
      if (/SAI|ĐÚNG/i.test(t)) issues.push('traps[' + tIdx + ']: SAI/DUNG');
      if (/^\d+\.\s*\d+\./.test(t)) issues.push('traps[' + tIdx + ']: dup numbering');
    });

    // Check cheatSheet
    if (/🟡|THẺ\s+[A-Z0-9]|Ô\s+[A-Z0-9]/i.test(cheatSheet)) issues.push('cheatSheet: THE/O');
    if (/cần thuộc/i.test(cheatSheet)) issues.push('cheatSheet: cần thuộc');
    if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*/i.test(cheatSheet)) issues.push('cheatSheet: SAI/DUNG');

    // Check exercises
    let exDupNumbering = 0;
    let exNoise = 0;
    exercises.forEach(ex => {
      const q = ex.question || ex.q || '';
      const exp = ex.explanation || ex.why || '';
      if (/^(?:Câu\s*\d+[\.:]?\s*)+\d+[\.:]/i.test(q) || /^(?:\d+[\.:\)]\s*)+\d+[\.:\)]/i.test(q)) exDupNumbering++;
      if (/🟡|THẺ|Ô\s+[A-Z0-9]/i.test(q) || /🟡|THẺ|Ô\s+[A-Z0-9]/i.test(exp)) exNoise++;
      if (/cần thuộc/i.test(exp)) exNoise++;
    });
    if (exDupNumbering > 0) issues.push('exercises: ' + exDupNumbering + ' dup numbering');
    if (exNoise > 0) issues.push('exercises: ' + exNoise + ' noise');

    console.log(`[Lesson ${idx + 1}] ${l.title.slice(0, 40)} -> ${issues.join(', ') || 'CLEAN'}`);
  });
}
auditLessons();
