import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Running verification for PRO3M and PRO3M PLUS imports...');

  // 1. Count total words with 'pro3m' tag
  const { count: pro3mCount, error: countError } = await supabase
    .from('global_dictionary')
    .select('*', { count: 'exact', head: true })
    .contains('tags', ['pro3m']);

  if (countError) {
    console.error('❌ Error fetching pro3m word count:', countError.message);
    process.exit(1);
  }

  console.log(`✅ Total words in global_dictionary tagged with 'pro3m': ${pro3mCount}`);

  // 2. Count total words with 'pro3m-plus' tag
  const { count: pro3mPlusCount, error: countError2 } = await supabase
    .from('global_dictionary')
    .select('*', { count: 'exact', head: true })
    .contains('tags', ['pro3m-plus']);

  if (countError2) {
    console.error('❌ Error fetching pro3m-plus word count:', countError2.message);
    process.exit(1);
  }

  console.log(`✅ Total words in global_dictionary tagged with 'pro3m-plus': ${pro3mPlusCount}`);

  // 3. Fetch a sample of 5 words tagged with 'pro3m'
  const { data: sample, error: sampleError } = await supabase
    .from('global_dictionary')
    .select('word, tags, data')
    .contains('tags', ['pro3m'])
    .limit(3);

  if (sampleError) {
    console.error('❌ Error fetching sample words:', sampleError.message);
    process.exit(1);
  }

  console.log('\n📝 Sample words for PRO3M:');
  for (const row of sample || []) {
    console.log(`- Word: "${row.word}"`);
    console.log(`  Tags: ${JSON.stringify(row.tags)}`);
    console.log(`  Definition: ${row.data?.results?.[0]?.meanings?.[0]?.definition || 'N/A'}`);
  }

  // 4. Fetch a sample of 3 words tagged with 'pro3m-plus'
  const { data: samplePlus, error: samplePlusError } = await supabase
    .from('global_dictionary')
    .select('word, tags, data')
    .contains('tags', ['pro3m-plus'])
    .limit(3);

  if (samplePlusError) {
    console.error('❌ Error fetching sample plus words:', samplePlusError.message);
    process.exit(1);
  }

  console.log('\n📝 Sample words for PRO3M PLUS:');
  for (const row of samplePlus || []) {
    console.log(`- Word: "${row.word}"`);
    console.log(`  Tags: ${JSON.stringify(row.tags)}`);
    console.log(`  Definition: ${row.data?.results?.[0]?.meanings?.[0]?.definition || 'N/A'}`);
  }
}

verify().catch(err => {
  console.error('❌ Unhandled error in verification:', err);
  process.exit(1);
});
