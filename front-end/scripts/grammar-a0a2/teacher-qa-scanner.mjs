import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '../grammar-gen/out');

const files = fs.readdirSync(outDir).filter(f => f.endsWith('.json'));

let totalBadDistractors = 0;
let totalMetaQuestions = 0;
let filesWithIssues = {};

const metaKeywords = [
  'not correctly', 'wrong structure', 'missing grammar',
  'incorrectly', 'wrong meaning', 'invalid', 'this sentence missing',
  'wrong syntax', 'not a correct', 'chỉ số lượng', 'chỉ độ dài',
  'dịch máy móc'
];

for (const file of files) {
  const filePath = path.join(outDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let fileIssues = [];

  for (let i = 0; i < data.exercises.length; i++) {
    const ex = data.exercises[i];
    
    // Check for bad distractors
    if (ex.opts) {
      for (const opt of ex.opts) {
        if (opt !== ex.answer && typeof opt === 'string') {
          const lowerOpt = opt.toLowerCase();
          if (metaKeywords.some(kw => lowerOpt.includes(kw))) {
            fileIssues.push({ type: 'bad_distractor', q: ex.q, opt: opt, idx: i });
            totalBadDistractors++;
          }
        }
      }
    }
    
    // Check for meta tf questions (e.g., "Câu này tự nhiên và đúng ngữ pháp:")
    if (ex.type === 'tf' || ex.type === 'error') {
      const lowerQ = ex.q.toLowerCase();
      if (lowerQ.includes('câu này tự nhiên') || lowerQ.includes('dịch máy móc') || lowerQ.includes('câu nào là một ví dụ')) {
         fileIssues.push({ type: 'meta_question', q: ex.q, idx: i });
         totalMetaQuestions++;
      }
    }
  }

  if (fileIssues.length > 0) {
    filesWithIssues[file] = fileIssues;
  }
}

console.log(`[Teacher QA Report]`);
console.log(`Found ${totalBadDistractors} bad distractors (meta-text).`);
console.log(`Found ${totalMetaQuestions} meta/pedagogically poor questions.`);
console.log(`Files affected: ${Object.keys(filesWithIssues).length} out of ${files.length}`);

// Write to a log file for review
fs.writeFileSync(path.join(__dirname, 'qa-report.json'), JSON.stringify(filesWithIssues, null, 2));
console.log(`Details saved to qa-report.json`);
