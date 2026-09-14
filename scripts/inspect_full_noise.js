const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: lessons } = await supabase
    .from('grammar_lessons')
    .select('order_index, title, theory, sections, exercises')
    .order('order_index');

  console.log(`Fetched ${lessons.length} lessons`);
  
  for (const l of lessons) {
    const bNum = l.order_index;
    
    // 1. Check Theory
    const theoryLines = (l.theory || '').split('\n');
    theoryLines.forEach((line, idx) => {
      // Any card/ô/thẻ
      if (/(?:🟡|THẺ|Thẻ|Ô\s+[A-Z0-9]|Khung\s+[A-Z0-9])/iu.test(line)) {
        console.log(`[B${bNum} Theory Tag L${idx+1}]: ${line.trim()}`);
      }
      // Any cần thuộc
      if (/cần thuộc/i.test(line)) {
        console.log(`[B${bNum} Theory CAN THUOC L${idx+1}]: ${line.trim()}`);
      }
      // Any SAI/DUNG label
      if (/(?:[-—–]\s*\*?SAI\*?|[-—–]\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\)|-\s*\*SAI\*|-\s*\*ĐÚNG\*)/i.test(line)) {
        console.log(`[B${bNum} Theory SAI/DUNG L${idx+1}]: ${line.trim()}`);
      }
      // Any duplicate number
      if (/(?:^|\s)(?:#+\s*)?(\d+)[\.\)]\s+(\d+)[\.\)]/.test(line)) {
        console.log(`[B${bNum} Theory DUP NUM L${idx+1}]: ${line.trim()}`);
      }
      // Any teacher talk / slide
      if (/`slide/i.test(line) || /Slide\s*\d+/i.test(line) || /Nói:|Chiếu slide|Bấm slide/i.test(line)) {
        console.log(`[B${bNum} Theory TEACHER L${idx+1}]: ${line.trim()}`);
      }
    });

    // 2. Check Traps
    const traps = l.sections?.traps || [];
    traps.forEach((t, idx) => {
      if (/(?:🟡|THẺ|Thẻ|Ô\s+[A-Z0-9]|Khung\s+[A-Z0-9])/iu.test(t)) {
        console.log(`[B${bNum} Trap Tag ${idx+1}]: ${t}`);
      }
      if (/cần thuộc/i.test(t)) {
        console.log(`[B${bNum} Trap CAN THUOC ${idx+1}]: ${t}`);
      }
      if (/(?:[-—–]\s*\*?SAI\*?|[-—–]\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\))/i.test(t)) {
        console.log(`[B${bNum} Trap SAI/DUNG ${idx+1}]: ${t}`);
      }
      if (/(?:^|\s)(\d+)[\.\)]\s+(\d+)[\.\)]/.test(t) || /(?:Bẫy\s*\d*[:\s]*)+Bẫy/i.test(t)) {
        console.log(`[B${bNum} Trap DUP NUM ${idx+1}]: ${t}`);
      }
      if (/Slide\s*\d+|`slide|Nói:|Chiếu slide/i.test(t)) {
        console.log(`[B${bNum} Trap TEACHER ${idx+1}]: ${t}`);
      }
    });

    // 3. Check Cheatsheet
    const cs = l.sections?.cheatSheetHtml || '';
    if (cs) {
      const csLines = cs.split('\n');
      csLines.forEach((line, idx) => {
        if (/(?:🟡|THẺ|Thẻ|Ô\s+[A-Z0-9]|Khung\s+[A-Z0-9])/iu.test(line)) {
          console.log(`[B${bNum} CS Tag L${idx+1}]: ${line.trim()}`);
        }
        if (/cần thuộc/i.test(line)) {
          console.log(`[B${bNum} CS CAN THUOC L${idx+1}]: ${line.trim()}`);
        }
        if (/(?:[-—–]\s*\*?SAI\*?|[-—–]\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\))/i.test(line)) {
          console.log(`[B${bNum} CS SAI/DUNG L${idx+1}]: ${line.trim()}`);
        }
        if (/(?:^|\s)(\d+)[\.\)]\s+(\d+)[\.\)]/.test(line)) {
          console.log(`[B${bNum} CS DUP NUM L${idx+1}]: ${line.trim()}`);
        }
      });
    }

    // 4. Check Exercises
    const exercises = l.exercises || [];
    exercises.forEach((ex, idx) => {
      const q = ex.question || '';
      const exp = ex.explanation || '';
      const opts = ex.options || [];

      if (/^(?:(?:\d+|Câu\s*\d+)[\.:\)]\s*){2,}/i.test(q)) {
        console.log(`[B${bNum} Ex Q DUP NUM ${idx+1}]: ${q}`);
      }
      if (/(?:🟡|THẺ|Thẻ|Ô\s+[A-Z0-9]|Khung\s+[A-Z0-9])/iu.test(q) || /(?:🟡|THẺ|Thẻ|Ô\s+[A-Z0-9]|Khung\s+[A-Z0-9])/iu.test(exp)) {
        console.log(`[B${bNum} Ex Tag ${idx+1}]: Q="${q}" | Exp="${exp}"`);
      }
      if (/cần thuộc/i.test(q) || /cần thuộc/i.test(exp)) {
        console.log(`[B${bNum} Ex CAN THUOC ${idx+1}]: Q="${q}" | Exp="${exp}"`);
      }
      if (/(?:[-—–]\s*\*?SAI\*?|[-—–]\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\))/i.test(q) || /(?:[-—–]\s*\*?SAI\*?|[-—–]\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\))/i.test(exp)) {
        console.log(`[B${bNum} Ex SAI/DUNG ${idx+1}]: Q="${q}" | Exp="${exp}"`);
      }
      opts.forEach((o, oIdx) => {
        if (/^[A-D][\.\)]\s*[A-D][\.\)]/i.test(o)) {
          console.log(`[B${bNum} Ex ${idx+1} Opt ${oIdx+1} DUP]: ${o}`);
        }
      });
    });
  }
}

check().catch(console.error);
