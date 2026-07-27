const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await client.from('grammar_lessons').select('id, title, exercises');
  
  const issues = [];
  let totalEx = 0;
  let shortFbCount = 0;

  for (const lesson of data) {
    if (!lesson.exercises || !Array.isArray(lesson.exercises)) continue;
    
    const lIssues = [];
    const seenQs = new Set();

    lesson.exercises.forEach((ex, idx) => {
        totalEx++;
        const q = (ex.q || ex.question || '').trim();
        const ans = ex.answer !== undefined ? ex.answer : ex.correct_answer;
        const fb = (ex.fb || ex.explanation || '').trim();
        const opts = ex.opts || ex.options || [];

        // 1. Trùng lặp câu hỏi trong cùng 1 bài
        if (q) {
            const qLower = q.toLowerCase();
            if (seenQs.has(qLower)) {
                lIssues.push(`Câu #${idx+1}: Trùng lặp câu hỏi - "${q.substring(0,30)}..."`);
            }
            seenQs.add(qLower);
        }

        // 2. Giải thích quá ngắn hoặc vô nghĩa
        if (fb.length < 20) {
            shortFbCount++;
            lIssues.push(`Câu #${idx+1}: Giải thích quá ngắn (${fb.length} ký tự) - "${fb}"`);
        } else if (fb.toLowerCase().includes('đáp án đúng là') && fb.length < 35) {
             lIssues.push(`Câu #${idx+1}: Giải thích sơ sài - "${fb}"`);
        }

        // 3. Lỗi các options bị trùng nhau (MCQ)
        if (ex.type === 'mcq' && opts.length > 0) {
            const uniqueOpts = new Set(opts.map(o => String(o).trim().toLowerCase()));
            if (uniqueOpts.size < opts.length) {
                lIssues.push(`Câu #${idx+1}: Bị trùng đáp án trong options - [${opts.join(', ')}]`);
            }
        }
    });

    if (lIssues.length > 0) {
       issues.push({
           title: lesson.title,
           issues: lIssues
       });
    }
  }

  console.log(`Kiểm tra ${totalEx} câu bài tập.`);
  console.log(`Số câu giải thích ngắn: ${shortFbCount}`);
  if (issues.length > 0) {
      console.log('CHI TIẾT LỖI SƯ PHẠM:');
      issues.forEach(i => {
          console.log(`\n--- Bài: ${i.title} ---`);
          i.issues.forEach(err => console.log(` - ${err}`));
      });
  } else {
      console.log('Tuyệt vời! Không tìm thấy lỗi sư phạm.');
  }
}

run();
