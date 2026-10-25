import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1).trim();
      process.env[m[1].trim()] = v;
    }
  }
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  let lastId = '';
  const missing: Array<{ id: string; word: string; example: string }> = [];

  while (true) {
    let q = sb.from('words').select('id, word, example, example_vi').order('id').limit(1000);
    if (lastId) q = q.gt('id', lastId);
    const { data } = await q;
    if (!data || data.length === 0) break;

    for (const r of data) {
      const ex = (r.example || '').trim();
      const exVi = (r.example_vi || '').trim();
      if (ex && !exVi) {
        missing.push({ id: r.id, word: r.word, example: ex });
      }
    }

    lastId = data[data.length - 1].id;
    if (data.length < 1000) break;
  }

  console.log(`Found ${missing.length} missing words:`);
  console.log(JSON.stringify(missing, null, 2));
}

run();
