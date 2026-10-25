const fs = require('fs');
const path = require('path');
const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';

for (let b = 1; b <= 25; b++) {
  const pad = String(b).padStart(2, '0');
  const f = path.join(buoiDir, 'buoi' + pad, '03-Giao-An-Buoi' + pad + '.md');
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  const matches = [];
  lines.forEach((line, idx) => {
    if (/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô)\s+[A-Z0-9]+(?:\s*[\·\:\–\—\-]\s*|\s+)/i.test(line)) {
      matches.push(`L${idx+1}: CARD_CELL: ${line.trim()}`);
    }
    if (/cần thuộc/i.test(line)) {
      matches.push(`L${idx+1}: CAN_THUOC: ${line.trim()}`);
    }
    if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i.test(line)) {
      matches.push(`L${idx+1}: SAI_DUNG: ${line.trim()}`);
    }
    if (/(?:^|\s)(?:#+\s*)?(\d+)[\.\)]\s+(\d+)[\.\)]/.test(line)) {
      matches.push(`L${idx+1}: DUP_NUM: ${line.trim()}`);
    }
  });
  if (matches.length > 0) {
    console.log(`=== Buổi ${pad} (${matches.length} matches) ===`);
    matches.slice(0, 8).forEach(m => console.log('  ' + m));
    if (matches.length > 8) console.log(`  ... and ${matches.length - 8} more`);
  }
}
