import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

export const FORCE_TRUE_PATTERNS = [
  /^Tom is happy\.?$/i,
  /^She is a player\.?$/i,
  /^He works here\.?$/i,
  /^Tom was playing football\.?$/i,
  /^They were not watching TV\.?$/i,
  /^I love Tom\.?$/i,
  /^Tom was happy\.?$/i,
];

const VI_REGEX = /[àáạảãâăèéêìíòóôơùúưỳýđ]/i;

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Fetch topics
  const { data: topics, error: tErr } = await sb
    .from('grammar_topics')
    .select('id,slug,title,level,order_index')
    .order('order_index', { ascending: true });
  if (tErr) throw tErr;

  const { data: lessons, error: lErr } = await sb
    .from('grammar_lessons')
    .select('id,topic_id,exercises');
  if (lErr) throw lErr;

  const lessonMap = new Map();
  for (const l of lessons) {
    lessonMap.set(l.topic_id, l);
  }

  const beginnerTopics = topics.filter(t => t.level === 'beginner');
  
  let totalExercises = 0;
  let totalMissingVi = 0;
  let totalTooShort = 0;
  let totalP0WrongTf = 0;

  let beginnerExCount = 0;
  let beginnerMissingVi = 0;
  let beginnerTooShort = 0;
  let beginnerP0WrongTf = 0;

  const perLessonAudit = [];

  for (const topic of topics) {
    const lesson = lessonMap.get(topic.id);
    const exercises = Array.isArray(lesson?.exercises) ? lesson.exercises : [];
    
    let lMissingVi = 0;
    let lTooShort = 0;
    let lP0WrongTf = 0;

    for (const e of exercises) {
      totalExercises++;
      if (topic.level === 'beginner') beginnerExCount++;

      const fb = String(e?.fb || '').trim();
      const q = String(e?.q || '').trim();
      const type = e?.type;
      const ans = e?.answer;

      if (!fb || !VI_REGEX.test(fb)) {
        lMissingVi++;
        totalMissingVi++;
        if (topic.level === 'beginner') beginnerMissingVi++;
      }

      if (fb.length < 12) {
        lTooShort++;
        totalTooShort++;
        if (topic.level === 'beginner') beginnerTooShort++;
      }

      // Check TF force true misclassifications
      const m = q.match(/"([^"]+)"\s+is correct/i);
      if (type === 'tf' && m) {
        const sent = m[1].trim();
        for (const re of FORCE_TRUE_PATTERNS) {
          if (re.test(sent) && ans === false) {
            lP0WrongTf++;
            totalP0WrongTf++;
            if (topic.level === 'beginner') beginnerP0WrongTf++;
            break;
          }
        }
      }
    }

    perLessonAudit.push({
      slug: topic.slug,
      title: topic.title,
      level: topic.level,
      orderIndex: topic.order_index,
      totalEx: exercises.length,
      missingVi: lMissingVi,
      tooShort: lTooShort,
      p0WrongTf: lP0WrongTf,
    });
  }

  const baselineSummary = {
    beginnerTopicsCount: beginnerTopics.length,
    beginnerSlugs: beginnerTopics.map(t => t.slug),
    totalTopicsCount: topics.length,
    totalExercises,
    beginnerExCount,
    beginnerMissingVi,
    beginnerTooShort,
    beginnerP0WrongTf,
    totalMissingVi,
    totalTooShort,
    totalP0WrongTf,
    perLessonAudit,
  };

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/r5-fb-baseline.json', JSON.stringify(baselineSummary, null, 2));

  console.log('=== R5 AUDIT BASELINE ===');
  console.log(`Beginner Topics: ${beginnerTopics.length}`);
  console.log(`Beginner Exercises: ${beginnerExCount}`);
  console.log(`Beginner Missing VI: ${beginnerMissingVi}`);
  console.log(`Beginner Short FB (<12): ${beginnerTooShort}`);
  console.log(`Beginner P0 Wrong TF Keys: ${beginnerP0WrongTf}`);
  console.log(`Total Exercises (All Levels): ${totalExercises}`);
  console.log(`Total Missing VI (All Levels): ${totalMissingVi}`);
  console.log(`Total P0 Wrong TF Keys: ${totalP0WrongTf}`);
  console.log('Saved report to tmp/r5-fb-baseline.json');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
