import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { bankStats } from './wordbanks-dense.mjs';

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
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
const { data: topics } = await sb
  .from('grammar_topics')
  .select('slug,title,title_vi,level,order_index')
  .order('level')
  .order('order_index');
const stats = bankStats();
let miss = 0;
for (const t of topics || []) {
  const st = stats[t.slug];
  const rows = st ? st.rows : 0;
  const mark = rows ? `OK ${String(rows).padStart(3)}` : '  MISS';
  if (!rows) miss++;
  console.log(mark, (t.level || '?').padEnd(12), t.slug, '|', t.title_vi || t.title);
}
console.log('--- missing:', miss);
