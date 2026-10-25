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

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SPOT_BEGINNER_SLUGS = [
  'personal-pronouns',
  'verb-to-be',
  'countable-uncountable',
  'articles',
  'present-simple',
  'past-simple',
];

const SPOT_ADVANCED_SLUGS = [
  'future-in-the-past',
  'inversion',
  'subjunctive',
];

async function spot() {
  const { data: lessons } = await sb
    .from('grammar_lessons')
    .select('exercises,topic:grammar_topics(slug,title,level)');

  const spotResults = [];

  for (const slug of [...SPOT_BEGINNER_SLUGS, ...SPOT_ADVANCED_SLUGS]) {
    const L = lessons.find((item) => item.topic?.slug === slug);
    if (!L) continue;
    const exList = (L.exercises || []).slice(0, 3);
    spotResults.push({
      slug,
      level: L.topic.level,
      title: L.topic.title,
      pairs: exList.map((e) => ({
        q: e.q,
        answer: e.answer !== undefined ? e.answer : e.correct_answer,
        fb: e.fb,
      })),
    });
  }

  console.log(JSON.stringify(spotResults, null, 2));
  fs.writeFileSync('tmp/spot-check-results.json', JSON.stringify(spotResults, null, 2));
}

spot().catch(console.error);
