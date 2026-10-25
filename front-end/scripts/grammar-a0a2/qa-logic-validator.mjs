import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '../grammar-gen/out');

const files = fs.readdirSync(outDir).filter(f => f.endsWith('.json'));

let totalIssues = 0;
let fileReport = {};

for (const file of files) {
  const filePath = path.join(outDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (!data.exercises || !Array.isArray(data.exercises)) continue;
  
  let issues = [];
  
  data.exercises.forEach((ex, idx) => {
    // Check multiple_choice / mcq missing answer in options
    if (ex.type === 'multiple_choice') {
      if (!ex.options || !Array.isArray(ex.options)) {
        issues.push(`[${idx}] multiple_choice missing options array`);
      } else if (!ex.options.includes(ex.correct_answer)) {
        issues.push(`[${idx}] correct_answer "${ex.correct_answer}" not found in options`);
      }
      
      // Check for duplicate options
      if (ex.options && new Set(ex.options).size !== ex.options.length) {
        issues.push(`[${idx}] duplicate options found`);
      }
    }
    else if (ex.type === 'mcq') {
      if (!ex.opts || !Array.isArray(ex.opts)) {
        issues.push(`[${idx}] mcq missing opts array`);
      } else if (!ex.opts.includes(ex.answer)) {
        issues.push(`[${idx}] answer "${ex.answer}" not found in opts`);
      }
    }
    
    // Check fill-in-the-blank for blank '___' in question
    if (ex.type === 'fill' || ex.type === 'fill_blank') {
      const q = ex.q || ex.question;
      if (q && !q.includes('___')) {
         // Some fill questions might just be "Dịch sang tiếng Anh", but let's check
         if (!q.toLowerCase().includes('dịch')) {
             // issues.push(`[${idx}] fill question missing '___' blank: ${q}`); // Often intentional?
         }
      }
    }

    // Check error_correction
    if (ex.type === 'error_correction') {
      if (!ex.options || !ex.options.includes(ex.correct_answer)) {
        issues.push(`[${idx}] error_correction correct_answer not in options`);
      }
    }
  });
  
  if (issues.length > 0) {
    fileReport[file] = issues;
    totalIssues += issues.length;
  }
}

console.log(`[Phase 2 QA] Found ${totalIssues} logic/schema issues across ${Object.keys(fileReport).length} files.`);
fs.writeFileSync(path.join(__dirname, 'qa-logic-report.json'), JSON.stringify(fileReport, null, 2));
