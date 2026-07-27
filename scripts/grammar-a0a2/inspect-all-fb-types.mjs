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

const VI_REGEX = /[àáạảãâăèéêìíòóôơùúưỳýđ]/i;

async function check() {
  const { data: lessons } = await sb
    .from('grammar_lessons')
    .select('id,exercises,topic:grammar_topics(slug,title,level)');

  const nonViByTopic = {};

  for (const L of lessons || []) {
    const slug = L.topic?.slug;
    const level = L.topic?.level;
    const exList = Array.isArray(L.exercises) ? L.exercises : [];

    for (const e of exList) {
      const fb = String(e.fb || '').trim();
      if (!VI_REGEX.test(fb)) {
        if (!nonViByTopic[slug]) nonViByTopic[slug] = { level, count: 0, samples: [] };
        nonViByTopic[slug].count++;
        if (nonViByTopic[slug].samples.length < 5) {
          nonViByTopic[slug].samples.push({ type: e.type, q: e.q, ans: e.answer, fb });
        }
      }
    }
  }

  console.log('=== NON-VI FEEDBACK TOPICS SUMMARY ===');
  for (const [slug, info] of Object.entries(nonViByTopic)) {
    console.log(`Topic: ${slug} (${info.level}) -> Non-VI FB Count: ${info.count}`);
  }

  fs.writeFileSync('tmp/non-vi-samples.json', JSON.stringify(nonViByTopic, null, 2));
}

check().catch(console.error);
