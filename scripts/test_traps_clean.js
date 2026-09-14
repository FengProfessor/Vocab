const fs = require('fs');
const path = require('path');
const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';

function cleanTrapText(raw) {
  return raw
    .replace(/^#+\s*/, '')
    .replace(/^(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+)/iu, '')
    .replace(/^(?:⚠|Bẫy\s*\d*|Lưu ý bẫy|Bẫy phòng thi|Bẫy đề|Lưu ý|Bẫy kinh điển|Bẫy cực nguy hiểm|ĐẠI BẪY)[:—–\-]?\s*/i, '')
    .replace(/^[\s*•✦\-–—\d\.\)→✓✗❌✅]+/, '')
    .replace(/\*\*+/g, '')
    .replace(/cần thuộc[:\*]*\s*/i, '')
    .replace(/^[A-Z0-9\s]+Trap\):?\s*/i, '')
    .replace(/`slide[^`]*`/gi, '')
    .replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '')
    .replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '')
    .replace(/[:—–\-]+$/, '')
    .trim();
}

function extractTrapsClean(giaoAnPath, bNum) {
  if (!fs.existsSync(giaoAnPath)) return [];
  const content = fs.readFileSync(giaoAnPath, 'utf8');
  
  const scriptSplit = content.split(/##\s*Kịch bản/i);
  const theoryPart = scriptSplit[0];
  const lines = theoryPart.split(/\r?\n/);
  const traps = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('|') || line.startsWith('#')) continue;

    // Check if line is a trap section header like "**④ ⚠ Bẫy đề:**" or "**③ Bẫy To Be:**"
    if (/^[#*•\s]*(?:③|④|\d+)?\s*(?:⚠\s*)?(?:Bẫy|Lưu ý|Đại bẫy)[^:\n]*:\**\s*$/i.test(line)) {
      // Look ahead for trap bullets (e.g. "- → ...", "- ...", or explanation)
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (next === '---' || next.startsWith('#') || next.startsWith('```')) break;
        if (next.startsWith('- →') || next.startsWith('→')) {
          const clean = cleanTrapText(next);
          if (clean.length > 15 && !traps.includes(clean)) {
            traps.push(clean);
          }
        } else if (/^-\s+(?![✓✗❌✅])/.test(next) && !next.includes('**') && !next.startsWith('- ✗') && !next.startsWith('- ✓')) {
          const clean = cleanTrapText(next);
          if (clean.length > 15 && !traps.includes(clean)) {
            traps.push(clean);
          }
        }
      }
      continue;
    }

    if (line.includes('cần thuộc:') || line.includes('cần thuộc:**')) continue;

    if (/(?:⚠|Bẫy|Lưu ý bẫy|Bẫy phòng thi|Bẫy đề|Bẫy kinh điển|ĐẠI BẪY)/i.test(line)) {
      const clean = cleanTrapText(line);
      if (clean.length > 15 && !traps.includes(clean)) {
        traps.push(clean);
      }
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (/^[-*•→]\s+/.test(nextLine) && !nextLine.startsWith('|')) {
          const subClean = cleanTrapText(nextLine);
          if (subClean.length > 15 && !traps.includes(subClean)) {
            traps.push(subClean);
          }
        }
      }
    }
  }

  // Fallbacks for buoi with very few traps
  if (traps.length === 0) {
    if (bNum === 1) {
      traps.push(
        "Nói về thời tiết hoặc thời gian bắt buộc phải mượn chủ ngữ 'It' (Ví dụ: 'It is very hot today', không viết 'Is very hot today').",
        "Hai danh từ nối bằng 'and' tạo thành chủ ngữ số nhiều, động từ để nguyên mẫu (Ví dụ: 'My father and mother work', không thêm -s).",
        "Khi đã mượn trợ động từ Do/Does thì động từ chính luôn trở về nguyên mẫu (Ví dụ: 'She doesn't like', không viết 'She doesn't likes').",
        "Câu có động từ To-Be thì thêm 'not' trực tiếp, không mượn trợ từ (Ví dụ: 'She isn't happy', không viết 'She doesn't be happy')."
      );
    } else if (bNum === 7) {
      traps.push(
        "Nhầm lẫn giữa thì Hiện tại hoàn thành và Quá khứ đơn khi câu có mốc thời gian xác định (yesterday, last year ➔ Bắt buộc Quá khứ đơn).",
        "Dùng thì Tương lai (will) ngay sau các liên từ chỉ thời gian (when, as soon as, until ➔ Bắt buộc Hiện tại đơn).",
        "Chia động từ số nhiều cho các danh từ tận cùng bằng -s nhưng chỉ môn học, bệnh tật (Economics, Physics, Measles ➔ Động từ số ít)."
      );
    } else if (bNum === 8) {
      traps.push(
        "Động từ nội động từ (không nhận tân ngữ như happen, occur, die) tuyệt đối KHÔNG bao giờ chia ở dạng bị động.",
        "Khi chủ từ mang tính tác nhân chung chung (by people, by someone, by them) thì bắt buộc phải lược bỏ 'by + O'.",
        "Bị động kép với động từ chỉ ý kiến (people say that... ➔ It is said that... hoặc S + is said to V/to have V3)."
      );
    }
  }

  return traps;
}

for (let b = 1; b <= 25; b++) {
  const pad = String(b).padStart(2, '0');
  const f = path.join(buoiDir, 'buoi' + pad, '03-Giao-An-Buoi' + pad + '.md');
  const traps = extractTrapsClean(f, b);
  console.log(`Buổi ${pad}: ${traps.length} traps`);
}
