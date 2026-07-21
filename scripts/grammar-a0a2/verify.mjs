import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const { data: pluralTopic } = await sb
  .from('grammar_topics')
  .select('id,slug,order_index,level')
  .eq('slug', 'plural-nouns')
  .single();
const { data: pluralLesson } = await sb
  .from('grammar_lessons')
  .select('sections,examples,exercises,theory_vi')
  .eq('topic_id', pluralTopic.id)
  .single();

console.log('plural topic', pluralTopic);
console.log(
  'sections keys',
  pluralLesson.sections && typeof pluralLesson.sections === 'object'
    ? Object.keys(pluralLesson.sections)
    : pluralLesson.sections
);
console.log('examples', pluralLesson.examples?.length);
console.log('exercises', pluralLesson.exercises?.length);

const { data: all } = await sb
  .from('grammar_lessons')
  .select('id,sections,exercises,topic:grammar_topics(slug,level,order_index,title_vi)');

let withSec = 0;
let a0a2 = 0;
let a0a2sec = 0;
const beginner = [];
for (const x of all || []) {
  const sec =
    x.sections &&
    typeof x.sections === 'object' &&
    !Array.isArray(x.sections) &&
    Object.keys(x.sections).length > 0;
  if (sec) withSec++;
  const lv = x.topic?.level;
  if (lv === 'beginner' || lv === 'intermediate') {
    a0a2++;
    if (sec) a0a2sec++;
  }
  if (lv === 'beginner') {
    beginner.push({
      order: x.topic.order_index,
      slug: x.topic.slug,
      title: x.topic.title_vi,
      sec: !!sec,
      quiz: Array.isArray(x.exercises) ? x.exercises.length : 0,
      ex: Array.isArray(x.examples) ? x.examples.length : 0,
    });
  }
}
beginner.sort((a, b) => a.order - b.order);
console.log({ total: all.length, withSections: withSec, a0a2, a0a2WithSections: a0a2sec });
console.log('beginner order:');
for (const b of beginner) {
  console.log(
    String(b.order).padStart(2),
    b.sec ? 'SEC' : '---',
    `q=${b.quiz}`,
    `ex=${b.ex}`,
    b.slug
  );
}
