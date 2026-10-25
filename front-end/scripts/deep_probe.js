const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepProbe() {
  console.log('=== DEEP PROBE OF ALL 25 BUOI ===\n');

  // Probe 1: Database inspection
  const { data: lessons } = await supabase
    .from('grammar_lessons')
    .select('*')
    .order('order_index');

  console.log(`Found ${lessons.length} lessons in Supabase.\n`);

  let dbNoiseCount = 0;

  lessons.forEach((l) => {
    const b = l.order_index;
    const title = l.title;

    // Check theory
    const theory = l.theory || '';
    // 1. Check duplicate numbering: "1. 1." or "Câu 1. Câu 1." or "A. A." or "## 1. 1."
    const dupNums = theory.match(/(?:^|\s|\n)(?:#+\s*)?(\d+[\.\)]\s*){2,}/g);
    if (dupNums) {
      console.log(`[B${b} DB Theory] Duplicate numbering:`, dupNums);
      dbNoiseCount++;
    }

    // 2. Check card tags: "🟡 THẺ", "THẺ A ·", "Ô A ·", "(Ô A)"
    const cardTags = theory.match(/(?:🟡|THẺ\s+[A-Z0-9]\s*[·:–—.-]|Ô\s+[A-Z0-9]\s*[·:–—.-]|\((?:Ô|Thẻ)\s+[A-Z0-9]\))/gi);
    if (cardTags) {
      console.log(`[B${b} DB Theory] Card/Cell tag:`, cardTags);
      dbNoiseCount++;
    }

    // 3. Check 'cần thuộc:**' or 'cần thuộc:'
    const canThuoc = theory.match(/cần thuộc[:\*]*/gi);
    if (canThuoc) {
      console.log(`[B${b} DB Theory] Cần thuộc:`, canThuoc);
      dbNoiseCount++;
    }

    // 4. Check '— *SAI*', '— *ĐÚNG*'
    const saiDung = theory.match(/(?:—|–|-)\s*\*+(?:SAI|ĐÚNG|Sai|Đúng)\*+/g);
    if (saiDung) {
      console.log(`[B${b} DB Theory] SAI/ĐÚNG:`, saiDung);
      dbNoiseCount++;
    }

    // 5. Check markdown noise: orphaned HTML tags, backticks around slides, unmatched bold
    const slideNoise = theory.match(/`slide[^`]*`|Slide\s*\d+/gi);
    if (slideNoise) {
      console.log(`[B${b} DB Theory] Slide noise:`, slideNoise);
      dbNoiseCount++;
    }

    // Check Traps
    const traps = l.sections?.traps || [];
    if (traps.length === 0) {
      console.log(`⚠️ [B${b} DB Traps] ZERO TRAPS FOUND!`);
    }
    traps.forEach((t, tIdx) => {
      if (/(?:^|\s)(\d+[\.\)]\s*){2,}/.test(t) || /(?:Bẫy\s*\d*[:\s]*)+Bẫy/i.test(t)) {
        console.log(`[B${b} DB Trap ${tIdx+1}] Duplicate numbering:`, t);
        dbNoiseCount++;
      }
      if (/(?:🟡|THẺ\s+[A-Z0-9]|Ô\s+[A-Z0-9]\s*[·:–—.-]|\((?:Ô|Thẻ)\s+[A-Z0-9]\))/i.test(t)) {
        console.log(`[B${b} DB Trap ${tIdx+1}] Card tag:`, t);
        dbNoiseCount++;
      }
      if (/cần thuộc/i.test(t)) {
        console.log(`[B${b} DB Trap ${tIdx+1}] Cần thuộc:`, t);
        dbNoiseCount++;
      }
      if (/(?:—|–|-)\s*\*+(?:SAI|ĐÚNG|Sai|Đúng)\*+/i.test(t)) {
        console.log(`[B${b} DB Trap ${tIdx+1}] SAI/ĐÚNG:`, t);
        dbNoiseCount++;
      }
      if (/&amp;/i.test(t)) {
        console.log(`[B${b} DB Trap ${tIdx+1}] Unescaped &amp;:`, t);
        dbNoiseCount++;
      }
    });

    // Check Cheatsheet
    const cs = l.sections?.cheatSheetHtml || '';
    if (!cs) {
      console.log(`⚠️ [B${b} DB Cheatsheet] NO CHEATSHEET!`);
    } else {
      if (/(?:🟡|THẺ\s+[A-Z0-9]\s*[·:–—.-]|Ô\s+[A-Z0-9]\s*[·:–—.-]|\((?:Ô|Thẻ)\s+[A-Z0-9]\))/i.test(cs)) {
        console.log(`[B${b} DB CS] Card tag in CS:`, cs.match(/(?:🟡|THẺ\s+[A-Z0-9]\s*[·:–—.-]|Ô\s+[A-Z0-9]\s*[·:–—.-]|\((?:Ô|Thẻ)\s+[A-Z0-9]\))/gi));
        dbNoiseCount++;
      }
      if (/cần thuộc/i.test(cs)) {
        console.log(`[B${b} DB CS] Cần thuộc in CS:`, cs.match(/cần thuộc[^\s<]*/gi));
        dbNoiseCount++;
      }
      if (/(?:—|–|-)\s*\*+(?:SAI|ĐÚNG|Sai|Đúng)\*+/i.test(cs)) {
        console.log(`[B${b} DB CS] SAI/ĐÚNG in CS:`, cs.match(/(?:—|–|-)\s*\*+(?:SAI|ĐÚNG|Sai|Đúng)\*+/gi));
        dbNoiseCount++;
      }
      if (/(?:^|\s)(\d+[\.\)]\s*){2,}/.test(cs)) {
        console.log(`[B${b} DB CS] Duplicate numbering in CS:`, cs.match(/(?:^|\s)(\d+[\.\)]\s*){2,}/g));
        dbNoiseCount++;
      }
    }

    // Check Exercises
    const exercises = l.exercises || [];
    exercises.forEach((ex, exIdx) => {
      const q = ex.question || '';
      const exp = ex.explanation || '';
      const opts = ex.options || [];

      // Duplicate question prefix: "Câu 1: Câu 1." or "1. 1."
      if (/^(?:\s*(?:Câu\s*\d+[\.:]?\s*)?\d+[\.:\)]\s*){2,}/i.test(q)) {
        console.log(`[B${b} DB Ex ${exIdx+1}] Duplicate Q num:`, q);
        dbNoiseCount++;
      }
      // Redundant "Câu X: " prefix
      if (/^(?:Câu|Question)\s*\d+[\.:\s]+/i.test(q)) {
        console.log(`[B${b} DB Ex ${exIdx+1}] Redundant Câu X:`, q);
        dbNoiseCount++;
      }
      // Duplicate option prefix: "A. A."
      opts.forEach((o, oIdx) => {
        if (/^[A-D][\.\)]\s*[A-D][\.\)]/i.test(o)) {
          console.log(`[B${b} DB Ex ${exIdx+1} Opt ${oIdx+1}] Duplicate Opt prefix:`, o);
          dbNoiseCount++;
        }
      });
      // Tags in exp
      if (/(?:🟡|THẺ\s+[A-Z0-9]|Ô\s+[A-Z0-9]\s*[·:–—.-]|\((?:Ô|Thẻ)\s+[A-Z0-9]\))/i.test(exp)) {
        console.log(`[B${b} DB Ex ${exIdx+1}] Tag in exp:`, exp);
        dbNoiseCount++;
      }
      // "cần thuộc" in exp
      if (/cần thuộc/i.test(exp)) {
        console.log(`[B${b} DB Ex ${exIdx+1}] Cần thuộc in exp:`, exp);
        dbNoiseCount++;
      }
      // SAI/ĐÚNG in exp
      if (/(?:—|–|-)\s*\*+(?:SAI|ĐÚNG|Sai|Đúng)\*+/i.test(exp)) {
        console.log(`[B${b} DB Ex ${exIdx+1}] SAI/ĐÚNG in exp:`, exp);
        dbNoiseCount++;
      }
    });
  });

  console.log(`\n=== TOTAL DB NOISE ITEMS FOUND: ${dbNoiseCount} ===\n`);
}

deepProbe().catch(console.error);
