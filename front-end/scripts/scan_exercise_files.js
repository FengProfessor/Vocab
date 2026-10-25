const fs = require('fs');
const path = require('path');
const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';

for (let b = 1; b <= 25; b++) {
  const pad = String(b).padStart(2, '0');
  const dir = path.join(buoiDir, 'buoi' + pad);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.includes('BTVN') || file.includes('questions_data') || file.includes('Phieu-Bai-Tap')) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isFile() && (file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.html'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = [];
        if (/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô)\s+[A-Z0-9]+(?:\s*[\·\:\–\—\-]\s*|\s+)/i.test(content)) matches.push('CARD_CELL');
        if (/cần thuộc/i.test(content)) matches.push('CAN_THUOC');
        if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i.test(content)) matches.push('SAI_DUNG');
        if (matches.length > 0) {
          console.log(`Buổi ${pad} / ${file}: ${matches.join(', ')}`);
        }
      }
    }
  }
}
