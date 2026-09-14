const fs = require('fs');
const path = require('path');

const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';

function cleanGiaoAnContent(content) {
  const lines = content.split(/\r?\n/);
  const cleanedLines = lines.map(rawLine => {
    let line = rawLine;

    // 1. Heading cleanup: "### 🟡 THẺ A · TITLE" or "### Ô A · TITLE" -> "### TITLE"
    line = line.replace(/^(#{2,4}\s+)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*\([^\)]+\))?\s*[·:–—.-]\s*/i, '$1');
    line = line.replace(/^(#{2,4}\s+)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9]\b\s*/i, '$1');

    // 2. Timetable heading cleanup: "### 12–21′ · Ô A · TITLE" -> "### 12–21′ · TITLE"
    line = line.replace(/^(###\s*\d+[\–\-\']+\d+[\'′]?\s*·\s*)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9]\s*[·:–—.-]\s*/i, '$1');
    line = line.replace(/^(###\s*Phút\s*\d+[\–\-\']+\d+:\s*Giảng\s*)(?:Ô|Thẻ|THẺ)\s+[A-Z0-9]\s*[\—\–\-]\s*/i, '$1');

    // 3. Body text references to Ô A, Ô B, etc.
    line = line.replace(/(?:^|[^\w\u00C0-\u1EF9])(?:Ô|Thẻ)\s+[A-Z0-9]\b/gi, match => {
      const prefix = match.match(/^[^\w\u00C0-\u1EF9]/) ? match[0] : '';
      return prefix + 'trọng tâm';
    });
    line = line.replace(/\s*\((?:Ô|Thẻ)\s+[A-Z0-9]\)/gi, '');

    // 4. Clean "cần thuộc":
    line = line.replace(/Bẫy cần thuộc[:\*]*/gi, 'Bẫy đề thi:');
    line = line.replace(/cặp bẫy so sánh cần thuộc[:\*]*/gi, 'Cặp bẫy so sánh đối chiếu:');
    line = line.replace(/cần thuộc lòng/gi, 'trọng tâm');
    line = line.replace(/cần thuộc[:\*]*/gi, 'cần nhớ:');

    // 5. Clean "— *SAI*", "— *ĐÚNG*":
    line = line.replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '');
    line = line.replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '');
    line = line.replace(/\s*[-—–]\s*(?:SAI|ĐÚNG)\b/g, '');

    // 6. Clean duplicate numbers in headings: "## 1. 1. Title" -> "## 1. Title"
    line = line.replace(/^(#{2,4}\s+)(\d+)[\.\)]\s+(\d+)[\.\)]\s*/, '$1$2. ');

    return line;
  });

  return cleanedLines.join('\n');
}

function cleanPhieuHocTapContent(content) {
  const lines = content.split(/\r?\n/);
  const cleanedLines = lines.map(rawLine => {
    let line = rawLine;

    // 1. Clean "<h3><span class="bid">1</span> Ô A · TITLE</h3>" -> "<h3><span class="bid">1</span> TITLE</h3>"
    line = line.replace(/(<h3><span class=["']bid["']>\d+<\/span>\s*)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*\([^\)]+\))?\s*[·:–—.-]\s*/i, '$1');

    // 2. Clean "THẦN CHÚ 3 GIÂY CHO Ô A:"
    line = line.replace(/THẦN CHÚ 3 GIÂY CHO (?:Ô|THẺ)\s+[A-Z0-9]:/gi, 'THẦN CHÚ 3 GIÂY TRỌNG TÂM:');

    // 3. Clean "CẦN THUỘC LÒNG" in section titles
    line = line.replace(/CẦN THUỘC LÒNG/gi, 'TRỌNG TÂM');
    line = line.replace(/cần thuộc lòng/gi, 'trọng tâm');

    // 4. Clean comments like "<!-- KHỐI 1: Ô A · ... -->"
    line = line.replace(/(<!--\s*KHỐI\s*\d+:\s*)(?:Ô|THẺ)\s+[A-Z0-9]\s*[·:–—.-]\s*/i, '$1');

    // 5. Clean footer spans like "<span>Trang 1/2 — ... Ô A ...</span>"
    line = line.replace(/(?:^|[^\w\u00C0-\u1EF9])(?:Ô|THẺ)\s+[A-Z0-9]\s*/gi, match => {
      const prefix = match.match(/^[^\w\u00C0-\u1EF9]/) ? match[0] : '';
      return prefix;
    });

    // 6. Clean "— *SAI*", "— *ĐÚNG*"
    line = line.replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '');
    line = line.replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '');

    return line;
  });

  return cleanedLines.join('\n');
}

for (let b = 1; b <= 25; b++) {
  const pad = String(b).padStart(2, '0');
  const gaFile = path.join(buoiDir, 'buoi' + pad, '03-Giao-An-Buoi' + pad + '.md');
  if (fs.existsSync(gaFile)) {
    const raw = fs.readFileSync(gaFile, 'utf8');
    const cleaned = cleanGiaoAnContent(raw);
    const leftover = [];
    const rCard = /(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/u;
    if (rCard.test(cleaned)) leftover.push('CARD_CELL');
    if (/cần thuộc/i.test(cleaned)) leftover.push('CAN_THUOC');
    if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*/i.test(cleaned)) leftover.push('SAI_DUNG');
    if (leftover.length > 0) console.log(`Buổi ${pad} Giao-An: leftover -> ${leftover.join(', ')}`);
  }

  const phtFile = path.join(buoiDir, 'buoi' + pad, '01-Phieu-Hoc-Tap-Buoi' + pad + '.html');
  if (fs.existsSync(phtFile)) {
    const raw = fs.readFileSync(phtFile, 'utf8');
    const cleaned = cleanPhieuHocTapContent(raw);
    const leftover = [];
    const rCard = /(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/u;
    if (rCard.test(cleaned)) leftover.push('CARD_CELL');
    if (/cần thuộc/i.test(cleaned)) leftover.push('CAN_THUOC');
    if (/—\s*\*SAI\*|—\s*\*ĐÚNG\*/i.test(cleaned)) leftover.push('SAI_DUNG');
    if (leftover.length > 0) console.log(`Buổi ${pad} Phieu-Hoc-Tap: leftover -> ${leftover.join(', ')}`);
  }
}
console.log('All 25 buổi checked.');
