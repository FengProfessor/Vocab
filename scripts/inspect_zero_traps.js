const fs = require('fs');
const path = require('path');
const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';

[3, 4, 5, 7, 8, 9, 14, 17, 19].forEach(b => {
  const pad = String(b).padStart(2, '0');
  const f = path.join(buoiDir, 'buoi' + pad, '03-Giao-An-Buoi' + pad + '.md');
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const scriptSplit = content.split(/##\s*Kịch bản/i);
  const theoryPart = scriptSplit[0];
  const lines = theoryPart.split(/\r?\n/);
  const matches = [];
  lines.forEach((l, idx) => {
    if (/bẫy|lưu ý|chú ý|nhầm|dễ sai|cảnh giác/i.test(l) && !l.startsWith('|')) {
      matches.push(`L${idx+1}: ${l.trim()}`);
    }
  });
  console.log(`Buổi ${pad} (${matches.length} lines):`);
  matches.forEach(m => console.log('  ' + m));
});
