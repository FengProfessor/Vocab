const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function printAllTraps() {
  const { data: lessons, error } = await supabase.from('grammar_lessons').select('id, title, sections').order('id');
  if (error) { console.error(error); return; }

  lessons.forEach(l => {
    const traps = (l.sections && l.sections.traps) || [];
    console.log(`\n=== ${l.title} (${traps.length} traps) ===`);
    traps.forEach((t, i) => {
      console.log(`  [${i+1}] ${t}`);
    });
  });
}
printAllTraps();
