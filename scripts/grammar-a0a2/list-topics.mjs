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

async function list() {
  const { data: topics } = await sb.from('grammar_topics').select('slug,level,order_index').order('order_index');
  const byLevel = { beginner: [], intermediate: [], advanced: [] };
  for (const t of topics) byLevel[t.level]?.push(t.slug);
  console.log(`BEGINNER (${byLevel.beginner.length}):\n`, byLevel.beginner);
  console.log(`INTERMEDIATE (${byLevel.intermediate.length}):\n`, byLevel.intermediate);
  console.log(`ADVANCED (${byLevel.advanced.length}):\n`, byLevel.advanced);
}
list();
