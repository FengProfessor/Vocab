import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, '../grammar-gen/out');

const files = fs.readdirSync(outDir).filter(f => f.endsWith('.json'));

let totalDeleted = 0;
let filesModified = 0;

// Keywords typical of the boilerplate meta questions
const boilerplatePatterns = [
  "chọn câu dùng đúng",
  "chọn cấu trúc phù hợp",
  "ho?n th?nh",
  "điền tên cấu trúc",
  "câu này tự nhiên",
  "có thể luôn dịch",
  "câu/mô tả nào sai",
  "câu/mô tả nào đúng",
  "điều cần kiểm tra",
  "dịch sang tiếng anh",
  "là một ví dụ đúng",
  "chọn lời khuyên sai",
  "chọn lời khuyên đúng",
  "câu nào là một ví dụ",
  "hoàn thành câu"
];

for (const file of files) {
  const filePath = path.join(outDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (!data.exercises || !Array.isArray(data.exercises)) continue;
  
  const originalCount = data.exercises.length;
  
  // Filter out boilerplate exercises
  data.exercises = data.exercises.filter(ex => {
    if (!ex.q) return true;
    const lowerQ = ex.q.toLowerCase();
    
    // Check if it matches boilerplate patterns
    const isBoilerplate = boilerplatePatterns.some(pattern => lowerQ.includes(pattern));
    
    // Also remove questions that have the bad distractors directly
    let hasBadDistractor = false;
    if (ex.opts) {
      hasBadDistractor = ex.opts.some(opt => {
        if (typeof opt !== 'string') return false;
        const lowerOpt = opt.toLowerCase();
        return lowerOpt.includes('not correctly') || 
               lowerOpt.includes('wrong structure') ||
               lowerOpt.includes('missing required') ||
               lowerOpt.includes('incorrectly structure') ||
               lowerOpt.includes('chỉ độ dài câu') ||
               lowerOpt.includes('chỉ số lượng từ');
      });
    }
    
    if (isBoilerplate || hasBadDistractor) {
       return false; // delete this question
    }
    
    // Check for bad encoding in questions like "Ho?n th?nh c?u"
    if (lowerQ.includes('ho?n th?nh')) return false;

    return true; // keep
  });
  
  const deletedCount = originalCount - data.exercises.length;
  if (deletedCount > 0) {
    totalDeleted += deletedCount;
    filesModified++;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Cleaned ${deletedCount} questions from ${file}`);
  }
}

console.log(`\nFinished! Deleted ${totalDeleted} boilerplate questions across ${filesModified} files.`);
