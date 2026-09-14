const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAllEx() {
  const { data: lessons, error } = await supabase.from('grammar_lessons').select('id, title, exercises');
  if (error) { console.error(error); return; }
  let dupCount = 0;
  let qNumPrefixCount = 0;
  for (const l of lessons) {
    (l.exercises || []).forEach((ex, idx) => {
      const q = ex.question || ex.q || '';
      const opts = ex.options || [];
      const exp = ex.explanation || ex.why || '';

      // Check for question numbering noise like "1. 1.", "Câu 1. 1.", "Câu 1: Câu 1."
      if (/^\s*(?:Câu\s*\d+[\.:]?\s*)?\d+[\.:\)]\s*\d+[\.:\)]/i.test(q)) {
        console.log(`[${l.title}] Ex ${idx+1} Dup num in Q: "${q.slice(0, 70)}"`);
        dupCount++;
      } else if (/^(?:(?:Câu|Question)\s*\d+[\.:\s]*){2,}/i.test(q)) {
        console.log(`[${l.title}] Ex ${idx+1} Dup Câu/Question in Q: "${q.slice(0, 70)}"`);
        dupCount++;
      }

      // Check if question starts with "Câu 1: " or "1. " while UI already shows number
      if (/^(?:Câu|Question)\s*\d+[\.:\s]+/i.test(q)) {
        console.log(`[${l.title}] Ex ${idx+1} Prefix: "${q.slice(0, 80)}"`);
        qNumPrefixCount++;
      }

      // Check option duplication e.g. "A. A. text" or "A. A) text"
      opts.forEach(o => {
        if (/^[A-D][\.\)]\s*[A-D][\.\)]/i.test(o)) {
          console.log(`[${l.title}] Ex ${idx+1} Dup opt prefix: "${o}"`);
          dupCount++;
        }
      });

      // Check for labels like "🟡 THẺ", "Ô A", "cần thuộc", etc. in exercise question or explanation
      const tagRegex = /(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/iu;
      const noiseRegex = /cần thuộc|—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i;
      if (tagRegex.test(q) || noiseRegex.test(q)) {
        console.log(`[${l.title}] Ex ${idx+1} Noise in Q: "${q.slice(0, 70)}"`);
      }
      if (tagRegex.test(exp) || noiseRegex.test(exp)) {
        console.log(`[${l.title}] Ex ${idx+1} Noise in Exp: "${exp.slice(0, 70)}"`);
      }
    });
  }
  console.log(`Total duplicate issues in exercises: ${dupCount}`);
  console.log(`Total questions with redundant 'Câu X:' prefix: ${qNumPrefixCount}`);
}
checkAllEx();
