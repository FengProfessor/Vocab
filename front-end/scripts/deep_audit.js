const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const cardTagRegex = /(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/iu;
const noiseLabelRegex = /cần thuộc|—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i;

async function deepAudit() {
  const { data: lessons, error } = await supabase.from('grammar_lessons').select('*').order('order_index');
  if (error) { console.error(error); return; }

  console.log('=== DEEP AUDIT: 25 LESSONS IN SUPABASE ===\n');

  let totalTheoryIssues = 0;
  let totalTrapIssues = 0;
  let totalCsIssues = 0;
  let totalExIssues = 0;

  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    const bNum = l.order_index || (i + 1);
    console.log(`\n======================================================`);
    console.log(`LESSON ${bNum}: ${l.title}`);

    // 1. THEORY AUDIT
    const theory = l.theory || '';
    const theoryLines = theory.split('\n');
    const theoryIssues = [];
    theoryLines.forEach((line, idx) => {
      if (cardTagRegex.test(line)) {
        theoryIssues.push(`L${idx+1}: Leftover card/cell tag -> ${line.trim()}`);
      }
      if (/cần thuộc/i.test(line)) {
        theoryIssues.push(`L${idx+1}: Leftover 'cần thuộc' -> ${line.trim()}`);
      }
      if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i.test(line)) {
        theoryIssues.push(`L${idx+1}: Leftover SAI/DUNG label -> ${line.trim()}`);
      }
      if (/(?:^|\s)(?:#+\s*)?(\d+)[\.\)]\s+(\d+)[\.\)]/.test(line)) {
        theoryIssues.push(`L${idx+1}: Duplicate numbering -> ${line.trim()}`);
      }
      if (/^#{2,3}\s+\d+\.\s+[A-Z0-9]\./i.test(line)) {
        theoryIssues.push(`L${idx+1}: Heading duplicate num/letter -> ${line.trim()}`);
      }
      if (/①|②|③|④|⑤/.test(line)) {
        theoryIssues.push(`L${idx+1}: Circled number -> ${line.trim()}`);
      }
    });
    if (theoryIssues.length > 0) {
      console.log('  [THEORY ISSUES]:', theoryIssues);
      totalTheoryIssues += theoryIssues.length;
    } else {
      console.log('  [THEORY]: Clean of tested patterns');
    }

    // 2. TRAPS AUDIT
    const traps = (l.sections && l.sections.traps) || [];
    const trapIssues = [];
    traps.forEach((t, idx) => {
      if (cardTagRegex.test(t)) {
        trapIssues.push(`Trap ${idx+1}: Card/Cell tag in trap -> "${t}"`);
      }
      if (noiseLabelRegex.test(t)) {
        trapIssues.push(`Trap ${idx+1}: Noise label in trap -> "${t}"`);
      }
      if (/^(\d+)[\.\)]\s+(\d+)[\.\)]/.test(t) || /(?:Bẫy\s*\d+[:\s]*)+Bẫy\s*\d+/i.test(t)) {
        trapIssues.push(`Trap ${idx+1}: Duplicate numbering -> "${t}"`);
      }
      if (/^(?:###|Nói:|Giảng sâu|Chiếu|\d+–\d+['′]|`slide|Drill|\(Slide|Slide\s*\d+|\|\s*(?:Outcome|Câu hỏi))/i.test(t)) {
        trapIssues.push(`Trap ${idx+1}: Teacher/markdown leak -> "${t}"`);
      }
    });
    if (trapIssues.length > 0) {
      console.log('  [TRAP ISSUES]:', trapIssues);
      totalTrapIssues += trapIssues.length;
    } else {
      console.log(`  [TRAPS]: ${traps.length} traps, clean`);
    }

    // 3. CHEATSHEET AUDIT
    const cs = (l.sections && l.sections.cheatSheetHtml) || '';
    const csIssues = [];
    if (cs) {
      const csLines = cs.split('\n');
      csLines.forEach((line, idx) => {
        if (cardTagRegex.test(line)) {
          csIssues.push(`CS L${idx+1}: Tag -> ${line.trim().slice(0, 80)}`);
        }
        if (/cần thuộc/i.test(line)) {
          csIssues.push(`CS L${idx+1}: cần thuộc -> ${line.trim().slice(0, 80)}`);
        }
        if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*/i.test(line)) {
          csIssues.push(`CS L${idx+1}: SAI/DUNG -> ${line.trim().slice(0, 80)}`);
        }
        if (/(?:^|\s)(\d+)[\.\)]\s+(\d+)[\.\)]/.test(line)) {
          csIssues.push(`CS L${idx+1}: Duplicate numbering -> ${line.trim().slice(0, 80)}`);
        }
      });
    }
    if (csIssues.length > 0) {
      console.log('  [CHEATSHEET ISSUES]:', csIssues);
      totalCsIssues += csIssues.length;
    } else {
      console.log(`  [CHEATSHEET]: ${cs ? 'Present, clean' : 'None'}`);
    }

    // 4. EXERCISES AUDIT
    const exercises = l.exercises || [];
    const exIssues = [];
    exercises.forEach((ex, idx) => {
      const q = ex.question || ex.q || '';
      const exp = ex.explanation || ex.why || '';
      const opts = ex.options || [];

      if (/^(?:\d+[\.:\)]\s*){2,}/.test(q) || /^(?:(?:Câu|Question)\s*\d+[\.:\s]*){2,}/i.test(q)) {
        exIssues.push(`Ex ${idx+1}: Duplicate Q num -> "${q.slice(0, 60)}"`);
      }
      if (/^(?:Câu|Question)\s*\d+[\.:\s]+/i.test(q)) {
        exIssues.push(`Ex ${idx+1}: Redundant Câu X prefix -> "${q.slice(0, 60)}"`);
      }
      opts.forEach(o => {
        if (/^[A-D][\.\)]\s*[A-D][\.\)]/i.test(o)) {
          exIssues.push(`Ex ${idx+1}: Duplicate opt prefix -> "${o}"`);
        }
      });
      if (cardTagRegex.test(q) || cardTagRegex.test(exp)) {
        exIssues.push(`Ex ${idx+1}: Tag in Q/Exp`);
      }
      if (/cần thuộc/i.test(q) || /cần thuộc/i.test(exp)) {
        exIssues.push(`Ex ${idx+1}: 'cần thuộc' in Q/Exp`);
      }
      if (noiseLabelRegex.test(q) || noiseLabelRegex.test(exp)) {
        exIssues.push(`Ex ${idx+1}: SAI/DUNG in Q/Exp`);
      }
    });
    if (exIssues.length > 0) {
      console.log('  [EXERCISE ISSUES]:', exIssues);
      totalExIssues += exIssues.length;
    } else {
      console.log(`  [EXERCISES]: ${exercises.length} items, clean`);
    }
  }

  console.log('\n======================================================');
  console.log('                   AUDIT SUMMARY                      ');
  console.log('======================================================');
  console.log(`Theory Issues: ${totalTheoryIssues}`);
  console.log(`Trap Issues: ${totalTrapIssues}`);
  console.log(`Cheatsheet Issues: ${totalCsIssues}`);
  console.log(`Exercise Issues: ${totalExIssues}`);
  console.log(`TOTAL DEFECTS: ${totalTheoryIssues + totalTrapIssues + totalCsIssues + totalExIssues}`);

  process.exit(0);
}

deepAudit();
