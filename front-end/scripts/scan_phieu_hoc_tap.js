const fs = require('fs');
const path = require('path');
const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';

for (let b = 1; b <= 25; b++) {
  const pad = String(b).padStart(2, '0');
  const f = path.join(buoiDir, 'buoi' + pad, '01-Phieu-Hoc-Tap-Buoi' + pad + '.html');
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô)\s+[A-Z0-9]+(?:\s*[\·\:\–\—\-]\s*|\s+)/i.test(line)) {
      console.log(`Buổi ${pad} L${idx+1}: CARD_CELL -> ${line.trim().slice(0, 80)}`);
    }
    if (/cần thuộc/i.test(line)) {
      console.log(`Buổi ${pad} L${idx+1}: CAN_THUOC -> ${line.trim().slice(0, 80)}`);
    }
    if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*|\*SAI\*|\*ĐÚNG\*/i.test(line)) {
      console.log(`Buổi ${pad} L${idx+1}: SAI_DUNG -> ${line.trim().slice(0, 80)}`);
    }
  });
}
