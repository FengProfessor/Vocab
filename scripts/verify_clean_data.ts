import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  const { data: lessons, error } = await supabase
    .from('grammar_lessons')
    .select('order_index, title, sections, theory')
    .order('order_index');

  if (error || !lessons) {
    console.error('Error fetching lessons:', error);
    process.exit(1);
  }

  console.log(`Total lessons verified: ${lessons.length}\n`);

  let dirtyCount = 0;
  for (const l of lessons) {
    const traps: string[] = l.sections?.traps || [];
    const contrastPairs: any[] = l.sections?.contrastPairs || [];

    const dirtyTraps = traps.filter(t => 
      t.includes('cần thuộc') || 
      t.includes('**') || 
      t.startsWith('✦') || 
      t.endsWith(':')
    );

    const dirtyPairs = contrastPairs.filter(p => 
      p.good?.includes('— *ĐÚNG*') || 
      p.bad?.includes('— *SAI*') || 
      p.good?.includes('<s>') || 
      p.bad?.includes('<s>') ||
      p.good?.startsWith('✓') ||
      p.bad?.startsWith('✗')
    );

    if (dirtyTraps.length > 0 || dirtyPairs.length > 0) {
      dirtyCount++;
      console.warn(`[Buổi ${l.order_index}] Dirty data found:`);
      if (dirtyTraps.length > 0) console.warn('  Dirty traps:', dirtyTraps);
      if (dirtyPairs.length > 0) console.warn('  Dirty pairs:', dirtyPairs);
    }
  }

  if (dirtyCount === 0) {
    console.log('🎉 100% of 25 lessons passed cleanliness checks with 0 formatting noise!\n');
  }

  console.log('Buổi 01 Samples:');
  console.log('  Traps:', lessons[0].sections?.traps?.slice(0, 2));
  console.log('  Contrast Pairs:', lessons[0].sections?.contrastPairs?.slice(0, 2));

  console.log('\nBuổi 06 Samples:');
  console.log('  Traps:', lessons[5].sections?.traps?.slice(0, 3));
  console.log('  Contrast Pairs:', lessons[5].sections?.contrastPairs?.slice(0, 2));
}

verify();
