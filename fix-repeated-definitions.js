const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await client.from('grammar_lessons').select('id, title, sections, topic_id');
  let fixedCount = 0;

  for (const d of data) {
    if (!d.sections || !d.sections.definition) continue;
    
    const lines = d.sections.definition.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // Find lessons where the first few lines are identical
    if (lines.length > 5 && lines[0] === lines[1] && lines[1] === lines[2]) {
      const repeatedString = lines[0];
      
      // We will remove all occurrences of this repeated string and its trailing newlines at the beginning of the text.
      // But wait! There could be a more robust way.
      // We can split by '\n\n', filter out exact matches of the repeated string, and join back.
      let newDefinition = d.sections.definition;
      
      const pattern = new RegExp('^(' + repeatedString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n\\n)+');
      if (pattern.test(newDefinition)) {
          newDefinition = newDefinition.replace(pattern, '');
      }

      console.log('--- FIXING:', d.title);
      console.log('BEFORE (first 100 chars):', d.sections.definition.substring(0, 100).replace(/\n/g, '\\n'));
      console.log('AFTER (first 100 chars):', newDefinition.substring(0, 100).replace(/\n/g, '\\n'));
      
      const newSections = { ...d.sections, definition: newDefinition };
      const { error } = await client.from('grammar_lessons').update({ sections: newSections }).eq('id', d.id);
      if (error) {
         console.error('Error updating', d.title, error);
      } else {
         fixedCount++;
      }
    }
  }
  
  console.log('Fixed count:', fixedCount);
}
run();
