const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await client.from('grammar_lessons').select('id, title, sections, theory_vi, theory, exercises');
  
  const issues = [];

  for (const lesson of data) {
    const lIssues = [];
    
    // 1. Check sections (Golden Lesson)
    if (lesson.sections) {
      const s = lesson.sections;
      
      // Check for duplicated lines in any text field
      const checkDupes = (text, fieldName) => {
        if (!text) return;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 5 && lines[0] === lines[1] && lines[1] === lines[2]) {
          lIssues.push(`Trường ${fieldName} bị lặp nội dung: ${lines[0].substring(0, 30)}...`);
        }
      };

      checkDupes(s.definition, 'definition');
      checkDupes(s.tips, 'tips');
      checkDupes(s.comparison, 'comparison');
      
      // Unclosed bold markdown
      const checkMarkdown = (text, fieldName) => {
          if (!text) return;
          const boldMatches = text.match(/\*\*/g);
          if (boldMatches && boldMatches.length % 2 !== 0) {
              lIssues.push(`Trường ${fieldName} bị lẻ thẻ markdown in đậm (**).`);
          }
      }
      
      checkMarkdown(s.definition, 'definition');
      checkMarkdown(s.tips, 'tips');
      checkMarkdown(s.comparison, 'comparison');
      
      // Check mistakes
      if (s.mistakes && Array.isArray(s.mistakes)) {
         s.mistakes.forEach((m, idx) => {
            if (!m.wrong || !m.right) lIssues.push(`Mistake #${idx+1} thiếu wrong hoặc right.`);
         });
      }
    } else {
        if (!lesson.theory_vi && !lesson.theory) {
             lIssues.push(`Bài học không có nội dung lý thuyết (theory rỗng).`);
        }
    }
    
    // 2. Check exercises
    if (lesson.exercises && Array.isArray(lesson.exercises)) {
        lesson.exercises.forEach((ex, idx) => {
            const q = ex.q || ex.question;
            const ans = ex.answer !== undefined ? ex.answer : ex.correct_answer;
            const fb = ex.fb || ex.explanation;
            
            if (!q) lIssues.push(`Bài tập #${idx+1} thiếu câu hỏi.`);
            if (ans === undefined || ans === null || String(ans).trim() === '') {
                lIssues.push(`Bài tập #${idx+1} thiếu đáp án.`);
            }
            if (ex.type === 'mcq' && (!ex.opts || ex.opts.length < 2)) {
                lIssues.push(`Bài tập #${idx+1} (MCQ) thiếu options.`);
            }
        });
    } else {
        lIssues.push(`Bài học hoàn toàn không có bài tập (exercises rỗng).`);
    }

    if (lIssues.length > 0) {
       issues.push({
           title: lesson.title,
           id: lesson.id,
           issues: lIssues
       });
    }
  }

  console.log(JSON.stringify(issues, null, 2));
}

run();
