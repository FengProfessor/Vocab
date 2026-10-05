import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const roadmapPath = path.join(__dirname, 'roadmap.json');
const outDir = path.join(__dirname, 'out');

const roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));

// 1. Sync order in all 62 topic JSON files to match roadmap.json
let updatedOrderCount = 0;
roadmap.forEach((topic) => {
  const filePath = path.join(outDir, `${topic.slug}.json`);
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (data.order !== topic.order) {
    console.log(`Updating order for ${topic.slug}: ${data.order} -> ${topic.order}`);
    data.order = topic.order;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    updatedOrderCount++;
  }
});
console.log(`Updated order in ${updatedOrderCount} topic JSON files.`);

// 2. Fix countable-uncountable ex 5 and ex 6 questions
const cuPath = path.join(outDir, 'countable-uncountable.json');
if (fs.existsSync(cuPath)) {
  const cuData = JSON.parse(fs.readFileSync(cuPath, 'utf8'));
  cuData.exercises[4].question = 'Câu sau đúng ngữ pháp không? → "I have two books."';
  cuData.exercises[5].question = 'Câu sau đúng ngữ pháp không? → "She gave me two advices."';
  fs.writeFileSync(cuPath, JSON.stringify(cuData, null, 2) + '\n', 'utf8');
  console.log('Standardized countable-uncountable ex 5 and ex 6 stems.');
}
