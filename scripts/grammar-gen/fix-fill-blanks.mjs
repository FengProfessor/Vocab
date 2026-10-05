import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'out');
const roadmapPath = path.join(__dirname, 'roadmap.json');
const roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));

let fixedCount = 0;

roadmap.forEach((topic) => {
  const filePath = path.join(outDir, `${topic.slug}.json`);
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  (data.exercises || []).forEach((ex, idx) => {
    if (ex.type === 'fill_blank') {
      const q = String(ex.question || ex.q || '').trim();
      if (!q.includes('___') && !q.includes('...') && !q.includes('(_') && !q.includes('_____')) {
        console.log(`Fixing blank in ${topic.slug} ex #${idx + 1}: ${q}`);
        ex.question = `${q} → _____`;
        modified = true;
        fixedCount++;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }
});

console.log(`Added blank indicator to ${fixedCount} fill_blank exercises.`);
