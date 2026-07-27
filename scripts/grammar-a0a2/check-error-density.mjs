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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

function getType(e) {
  let t = String(e?.type || 'mcq');
  if (t === 'multiple_choice') t = 'mcq';
  if (t === 'fill_blank') t = 'fill';
  if (t === 'error_correction') t = 'error';
  return t;
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: topics } = await sb.from('grammar_topics').select('id, slug, level').order('level').order('slug');
  const { data: lessons } = await sb.from('grammar_lessons').select('id, topic_id, exercises');
  const topicById = Object.fromEntries(topics.map(t => [t.id, t]));
  
  const stats = lessons.map(l => {
    const topic = topicById[l.topic_id];
    const exs = Array.isArray(l.exercises) ? l.exercises : [];
    const counts = { mcq: 0, fill: 0, error: 0, tf: 0 };
    for (const e of exs) {
      const t = getType(e);
      counts[t] = (counts[t] || 0) + 1;
    }
    return {
      slug: topic?.slug,
      level: topic?.level,
      total: exs.length,
      ...counts
    };
  }).sort((a,b) => a.error - b.error);

  const errorThin = stats.filter(s => s.error < 4);
  console.log('=== ERROR TYPE DENSITY STATS ===');
  console.log(`Total topics: ${stats.length}`);
  console.log(`Topics with error count < 4: ${errorThin.length}`);
  console.log('\nError-thin topics (< 4 error items):');
  errorThin.forEach(s => {
    console.log(`  [${s.level}] ${s.slug}: total=${s.total}, mcq=${s.mcq}, fill=${s.fill}, error=${s.error}, tf=${s.tf}`);
  });
}
main();
