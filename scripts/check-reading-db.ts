import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, count, error } = await supabase
    .from('reading_articles')
    .select('cefr_level, theme_id, source_type', { count: 'exact' });

  if (error) {
    console.error('Supabase query error:', error);
    process.exit(1);
  }

  console.log(`Total reading_articles in DB: ${count}`);

  const levelStats: Record<string, number> = {};
  const themeStats: Record<string, number> = {};
  const sourceStats: Record<string, number> = {};

  for (const row of data || []) {
    levelStats[row.cefr_level] = (levelStats[row.cefr_level] || 0) + 1;
    themeStats[row.theme_id] = (themeStats[row.theme_id] || 0) + 1;
    sourceStats[row.source_type] = (sourceStats[row.source_type] || 0) + 1;
  }

  console.log('CEFR Levels:', levelStats);
  console.log('Themes:', themeStats);
  console.log('Sources:', sourceStats);
}

main().catch(console.error);
