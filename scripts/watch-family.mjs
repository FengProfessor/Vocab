import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const c = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
c.split('\n').forEach((l) => {
  const m = l.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const enr = (fw) => Array.isArray(fw) && fw.length > 0 && fw.every((e) => e && typeof e === 'object' && e.word && e.meaning);

async function snapshot() {
  const rows = [];
  let from = 0;
  while (true) {
    const { data } = await s.from('global_dictionary').select('word, fw:data->familyWords, checked:data->familyChecked').range(from, from + 999);
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  const single = rows.filter((r) => r.word && !/\s/.test(r.word));
  const done = single.filter((r) => enr(r.fw) || r.checked === true);
  return { total: single.length, done: done.length, sample: done.slice(-5) };
}

const WATCH = process.argv.includes('--watch');
let prev = null;
async function tick() {
  const { total, done, sample } = await snapshot();
  const rate = prev !== null ? ` (+${done - prev})` : '';
  const line = `[${new Date().toLocaleTimeString()}] enrich ${done}/${total}${rate} | còn ${total - done} | ${(100 * done / total).toFixed(1)}%`;
  process.stdout.write(Buffer.from(line + '\n', 'utf8'));
  if (!WATCH) {
    for (const r of sample) {
      process.stdout.write(Buffer.from('  ' + r.word + ': ' + r.fw.map((f) => f.word + '=' + f.meaning).join(' | ') + '\n', 'utf8'));
    }
  }
  prev = done;
}

await tick();
if (WATCH) setInterval(tick, 15000);
