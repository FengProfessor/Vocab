import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '../grammar-gen/out');

const targetFiles = ['verb-to-be.json', 'present-simple.json', 'plural-nouns.json'];

for (const file of targetFiles) {
  const filePath = path.join(outDir, file);
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let modified = false;

  console.log(`\n=== Auditing ${file} ===`);
  
  if (!data.exercises) {
      console.log(`No exercises in ${file}`);
      continue;
  }
  
  let encodingIssues = 0;
  let shortExplanations = 0;
  let grammarIssues = 0;

  data.exercises.forEach(ex => {
    // Check for explanation length
    const expl = ex.explanation || ex.fb;
    if (expl && expl.length < 25) {
       console.log(`[Warning] Short explanation: "${expl}"`);
       shortExplanations++;
    }

    // Check for encoding issues like "Ho?n th?nh c?u"
    const text = JSON.stringify(ex);
    if (text.includes('Ho?n') || text.includes('th?nh') || text.includes('c?u')) {
      console.log(`[Error] Encoding issue: ${text}`);
      encodingIssues++;
    }
    
    // Check for weird capitalization or un-capitalized questions
    const q = ex.question || ex.q;
    if (q && q.length > 0 && q.charAt(0) === q.charAt(0).toLowerCase() && q.charAt(0).match(/[a-z]/i)) {
      console.log(`[Warning] Uncapitalized question: ${q}`);
      grammarIssues++;
    }
  });

  console.log(`Summary for ${file}: Short expl: ${shortExplanations}, Encoding issues: ${encodingIssues}, Grammar issues: ${grammarIssues}`);
}
