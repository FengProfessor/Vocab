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

async function main() {
  const { data: lessons } = await sb
    .from('grammar_lessons')
    .select('id,exercises,topic:grammar_topics(slug,title,level)');

  const stats = {
    totalEx: 0,
    byLevel: {
      beginner: { total: 0, missingVi: 0, withVi: 0, boilerplate: 0 },
      intermediate: { total: 0, missingVi: 0, withVi: 0 },
      advanced: { total: 0, missingVi: 0, withVi: 0 },
    },
    types: { mcq: 0, fill: 0, tf: 0, error: 0, other: 0 },
  };

  const sampleMissingVi = [];

  for (const L of lessons || []) {
    const level = L.topic?.level || 'beginner';
    const slug = L.topic?.slug || '';
    const exList = Array.isArray(L.exercises) ? L.exercises : [];

    for (const e of exList) {
      stats.totalEx++;
      const type = e.type || 'mcq';
      stats.types[type] = (stats.types[type] || 0) + 1;

      stats.byLevel[level].total++;

      const fb = String(e.fb || '').trim();
      const hasVi = VI_REGEX.test(fb);
      const isBoilerplate = /hãy đối chiếu|minh họa cách dùng|gợi ý:/i.test(fb);

      if (hasVi) {
        stats.byLevel[level].withVi++;
        if (isBoilerplate && level === 'beginner') {
          stats.byLevel[level].boilerplate++;
        }
      } else {
        stats.byLevel[level].missingVi++;
        if (sampleMissingVi.length < 20) {
          sampleMissingVi.push({ slug, level, type, q: e.q, ans: e.answer, fb });
        }
      }
    }
  }

  console.log('=== EXERCISE STATS ===');
  console.log(JSON.stringify(stats, null, 2));
  console.log('\n=== SAMPLE MISSING VI ===');
  console.log(JSON.stringify(sampleMissingVi.slice(0, 10), null, 2));
}

main().catch(console.error);
