const fs = require('fs');
const path = require('path');

const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';

const patterns = [
  { name: 'Card/Ô tags', regex: /(?:🟡|THẺ|Thẻ|Ô\s+[A-Z0-9]|Khung\s+[A-Z0-9])/u },
  { name: 'cần thuộc', regex: /cần thuộc/i },
  { name: 'SAI/ĐÚNG label', regex: /—\s*\*?SAI\*?|—\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\)|-\s*\*SAI\*|-\s*\*ĐÚNG\*/i },
  { name: 'Duplicate numbering', regex: /(?:^|\s)(?:#+\s*)?(\d+)[\.\)]\s+(\d+)[\.\)]/ },
  { name: 'Slide noise', regex: /`slide[^`]*`|Slide\s*\d+/i }
];

for (let b = 1; b <= 25; b++) {
  const pad = String(b).padStart(2, '0');
  const bFolder = path.join(buoiDir, `buoi${pad}`);
  if (!fs.existsSync(bFolder)) continue;

  const files = fs.readdirSync(bFolder);
  for (const f of files) {
    if (!f.endsWith('.md') && !f.endsWith('.html') && !f.endsWith('.json')) continue;
    if (f.startsWith('01-Phieu-Bai-Tap') && f.endsWith('.html') && !f.endsWith('-KEY.html')) continue; // student blank sheet
    const fPath = path.join(bFolder, f);
    const content = fs.readFileSync(fPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, lineIdx) => {
      // Check for specific noise:
      if (/🟡|THẺ\s+[A-Z0-9]|Ô\s+[A-Z0-9]\s*[·:–—.-]/iu.test(line)) {
        console.log(`[${f} L${lineIdx+1}]: TAG -> ${line.trim().slice(0, 100)}`);
      }
      if (/cần thuộc/i.test(line)) {
        console.log(`[${f} L${lineIdx+1}]: CAN THUOC -> ${line.trim().slice(0, 100)}`);
      }
      if (/—\s*\*?SAI\*?|—\s*\*?ĐÚNG\*?|\(SAI\)|\(ĐÚNG\)/i.test(line)) {
        console.log(`[${f} L${lineIdx+1}]: SAI/DUNG -> ${line.trim().slice(0, 100)}`);
      }
      if (/(?:^|\s)(?:#+\s*)?(\d+)[\.\)]\s+(\d+)[\.\)]/.test(line)) {
        console.log(`[${f} L${lineIdx+1}]: DUP NUM -> ${line.trim().slice(0, 100)}`);
      }
    });
  }
}
