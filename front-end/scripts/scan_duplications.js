const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function scanDuplications() {
  const { data: lessons, error } = await supabase.from('grammar_lessons').select('*').order('id');
  if (error) { console.error(error); return; }

  console.log('=== SCANNING 25 LESSONS FOR DUPLICATE NUMBERING & FORMATTING NOISE ===\n');

  lessons.forEach((l, idx) => {
    const report = [];

    // 1. In Theory
    const theory = l.theory || '';
    const theoryLines = theory.split('\n');
    theoryLines.forEach((line, lIdx) => {
      // Duplicate numbers like "1. 1.", "## 1. 1.", "1. Câu 1:", "A. A.", etc.
      if (/(?:^|\s)(?:#+\s*)?(\d+)[\.\)]\s+(\d+)[\.\)]/i.test(line)) {
        report.push(`Theory L${lIdx+1} dup number: "${line.trim()}"`);
      }
      if (/(?:^|\s)(?:#+\s*)?([A-D])[\.\)]\s+([A-D])[\.\)]/i.test(line)) {
        report.push(`Theory L${lIdx+1} dup letter: "${line.trim()}"`);
      }
      // "## 1. ## 1." or similar
      if (/##\s*\d+\.\s*##/i.test(line)) {
        report.push(`Theory L${lIdx+1} dup heading: "${line.trim()}"`);
      }
    });

    // 2. In Traps
    const traps = (l.sections && l.sections.traps) || [];
    traps.forEach((t, tIdx) => {
      if (/^(\d+)[\.\)]\s+(\d+)[\.\)]/i.test(t) || /(?:Bẫy\s*\d+[:\s]*)+Bẫy\s*\d+/i.test(t)) {
        report.push(`Trap ${tIdx+1} dup number: "${t.slice(0, 80)}"`);
      }
      // Check if trap is actually a teaching line or slide notation
      if (/^(?:###|Nói:|Giảng sâu|Chiếu|\d+–\d+['′]|`slide|Drill|\(Slide)/i.test(t)) {
        report.push(`Trap ${tIdx+1} teacher noise: "${t.slice(0, 80)}"`);
      }
      if (/^\|\s*(?:Outcome|Câu hỏi cả buổi|Dạng câu hỏi)/i.test(t)) {
        report.push(`Trap ${tIdx+1} table leak: "${t.slice(0, 80)}"`);
      }
    });

    // 3. In CheatSheet
    const cheatSheet = (l.sections && l.sections.cheatSheetHtml) || '';
    if (cheatSheet) {
      const csLines = cheatSheet.split('\n');
      csLines.forEach((line, cIdx) => {
        if (/(?:^|\s)(\d+)[\.\)]\s+(\d+)[\.\)]/i.test(line)) {
          report.push(`CheatSheet L${cIdx+1} dup number: "${line.trim().slice(0, 80)}"`);
        }
      });
    }

    // 4. In Exercises
    const exercises = l.exercises || [];
    exercises.forEach((ex, exIdx) => {
      const q = ex.question || ex.q || '';
      const opts = ex.options || [];
      const exp = ex.explanation || ex.why || '';

      // Check question for duplicate numbers e.g. "1. 1.", "Câu 1: Câu 1", "Question 1. 1."
      if (/^(?:(?:Câu|Question)\s*\d+[\.:]?\s*)+(?:Câu|Question|\d+)[\.:]/i.test(q)) {
        report.push(`Ex ${exIdx+1} dup Q num: "${q.slice(0, 80)}"`);
      } else if (/^(\d+)[\.\)]\s+(\d+)[\.\)]/i.test(q)) {
        report.push(`Ex ${exIdx+1} dup num: "${q.slice(0, 80)}"`);
      }

      // Check options for duplicate prefixes e.g. "A. A. option" or "A. A) option"
      opts.forEach(opt => {
        if (/^([A-D])[\.\)]\s*([A-D])[\.\)]/i.test(opt)) {
          report.push(`Ex ${exIdx+1} dup opt prefix: "${opt}"`);
        }
      });

      // Check explanation for duplicate numbers or label noise
      if (/^(?:Giải thích|Lời giải)[:\s]*(?:Giải thích|Lời giải)[:\s]*/i.test(exp)) {
        report.push(`Ex ${exIdx+1} dup exp: "${exp.slice(0, 80)}"`);
      }
    });

    if (report.length > 0) {
      console.log(`[Lesson ${idx+1}] ${l.title} (${report.length} findings):`);
      report.forEach(r => console.log(`   - ${r}`));
      console.log('');
    }
  });
}

scanDuplications();
