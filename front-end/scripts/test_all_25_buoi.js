const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAll25Buoi() {
  console.log('====================================================');
  console.log('  VERIFYING ALL 25 GRAMMAR BUỔI IN DATABASE & SYNC  ');
  console.log('====================================================\n');

  const { data: topics, error: tErr } = await supabase
    .from('grammar_topics')
    .select('id, title, level, order_index')
    .order('order_index', { ascending: true });

  if (tErr || !topics) {
    console.error('Error fetching topics:', tErr);
    process.exit(1);
  }

  const { data: lessons, error: lErr } = await supabase
    .from('grammar_lessons')
    .select('id, title, sections, exercises, order_index, topic_id')
    .order('order_index', { ascending: true });

  if (lErr || !lessons) {
    console.error('Error fetching lessons:', lErr);
    process.exit(1);
  }

  console.log(`Topics count: ${topics.length} / 25`);
  console.log(`Lessons count: ${lessons.length} / 25\n`);

  let totalExercises = 0;
  let totalMissingAnswers = 0;
  let totalMissingExplanations = 0;

  topics.forEach((t, i) => {
    const lesson = lessons.find(l => l.topic_id === t.id);
    const exList = lesson ? lesson.exercises || [] : [];
    totalExercises += exList.length;

    const missingAns = exList.filter(e => !e.correct_answer || e.correct_answer.trim() === '');
    const missingExp = exList.filter(e => !e.explanation || e.explanation.trim() === '');
    totalMissingAnswers += missingAns.length;
    totalMissingExplanations += missingExp.length;

    const bPad = String(t.order_index).padStart(2, '0');
    const csLength = lesson?.sections?.cheatSheetHtml ? lesson.sections.cheatSheetHtml.length : 0;
    const hasVideo = !!lesson?.sections?.videoUrl;

    console.log(
      `[Buổi ${bPad}] ${t.title.slice(0, 32).padEnd(32)} | Ex: ${String(exList.length).padStart(3)} | ` +
      `CheatSheet: ${csLength > 0 ? 'YES (' + csLength + 'c)' : 'NO '} | Video: ${hasVideo ? 'YES' : 'NO '} | MissingAns: ${missingAns.length}`
    );
  });

  console.log('\n====================================================');
  console.log(`TOTAL EXERCISES: ${totalExercises}`);
  console.log(`TOTAL MISSING ANSWERS: ${totalMissingAnswers}`);
  console.log(`TOTAL MISSING EXPLANATIONS: ${totalMissingExplanations}`);
  console.log('====================================================');

  if (totalMissingAnswers > 0 || topics.length !== 25 || lessons.length !== 25) {
    console.error('❌ Verification failed!');
    process.exit(1);
  } else {
    console.log('✅ 100% of 25 Buổi curriculum verified perfectly in Supabase!');
  }
}

testAll25Buoi().catch(console.error);
