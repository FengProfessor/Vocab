import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Missing Supabase env variables');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  console.log('🔍 Scanning global_dictionary for corrupted IPA...');
  let from = 0;
  const size = 1000;
  let totalPhrases = 0;
  let corruptedCount = 0;
  const corruptedList: Array<{ id: string; word: string; ipa: string; tags: string[] }> = [];

  const boxDrawingRegex = /[\u2500-\u259F]/;

  while (true) {
    console.log(`Fetching rows from ${from} to ${from + size - 1}...`);
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('id, word, tags, data')
      .range(from, from + size - 1);

    if (error) {
      console.error('❌ Error fetching from Supabase:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const word = row.word || '';
      const wordCount = word.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount >= 2) {
        totalPhrases++;
        const d = row.data || {};
        const ipa = (d.pronunciations?.[0]?.ipa || '').trim();
        
        // Check if IPA has box drawing characters
        if (boxDrawingRegex.test(ipa)) {
          corruptedCount++;
          corruptedList.push({
            id: row.id,
            word,
            ipa,
            tags: row.tags || []
          });
        }
      }
    }

    if (data.length < size) break;
    from += size;
  }

  console.log(`\n=== SCAN REPORT ===`);
  console.log(`Total phrases (word count >= 2) checked: ${totalPhrases}`);
  console.log(`Total corrupted IPA found: ${corruptedCount}`);
  console.log(`Corrupted list (first 50):`);
  corruptedList.slice(0, 50).forEach((item, index) => {
    console.log(`${index + 1}. [ID: ${item.id}] "${item.word}" -> IPA: "${item.ipa}" (Tags: ${item.tags.join(', ')})`);
  });

  if (corruptedCount > 50) {
    console.log(`... and ${corruptedCount - 50} more.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
