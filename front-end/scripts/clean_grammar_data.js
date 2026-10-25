const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Heuristic to detect Vietnamese text: check for characters with accents
function countVietnameseAccents(text) {
  if (!text) return 0;
  const regex = /[đáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/gi;
  return (text.match(regex) || []).length;
}

async function cleanData() {
  console.log('Fetching grammar lessons for cleaning...');
  const { data: lessons, error } = await supabase
    .from('grammar_lessons')
    .select('id, title, theory, examples');

  if (error) {
    console.error('Error fetching lessons:', error.message);
    return;
  }

  console.log(`Loaded ${lessons.length} lessons. Auditing content...`);

  let swapCount = 0;
  let ocrFixCount = 0;

  for (const lesson of lessons) {
    let needsUpdate = false;
    let updatedTitle = lesson.title;
    let updatedTheory = lesson.theory;
    let updatedExamples = lesson.examples ? [...lesson.examples] : [];

    // 1. Fix broken titles (e.g. "ĐAI TU/PRONOUNS)" -> "ĐẠI TỪ (PRONOUNS)")
    if (updatedTitle) {
      const originalTitle = updatedTitle;
      
      // Fix "ĐAI TU" misspelled
      if (updatedTitle.includes('ĐAI TU')) {
        updatedTitle = updatedTitle.replace('ĐAI TU', 'ĐẠI TỪ');
      }
      
      // Fix trailing parenthesis typo from OCR
      if (updatedTitle.endsWith(')')) {
        const openParenIndex = updatedTitle.indexOf('(');
        const slashIndex = updatedTitle.indexOf('/');
        if (openParenIndex === -1 && slashIndex !== -1) {
          // Replace '/' with ' (' to balance the trailing ')'
          const parts = updatedTitle.split('/');
          updatedTitle = `${parts[0].trim()} (${parts.slice(1).join('/').slice(0, -1).trim()})`;
        }
      }

      if (updatedTitle !== originalTitle) {
        console.log(`[Title Fix] "${originalTitle}" -> "${updatedTitle}"`);
        needsUpdate = true;
        ocrFixCount++;
      }
    }

    // 2. Check for inverted examples (EN and VI swapped)
    if (updatedExamples.length > 0) {
      let invertedCount = 0;
      let checkableExamples = 0;

      updatedExamples.forEach(ex => {
        if (ex.en && ex.vi) {
          checkableExamples++;
          const accentsInEn = countVietnameseAccents(ex.en);
          const accentsInVi = countVietnameseAccents(ex.vi);
          // If the English field has accents and has more accents than the Vietnamese field
          if (accentsInEn > 0 && accentsInEn > accentsInVi) {
            invertedCount++;
          }
        }
      });

      // If more than half are inverted, swap them all
      if (checkableExamples > 0 && invertedCount > checkableExamples / 2) {
        console.log(`[Swap Examples] Swapping EN/VI for lesson: "${updatedTitle}" (Detected ${invertedCount}/${checkableExamples} inverted examples)`);
        updatedExamples = updatedExamples.map(ex => {
          return {
            en: ex.vi || '',
            vi: ex.en || '',
            note: ex.note || '',
            // Clear annotations since the fields are swapped and old annotations are invalid
            annotations: undefined
          };
        });
        needsUpdate = true;
        swapCount++;
      }
    }

    // 3. Fix comma list markers in examples and theories (e.g. "1, " instead of "1. ")
    if (updatedExamples.length > 0) {
      let exampleFixed = false;
      updatedExamples = updatedExamples.map(ex => {
        if (ex.en) {
          const originalEn = ex.en;
          // Fix prefix comma bullet like "1, " -> "1. " or "I, " -> "I. "
          const cleanEn = ex.en.replace(/^([0-9a-zA-Z]+),\s+/i, '$1. ');
          if (cleanEn !== originalEn) {
            ex.en = cleanEn;
            exampleFixed = true;
          }
        }
        if (ex.vi) {
          const originalVi = ex.vi;
          const cleanVi = ex.vi.replace(/^([0-9a-zA-Z]+),\s+/i, '$1. ');
          if (cleanVi !== originalVi) {
            ex.vi = cleanVi;
            exampleFixed = true;
          }
        }
        return ex;
      });
      if (exampleFixed) {
        console.log(`[OCR Fix] Fixed numeric comma bullets in examples for: "${updatedTitle}"`);
        needsUpdate = true;
        ocrFixCount++;
      }
    }

    // 4. Update row if changed
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('grammar_lessons')
        .update({
          title: updatedTitle,
          theory: updatedTheory,
          examples: updatedExamples
        })
        .eq('id', lesson.id);

      if (updateError) {
        console.error(`Error updating lesson ${lesson.id}:`, updateError.message);
      } else {
        console.log(`Successfully updated lesson: "${updatedTitle}"`);
      }
    }
  }

  console.log('\n=== CLEANUP COMPLETED ===');
  console.log(`Lessons swapped: ${swapCount}`);
  console.log(`Other OCR fixes applied: ${ocrFixCount}`);
}

cleanData();
