const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await client.from('grammar_lessons').select('id, title, exercises');
  
  for (const lesson of data) {
    if (!lesson.exercises || !Array.isArray(lesson.exercises)) continue;
    
    lesson.exercises.forEach((ex, idx) => {
        const q = (ex.q || ex.question || '').trim();
        const ans = ex.answer !== undefined ? ex.answer : ex.correct_answer;
        const fb = (ex.fb || ex.explanation || '').trim();
        
        if (fb.length < 20 || (fb.toLowerCase().includes('đáp án đúng là') && fb.length < 35)) {
            console.log(`\nLesson: ${lesson.title}`);
            console.log(`Q: ${q}`);
            console.log(`A: ${JSON.stringify(ans)}`);
            console.log(`Current FB: ${fb}`);
        }
    });
  }
}

run();
