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

async function verify() {
  console.log('Verifying example_vi in database...');

  let totalWithEx = 0;
  let missingVi = 0;
  let populatedVi = 0;
  let lastId = '';

  const samples: Array<{ word: string; example: string; example_vi: string }> = [];

  while (true) {
    let q = sb.from('words').select('id, word, example, example_vi').order('id').limit(1000);
    if (lastId) q = q.gt('id', lastId);
    const { data } = await q;
    if (!data || data.length === 0) break;

    for (const r of data) {
      const ex = (r.example || '').trim();
      const exVi = (r.example_vi || '').trim();
      if (!ex) continue;

      totalWithEx++;
      if (exVi) {
        populatedVi++;
        if (samples.length < 8 && Math.random() < 0.05) {
          samples.push({ word: r.word, example: ex, example_vi: exVi });
        }
      } else {
        missingVi++;
      }
    }

    lastId = data[data.length - 1].id;
    if (data.length < 1000) break;
  }

  console.log('\n================ VERIFICATION REPORT ================');
  console.log(`Total words with example: ${totalWithEx}`);
  console.log(`Words with example_vi populated: ${populatedVi} (${((populatedVi / totalWithEx) * 100).toFixed(2)}%)`);
  console.log(`Words missing example_vi: ${missingVi}`);
  console.log('=====================================================\n');

  console.log('Random Verified Samples:');
  for (const s of samples) {
    console.log(`\n• Word: "${s.word}"`);
    console.log(`  EN: "${s.example}"`);
    console.log(`  VI: "${s.example_vi}"`);
  }
}

verify();
