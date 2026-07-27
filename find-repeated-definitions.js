const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await client.from('grammar_lessons').select('id, title, sections, topic_id');
  const bad = data.filter(d => {
    if (!d.sections || !d.sections.definition) return false;
    const lines = d.sections.definition.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // If the first line is repeated more than 3 times
    if (lines.length > 5 && lines[0] === lines[1] && lines[1] === lines[2]) {
      return true;
    }
    return false;
  });
  console.log('Bad lessons count:', bad.length);
  bad.forEach(b => console.log(b.id, b.title));
}
run();
