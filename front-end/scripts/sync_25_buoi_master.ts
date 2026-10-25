import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const buoiDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi';
const dataDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/data';
const dataInDir = 'D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/data/in';

const BUOI_TITLES: Record<number, string> = {
  1: 'Khởi động — Xương câu S–V–O & Lộ trình 25 buổi',
  2: 'Hiện tại đơn  vs  Hiện tại tiếp diễn',
  3: 'Quá khứ đơn  vs  Quá khứ tiếp diễn',
  4: 'Hiện tại hoàn thành  vs  Quá khứ hoàn thành',
  5: 'Các Thì Tương Lai & Sự Phối Hợp Thì (Future Tenses & Time Clauses)',
  6: 'Câu Hỏi Đuôi Toàn Diện (Tag Questions Masterclass)',
  7: 'Tổng Ôn & Luyện Phản Xạ Chặng 1 (7 Thì & Nền Tảng)',
  8: 'Câu Bị Động (Passive Voice — Cơ Bản & Nâng Cao)',
  9: 'Word Form & Trật Tự Tính Từ (Word Form & OSASCOMP)',
  10: 'Các Cấu Trúc So Sánh (Comparisons & Double Comparisons)',
  11: 'Câu Điều Kiện & Đảo Ngữ (Conditionals & Inversions)',
  12: 'Câu Tường Thuật (Reported Speech & Reporting Verbs)',
  13: 'Mệnh Đề Quan Hệ & Rút Gọn Mệnh Đề Quan Hệ (Relative Clauses)',
  14: 'Động Từ Khuyết Thiếu & Khuyết Thiếu Hoàn Thành (Modal Verbs & Modal Perfect)',
  15: 'Danh Động Từ & Động Từ Nguyên Mẫu (Gerunds & Infinitives: V-ing vs To-V)',
  16: 'Câu Giả Định & Thể Giả Định (Subjunctive Mood)',
  17: 'Mạo Từ & Từ Chỉ Số Lượng (Articles & Quantifiers)',
  18: 'Giới Từ & Cụm Giới Từ Cố Định (Prepositions & Prepositional Phrases)',
  19: 'Liên Từ & Mệnh Đề Trạng Ngữ (Conjunctions & Adverbial Clauses)',
  20: 'Đảo Ngữ Toàn Diện (Inversions)',
  21: 'Sự Hòa Hợp Chủ Ngữ & Động Từ Toàn Diện (Subject-Verb Agreement)',
  22: 'Cụm Động Từ Thông Dụng (Phrasal Verbs)',
  23: 'Cụm Từ Cố Định & Thành Ngữ Thực Chiến (Collocations & Idioms)',
  24: 'Quy Tắc Ngữ Âm & Trọng Âm Toàn Diện (Phonetics & Word Stress)',
  25: 'Tổng Ôn Toàn Diện & Kỹ Thuật Làm Chủ Ngữ Pháp Tiếng Anh',
};

const VIDEO_URLS: Record<number, string> = {
  1: 'https://www.youtube.com/embed/p1o1_iA4p0E',
  2: 'https://www.youtube.com/embed/wOz_e3e0g8Q',
  3: 'https://www.youtube.com/embed/dQ61Lg7l9zI',
  4: 'https://www.youtube.com/embed/2_YI_t_p1p0',
  5: 'https://www.youtube.com/embed/5k5e7t8g1qA',
  6: 'https://www.youtube.com/embed/xM3X_vA8a9w',
  7: 'https://www.youtube.com/embed/yV4_8bB1n8M',
  8: 'https://www.youtube.com/embed/nRGLDD0BBdc',
  9: 'https://www.youtube.com/embed/M2Q0_kGZ-wE',
  10: 'https://www.youtube.com/embed/yN5J0N8_eI0',
  11: 'https://www.youtube.com/embed/m7wT5zB4K3A',
  12: 'https://www.youtube.com/embed/e_6H3T_Q8rA',
  13: 'https://www.youtube.com/embed/B_C3jB_p8t0',
  14: 'https://www.youtube.com/embed/t9Z9B8aQ-8E',
  15: 'https://www.youtube.com/embed/7d8j_bE1n9A',
  16: 'https://www.youtube.com/embed/v9C0_A7q2xY',
  17: 'https://www.youtube.com/embed/gW7_7C6w2tY',
  18: 'https://www.youtube.com/embed/k4J2_M5r9eA',
  19: 'https://www.youtube.com/embed/l8B3_N4t0wE',
  20: 'https://www.youtube.com/embed/m9K4_V5y1zA',
  21: 'https://www.youtube.com/embed/w1A5_kP8y0E',
  22: 'https://www.youtube.com/embed/p8D2_R1m3nQ',
  23: 'https://www.youtube.com/embed/r9T4_P2x5tE',
  24: 'https://www.youtube.com/embed/s0Y5_K3e8wQ',
  25: 'https://www.youtube.com/embed/u1Z9_O4p7vA',
};

function decodeHtml(str: string): string {
  return (str || '')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getLevelForBuoi(bNum: number): 'beginner' | 'intermediate' | 'advanced' {
  if (bNum <= 7) return 'beginner';
  if (bNum <= 16) return 'intermediate';
  return 'advanced';
}

/** Trích xuất nội dung Mặt B (Bảng tra cứu) từ 01-Phieu-Hoc-Tap-BuoiNN.html */
function extractCheatSheetHtml(handoutHtmlPath: string): string {
  if (!fs.existsSync(handoutHtmlPath)) return '';
  const html = fs.readFileSync(handoutHtmlPath, 'utf8');

  let sheetContent = '';
  const sheetMatch = html.match(/<div class=["']sheet["']>([\s\S]*?)<\/div>\s*<\/div>\s*(?:<script|<\/body>|$)/i);
  if (sheetMatch) {
    sheetContent = sheetMatch[1];
  } else {
    const tableMatches = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)];
    if (tableMatches.length > 0) {
      sheetContent = tableMatches[tableMatches.length - 1][0];
    }
  }

  if (sheetContent) {
    sheetContent = sheetContent
      .replace(/<div class=["']bar["']>[\s\S]*?<\/div>/gi, '')
      .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '')
      .replace(/<div class=["']foot["']>[\s\S]*?<\/div>/gi, '')
      .replace(/<span class=["']code["']>[\s\S]*?<\/span>/gi, '')
      .replace(/<p class=["']sub["']>[\s\S]*?<\/p>/gi, '')
      .replace(/Bản nâng cấp V2[^\.<]*\.?/gi, '')
      .replace(/CẦN THUỘC LÒNG/gi, 'TRỌNG TÂM')
      .replace(/cần thuộc lòng/gi, 'trọng tâm')
      .replace(/cần thuộc[:\*]*\s*/gi, 'cần nhớ: ')
      .replace(/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9]\s*[·:–—.-]\s*/giu, ' ')
      .replace(/\s*\((?:Ô|Thẻ)\s+[A-Z0-9]\)/giu, '')
      .replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '')
      .replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '')
      .replace(/[-*•]\s*(?:✗|❌|SAI|Sai)\s*[:—–\-]?\s*/g, '- ❌ ')
      .replace(/[-*•]\s*(?:✓|✅|ĐÚNG|Đúng)\s*[:—–\-]?\s*/g, '- ✅ ')
      .trim();
    return sheetContent;
  }

  return '';
}

function cleanExamTerminology(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:trong\s+)?(?:kỳ\s+)?(?:thi|đề thi)\s*THPT(?:\s*QG|\s*Quốc Gia)?/gi, '')
    .replace(/THPT(?:\s*QG|\s*Quốc Gia)?/gi, '')
    .replace(/(?:bẫy\s+)?phân hóa\s+điểm\s+9\+/gi, 'trường hợp đặc biệt nâng cao')
    .replace(/vùng\s+điểm\s+8\+/gi, 'nâng cao')
    .replace(/chinh phục\s+9\+/gi, 'làm chủ toàn diện')
    .replace(/phòng thi/gi, 'giao tiếp & thực tế')
    .replace(/chuẩn\s+đề thi/gi, 'chuẩn ngữ pháp')
    .replace(/câu\s+đề thi/gi, 'câu ví dụ')
    .replace(/đề thi/gi, 'bài tập')
    .replace(/bẫy đề/gi, 'lưu ý')
    .replace(/đại bẫy/gi, 'lưu ý quan trọng')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanTrapText(raw: string): string {
  let t = raw
    .replace(/^\|.*\|$/, '')
    .replace(/^#+\s*/, '')
    .replace(/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/giu, '')
    .replace(/^(?:⚠\s*)?(?:Bẫy\s*\d*|Lưu ý bẫy|Bẫy phòng thi|Bẫy đề|Lưu ý|Bẫy kinh điển|Bẫy cực nguy hiểm|Bẫy phát âm|Bẫy Tiền Tố|ĐẠI BẪY|Đại bẫy)[:\s*–—\-]+/iu, '')
    .replace(/^[\s*•✦\-–—\d\.\)→✓✗❌✅]+/, '')
    .replace(/\*\*+/g, '')
    .replace(/`slide[^`]*`/gi, '')
    .replace(/`+/g, '')
    .replace(/cần thuộc lòng/gi, 'trọng tâm')
    .replace(/cần thuộc[:\*]*\s*/iu, '')
    .replace(/^[A-Z0-9\s]+Trap\):?\s*/iu, '')
    .replace(/<\/?(?:s|b|i|span|strong|em)[^>]*>/gi, '')
    .replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '')
    .replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '')
    .replace(/\s*[-—–]\s*(?:SAI|ĐÚNG)\b/g, '')
    .replace(/[:—–\-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Strip duplicate numbering prefix e.g. "1. 1. " or "1. " or "Bẫy 1: Bẫy 1: "
  t = t.replace(/^(?:\d+[\.\)]\s*)+/, '');
  t = t.replace(/^(?:(?:Bẫy|Lưu ý)\s*\d*[:\s–—\-]*)+/iu, '');
  t = cleanExamTerminology(t);

  if (t.length > 0) {
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t;
}

function cleanContrastText(raw: string): string {
  let t = raw
    .replace(/^[-*•\s]+/, '')
    .replace(/^(?:✅|❌|✓|✗|ĐÚNG|SAI|Đúng|Sai|Good|Bad)[:—–\-]?\s*/i, '')
    .replace(/\s*[-—–]\s*\*(?:ĐÚNG|SAI|Đúng|Sai|đều đặn[^\*]*|làm tạm[^\*]*|SAI[^\*]*|ĐÚNG[^\*]*)\*$/i, '')
    .replace(/\s*\([^\)]*(?:ĐÚNG|SAI|Đúng|Sai)[^\)]*\)/gi, '')
    .replace(/<\/?(?:s|b|i|span|strong|em)[^>]*>/gi, '')
    .replace(/\*\*+/g, '')
    .replace(/`+/g, '')
    .replace(/[:—–\-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  t = cleanExamTerminology(t);
  return t;
}

function cleanTheoryMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown) return '';

  const lines = rawMarkdown.split(/\r?\n/);
  const cleanedLines = lines.map(rawLine => {
    let line = rawLine;

    // 1. Heading cleanup: "### 🟡 THẺ A · TITLE" or "### Ô A · TITLE" -> "### TITLE"
    line = line.replace(/^(#{2,4}\s+)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*\([^\)]+\))?\s*[·:–—.-]\s*/i, '$1');
    line = line.replace(/^(#{2,4}\s+)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9]\b\s*/i, '$1');

    // 2. Headings normalization
    line = line.replace(/^##\s*Nội dung cốt(?:\s*[\—\–\-]\s*[^\n]+)?/i, '## Kiến thức cốt lõi');
    line = line.replace(/^##\s*Bảng chốt Master(?:\s*[\—\–\-]\s*[^\n]+)?/i, '## Bảng chốt quy tắc Master');
    line = line.replace(/^##\s*Bản Chất Ngôn Ngữ & Ngữ Cảnh Giao Tiếp(?:\s*\([^\)]*\))?/i, '## Bản chất ngôn ngữ & Ứng dụng thực tế');

    // 3. Timetable heading cleanup
    line = line.replace(/^(###\s*\d+[\–\-\']+\d+[\'′]?\s*·\s*)(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9]\s*[·:–—.-]\s*/i, '$1');
    line = line.replace(/^(###\s*Phút\s*\d+[\–\-\']+\d+:\s*Giảng\s*)(?:Ô|Thẻ|THẺ)\s+[A-Z0-9]\s*[\—\–\-]\s*/i, '$1');

    // 4. Clean table labels e.g. "(Ô A)", "(Ô B)"
    line = line.replace(/\s*\((?:Ô|Thẻ)\s+[A-Z0-9]\)/gi, '');

    // 5. Clean circled numbers
    line = line.replace(/①\s*KHUNG\s*/gi, '**Công thức:** ');
    line = line.replace(/②\s*(?:KHI NÀO|NGỮ CẢNH|ĐIỀU KIỆN)\s*/gi, '**Cách dùng:** ');
    line = line.replace(/②\s*LƯU Ý\s*/gi, '**Lưu ý trọng tâm:** ');
    line = line.replace(/③\s*(?:Cặp đối[^\n]*|Cơ chế[^\n]*)/gi, '**Ví dụ đối chiếu:**');
    line = line.replace(/④\s*(?:⚠\s*)?(?:Bẫy đề[^\n]*|Bẫy thi[^\n]*)/gi, '**Lưu ý & Trường hợp đặc biệt:**');
    line = line.replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '•');

    // 6. Clean "cần thuộc"
    line = line.replace(/Bẫy cần thuộc[:\*]*/gi, 'Lưu ý quan trọng:');
    line = line.replace(/cặp bẫy so sánh cần thuộc[:\*]*/gi, 'Cặp cấu trúc đối chiếu cần nhớ:');
    line = line.replace(/cần thuộc lòng/gi, 'trọng tâm');
    line = line.replace(/cần thuộc[:\*]*\s*/gi, 'cần nhớ:');

    // 7. Clean "— *SAI*", "— *ĐÚNG*"
    line = line.replace(/[-*•]\s*(?:✗|❌|SAI|Sai)\s*[:—–\-]?\s*/g, '- ❌ ');
    line = line.replace(/[-*•]\s*(?:✓|✅|ĐÚNG|Đúng)\s*[:—–\-]?\s*/g, '- ✅ ');
    line = line.replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '');
    line = line.replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '');
    line = line.replace(/\s*[-—–]\s*(?:SAI|ĐÚNG)\b/g, '');

    // 8. Clean duplicate numbers in headings: "## 1. 1. Title" -> "## 1. Title"
    line = line.replace(/^(#{2,4}\s+)(\d+)[\.\)]\s+(\d+)[\.\)]\s*/, '$1$2. ');

    // 9. Clean slide notations and teacher talks
    line = line.replace(/>\s*\*\*Giáo viên nhấn mạnh với học sinh:\*\*\s*/gi, '> 💡 **Lưu ý trọng tâm:** ');
    line = line.replace(/`slide\s*[\d–-]+`/gi, '');
    line = line.replace(/`slide`/gi, '');

    line = cleanExamTerminology(line);

    return line;
  });

  let text = cleanedLines.join('\n');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

/** Trích xuất lý thuyết ngữ pháp & hướng dẫn thuần túy từ 03-Giao-An-BuoiNN.md (loại bỏ 100% kịch bản lên lớp) */
function extractGiaoAnTheory(giaoAnPath: string, handoutHtmlPath: string, bNum: number): {
  bigQuestion: string;
  outcome: string;
  markdown: string;
  examples: any[];
  contrastPairs: any[];
  traps: string[];
} {
  const examples: any[] = [];
  const contrastPairs: any[] = [];
  const traps: string[] = [];
  let bigQuestion = '';
  let outcome = '';

  let content = '';
  if (fs.existsSync(giaoAnPath)) {
    content = fs.readFileSync(giaoAnPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const qMatch = line.match(/(?:Câu hỏi cả buổi|Câu hỏi lớn|Câu hỏi cốt lõi)\s*\|\s*\*{0,2}(.*?)\*{0,2}\s*\|/i);
      if (qMatch) {
        bigQuestion = qMatch[1].replace(/\*\*/g, '').trim();
        break;
      }
    }

    for (const line of lines) {
      const oMatch = line.match(/(?:Outcome|Mục tiêu đạt được|Mục tiêu)\s*\|\s*(.*?)\s*\|/i);
      if (oMatch) {
        outcome = oMatch[1].trim();
        break;
      }
    }
  }

  let sections: string[] = [];

  if (bNum === 1) {
    sections.push(`## Cấu trúc câu S – V – O

**Công thức cốt lõi:** \`S + V + O\`

- **S (Subject - Chủ ngữ)**: Người hoặc vật thực hiện hành động.
- **V (Verb - Động từ)**: Hành động hoặc trạng thái. Mọi câu tiếng Anh bắt buộc phải có ít nhất một động từ vị ngữ chính.
- **O (Object - Tân ngữ)**: Đối tượng chịu tác động của hành động.
- **Quy tắc vàng**: Thứ tự S–V–O trong tiếng Anh là cố định, không được lược bỏ động từ vị ngữ chính.`);

    sections.push(`## Sự hòa hợp Chủ ngữ & Động từ (Số ít vs Số nhiều)

**Quy tắc chia động từ:**
- **Chủ ngữ số ít ($S_{ít}$)**: \`He / She / It / Danh từ số ít / Danh từ không đếm được\` ➔ Đi với động từ thêm \`-s / -es\` (hoặc to-be \`is / was\`).
- **Chủ ngữ số nhiều ($S_{nhiều}$)**: \`They / We / You / Danh từ số nhiều / 2 danh từ nối bằng 'and'\` ➔ Đi với động từ nguyên mẫu để trơ (hoặc to-be \`are / were\`).`);

    sections.push(`## Câu Phủ định & Nghi vấn (Mượn Do/Does hay dùng Be?)

**Quy tắc phân biệt:**
- **Câu có Động từ To-Be:** Tự thêm \`not\` (\`isn't, aren't, wasn't, weren't\`) hoặc tự đảo To-Be ra trước chủ ngữ khi đặt câu hỏi. Tuyệt đối không mượn \`do / does / did\`.
- **Câu có Động từ Thường:** Bắt buộc phải mượn trợ động từ \`do / does / did\` khi phủ định hoặc đặt câu hỏi. Khi đã mượn trợ từ, động từ chính luôn trở về dạng nguyên mẫu không chia.`);

    sections.push(`## Bảng tổng kết 3 Quy tắc Vàng cần nhớ

1. **Quy tắc 1 (Thiếu V)**: Câu tiếng Anh tuyệt đối không được thiếu động từ. Nếu câu chưa có hành động cụ thể, bắt buộc phải dùng động từ To-Be (\`am / is / are\`).
2. **Quy tắc 2 (Chủ ngữ giả 'It')**: Khi nói về thời tiết, thời gian, khoảng cách, tiếng Anh bắt buộc phải mượn chủ ngữ giả \`It\` (\`It is very hot today\`, không viết \`Is very hot today\`).
3. **Quy tắc 3 (Quy tắc bù trừ -s)**: Chủ ngữ số ít thì động từ có \`-s/-es\`. Chủ ngữ đã có \`-s\` (số nhiều) thì động từ để trơ không thêm \`-s\`.`);
  } else if (content) {
    // 1. Bản chất ngôn ngữ & ngữ cảnh giao tiếp (nếu có)
    const pragMatch = content.match(/##\s*Bản Chất Ngôn Ngữ & Ngữ Cảnh Giao Tiếp[\s\S]*?(?=##\s*[A-ZÀ-Ỹ0-9])/i);
    if (pragMatch) {
      sections.push(pragMatch[0].trim());
    }

    // 2. Nội dung cốt lõi — các Thẻ Vàng / Ô kiến thức
    const coreMatch = content.match(/##\s*Nội dung cốt[\s\S]*?(?=##\s*(?:Kịch bản|Drill|Sau buổi|NEVER|🎭))/i);
    if (coreMatch) {
      sections.push(coreMatch[0].trim());
    }

    // 3. Bảng chốt Master — Thần chú 5 giây (Hướng dẫn làm bài)
    const masterMatch = content.match(/##\s*Bảng chốt Master[\s\S]*?(?=##\s*(?:Kịch bản|Drill|Sau buổi|NEVER))/i);
    if (masterMatch) {
      sections.push(masterMatch[0].trim());
    }

    // Fallback if no specific section matched
    if (sections.length === 0) {
      const altMatch = content.match(/##\s*(?:THẺ|Ô\s+[ABC]|Khung)[\s\S]*?(?=##\s*(?:Kịch bản|Drill|Sau buổi|NEVER))/i);
      if (altMatch) sections.push(altMatch[0].trim());
    }
  }

  let body = sections.join('\n\n---\n\n');
  body = cleanTheoryMarkdown(body);

  // 1. Thu thập bẫy đề thi từ nội dung markdown (LỌC TUYỆT ĐỐI RÁC BẢNG, TIÊU ĐỀ VÀ BLOCKQUOTE, CẮT BỎ KỊCH BẢN)
  if (content) {
    const scriptSplit = content.split(/##\s*Kịch bản/i);
    const theoryPart = scriptSplit[0];
    const lines = theoryPart.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith('|') || line.startsWith('#') || line.startsWith('>')) continue;

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

      if (/(?:⚠|Bẫy phòng thi|Bẫy đề|Bẫy kinh điển|Bẫy cực nguy hiểm|ĐẠI BẪY)/i.test(line)) {
        const clean = cleanTrapText(line);
        if (clean.length > 15 && !clean.startsWith('###') && !traps.includes(clean)) {
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
  }

  // 2. Thu thập từ Handout HTML (nếu có thẻ .bay, bóc tách từng <li> nếu có)
  if (fs.existsSync(handoutHtmlPath)) {
    const handoutHtml = fs.readFileSync(handoutHtmlPath, 'utf8');
    const bayMatches = [...handoutHtml.matchAll(/<div class=["']bay["'][^>]*>([\s\S]*?)<\/div>/gi)];
    bayMatches.forEach(bm => {
      const bayInner = bm[1];
      const liMatches = [...bayInner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      if (liMatches.length > 0) {
        liMatches.forEach(lm => {
          const clean = cleanTrapText(lm[1].replace(/<[^>]+>/g, ' '));
          if (clean.length > 15 && !traps.includes(clean)) {
            traps.push(clean);
          }
        });
      } else {
        const clean = cleanTrapText(bayInner.replace(/<[^>]+>/g, ' '));
        if (clean.length > 15 && !traps.includes(clean)) {
          traps.push(clean);
        }
      }
    });

    // Thu thập cặp câu đối chiếu từ Handout HTML
    const pairMatches = [...handoutHtml.matchAll(/<li[^>]*class=["'](?:bad|sai)["'][^>]*>([\s\S]*?)<\/li>\s*<li[^>]*class=["'](?:good|dung)["'][^>]*>([\s\S]*?)<\/li>/gi)];
    pairMatches.forEach(pm => {
      const bad = cleanContrastText(pm[1]);
      const good = cleanContrastText(pm[2]);
      if (good.length > 5 && bad.length > 5 && !contrastPairs.some(p => p.good === good)) {
        contrastPairs.push({ good, bad });
      }
    });

    const altPairMatches = [...handoutHtml.matchAll(/<li[^>]*class=["'](?:good|dung)["'][^>]*>([\s\S]*?)<\/li>\s*<li[^>]*class=["'](?:bad|sai)["'][^>]*>([\s\S]*?)<\/li>/gi)];
    altPairMatches.forEach(pm => {
      const good = cleanContrastText(pm[1]);
      const bad = cleanContrastText(pm[2]);
      if (good.length > 5 && bad.length > 5 && !contrastPairs.some(p => p.good === good)) {
        contrastPairs.push({ good, bad });
      }
    });
  }

  // 3. Thu thập Cặp câu đối chiếu Đúng / Sai từ Markdown (chỉ lấy trong phần lý thuyết)
  if (content) {
    const scriptSplit = content.split(/##\s*Kịch bản/i);
    const theoryContent = scriptSplit[0];
    const contentLines = theoryContent.split('\n');
    for (let i = 0; i < contentLines.length; i++) {
      const l1 = contentLines[i].trim();
      if (/^[-*•]?\s*(?:✗|❌|SAI|Sai)\b/i.test(l1) && i + 1 < contentLines.length) {
        const l2 = contentLines[i + 1].trim();
        if (/^[-*•]?\s*(?:✓|✅|ĐÚNG|Đúng)\b/i.test(l2)) {
          const bad = cleanContrastText(l1);
          const good = cleanContrastText(l2);
          if (good.length > 5 && bad.length > 5 && !contrastPairs.some(p => p.good === good)) {
            contrastPairs.push({ good, bad });
          }
        }
      } else if (/^[-*•]?\s*(?:✓|✅|ĐÚNG|Đúng)\b/i.test(l1) && i + 1 < contentLines.length) {
        const l2 = contentLines[i + 1].trim();
        if (/^[-*•]?\s*(?:✗|❌|SAI|Sai)\b/i.test(l2)) {
          const good = cleanContrastText(l1);
          const bad = cleanContrastText(l2);
          if (good.length > 5 && bad.length > 5 && !contrastPairs.some(p => p.good === good)) {
            contrastPairs.push({ good, bad });
          }
        }
      } else if (l1.includes('<s>') && l1.includes('→')) {
        const match = l1.match(/<s>(.*?)<\/s>\s*→\s*(.*)/i);
        if (match) {
          const bad = cleanContrastText(match[1]);
          const good = cleanContrastText(match[2]);
          if (good.length > 5 && bad.length > 5 && !contrastPairs.some(p => p.good === good)) {
            contrastPairs.push({ good, bad });
          }
        }
      }
    }
  }

  // Fallbacks chuẩn xác cho từng chuyên đề trọng điểm
  if (bNum === 1) {
    if (traps.length === 0) {
      traps.push(
        "Nói về thời tiết hoặc thời gian bắt buộc phải mượn chủ ngữ 'It' (Ví dụ: 'It is very hot today', không viết 'Is very hot today').",
        "Hai danh từ nối bằng 'and' tạo thành chủ ngữ số nhiều, động từ để nguyên mẫu (Ví dụ: 'My father and mother work', không thêm -s).",
        "Khi đã mượn trợ động từ Do/Does thì động từ chính luôn trở về nguyên mẫu (Ví dụ: 'She doesn't like', không viết 'She doesn't likes').",
        "Câu có động từ To-Be thì thêm 'not' trực tiếp, không mượn trợ từ (Ví dụ: 'She isn't happy', không viết 'She doesn't be happy')."
      );
    }
    if (contrastPairs.length === 0) {
      contrastPairs.push(
        { good: 'My father is a doctor.', bad: 'My father a doctor.' },
        { good: 'My brother works in a bank.', bad: 'My brothers works in a bank.' },
        { good: 'My father and my mother work.', bad: 'My father and my mother works.' },
        { good: "She isn't happy.", bad: "She doesn't be happy." }
      );
    }
  } else if (bNum === 6) {
    if (traps.length === 0) {
      traps.push(
        "Trường hợp 'I am' thì đuôi là 'aren't I?', nhưng khi vế trước phủ định 'I am not' thì đuôi là 'am I?'.",
        "Have/Has là trợ động từ (have + V3) thì đảo 'hasn't she?', nhưng khi là động từ thường chỉ sở hữu thì phải mượn 'doesn't she?'.",
        "Đại từ bất định chỉ người (Everyone, Somebody, Nobody) quy về 'they' ở đuôi và động từ đuôi phải chia số nhiều ('aren't they?').",
        "Tiền tố phủ định (un-, dis-, in-, non-) không làm câu thành phủ định ngữ pháp, đuôi vẫn phải ở dạng phủ định (-) ('He is unhappy, isn't he?').",
        "Cấu trúc 'I don't think + S + V' thì phủ định chuyển giao cho vế sau, đuôi phải chia khẳng định (+) theo vế sau ('will he?')."
      );
    }
    if (contrastPairs.length === 0) {
      contrastPairs.push(
        { good: "She has a car, doesn't she?", bad: "She has a car, hasn't she?" },
        { good: "I am right, aren't I?", bad: "I am right, amn't I?" },
        { good: "Everybody is ready, aren't they?", bad: "Everybody is ready, isn't he?" },
        { good: "He is unhappy, isn't he?", bad: "He is unhappy, is he?" }
      );
    }
  } else if (bNum === 7) {
    if (traps.length === 0) {
      traps.push(
        "Nhầm lẫn giữa thì Hiện tại hoàn thành và Quá khứ đơn khi câu có mốc thời gian xác định (yesterday, last year ➔ Bắt buộc Quá khứ đơn).",
        "Dùng thì Tương lai (will) ngay sau các liên từ chỉ thời gian (when, as soon as, until ➔ Bắt buộc Hiện tại đơn).",
        "Chia động từ số nhiều cho các danh từ tận cùng bằng -s nhưng chỉ môn học, bệnh tật (Economics, Physics, Measles ➔ Động từ số ít)."
      );
    }
  } else if (bNum === 8) {
    if (traps.length === 0) {
      traps.push(
        "Động từ nội động từ (không nhận tân ngữ như happen, occur, die) tuyệt đối KHÔNG bao giờ chia ở dạng bị động.",
        "Khi chủ từ mang tính tác nhân chung chung (by people, by someone, by them) thì bắt buộc phải lược bỏ 'by + O'.",
        "Bị động kép với động từ chỉ ý kiến (people say that... ➔ It is said that... hoặc S + is said to V/to have V3)."
      );
    }
  }

  bigQuestion = cleanExamTerminology(bigQuestion);
  outcome = cleanExamTerminology(outcome);
  const cleanTraps = traps.map(cleanExamTerminology).filter(t => t.length > 5);

  let markdown = `# Buổi ${bNum}: ${BUOI_TITLES[bNum]}\n\n`;
  if (bigQuestion) {
    markdown += `> 💡 **Câu hỏi cốt lõi**: ${bigQuestion}\n\n`;
  }
  if (outcome) {
    markdown += `🎯 **Mục tiêu đạt được**: ${outcome}\n\n`;
  }
  markdown += body;

  return { bigQuestion, outcome, markdown, examples, contrastPairs, traps: cleanTraps };
}

// Parser for questions_data.json (Buổi 10 to 25)
function parseQuestionsJson(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const items: any[] = Array.isArray(raw) ? raw : Object.values(raw);
    const questions: any[] = [];

    items.forEach((item, idx) => {
      const qNum = item.id || idx + 1;
      const qText = item.question || item.q || '';
      if (!qText) return;

      const optsObj = item.options || {};
      const options: string[] = [];
      let correctAnswer = '';

      if (Array.isArray(optsObj)) {
        optsObj.forEach((opt: any, oIdx: number) => {
          const letter = String.fromCharCode(65 + oIdx);
          const optStr = typeof opt === 'string' ? opt : opt.text || String(opt);
          const cleanOpt = optStr.replace(/^[A-D]\.\s*/i, '').trim();
          options.push(`${letter}. ${cleanOpt}`);
        });
      } else if (typeof optsObj === 'object') {
        ['A', 'B', 'C', 'D'].forEach(letter => {
          if (optsObj[letter]) {
            options.push(`${letter}. ${String(optsObj[letter]).trim()}`);
          }
        });
      }

      const rawAns = String(item.answer || item.correct_answer || '').trim();
      if (/^[A-D]$/i.test(rawAns)) {
        const letter = rawAns.toUpperCase();
        const found = options.find(o => o.startsWith(`${letter}.`));
        correctAnswer = found ? found.replace(/^[A-D]\.\s*/, '').trim() : letter;
      } else {
        correctAnswer = rawAns.replace(/^[A-D]\.\s*/i, '').trim();
      }

      questions.push({
        id: `q-${qNum}`,
        question: qText,
        options,
        correct_answer: correctAnswer,
        explanation: item.explanation || item.why || item.giaiThich || '',
        type: options.length >= 2 ? 'multiple_choice' : 'fill_blank',
        difficulty: qNum <= 25 ? 1 : qNum <= 60 ? 2 : 3,
      });
    });

    return questions;
  } catch (e) {
    console.error('Error parsing questions_data.json:', e);
    return [];
  }
}

// Parser for 01-Phieu-Bai-Tap-BuoiXX-KEY.html (Buổi 08, 09)
function parseKeyHtml(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const html = fs.readFileSync(filePath, 'utf8');
  const exRegex = /<div class=["']ex["']>([\s\S]*?)<\/div>\s*(?=<div class=["']ex["']>|<\/div>\s*<\/div>\s*<\/body>|$)/gi;
  const questions: any[] = [];
  let m;
  let qIndex = 0;

  while ((m = exRegex.exec(html)) !== null) {
    qIndex++;
    const block = m[1];
    const qMatch = block.match(/<div class=["']q["']>([\s\S]*?)<\/div>/i);
    const rawQ = qMatch ? qMatch[1].replace(/<[^>]+>/g, '').replace(/^\d+\.\s*/, '').trim() : '';

    const giaiMatch = block.match(/<div class=["']giai["']>([\s\S]*?)<\/div>/i);
    let explanation = '';
    let answerLetterFromGiai = '';
    if (giaiMatch) {
      explanation = decodeHtml(
        giaiMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/[ \t]+/g, ' ')
          .trim()
      );
      const dapAnM = explanation.match(/Đáp án\s*([A-D])/i);
      if (dapAnM) {
        answerLetterFromGiai = dapAnM[1].toUpperCase();
      }
    }

    const optsMatches = [...block.matchAll(/<div class=["']opt["'][^>]*>(?:<[^>]+>)*\s*([A-D])\.\s*([\s\S]*?)<\/div>/gi)];
    const options: string[] = [];
    let correctAnswer = '';
    
    optsMatches.forEach(o => {
      const letter = o[1].toUpperCase();
      const rawContent = o[2];
      const isUnderlined = /underline/i.test(o[0]) || /<u>/i.test(rawContent);

      let cleanOpt = rawContent.replace(/<[^>]+>/g, '').trim();
      const firstParen = cleanOpt.indexOf('(');
      if (firstParen !== -1) {
        cleanOpt = cleanOpt.substring(0, firstParen).trim();
      }
      cleanOpt = decodeHtml(cleanOpt);

      options.push(`${letter}. ${cleanOpt}`);
      if (isUnderlined || (answerLetterFromGiai && letter === answerLetterFromGiai)) {
        correctAnswer = cleanOpt;
      }
    });

    if (rawQ) {
      questions.push({
        id: `q-${qIndex}`,
        question: decodeHtml(rawQ),
        options,
        correct_answer: correctAnswer,
        explanation,
        type: options.length >= 2 ? 'multiple_choice' : 'fill_blank',
        difficulty: qIndex <= 25 ? 1 : qIndex <= 60 ? 2 : 3,
      });
    }
  }
  return questions;
}

// Parser for Buổi 05 HTML (47 câu hỏi)
function parseBuoi05Html(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const html = fs.readFileSync(filePath, 'utf8');

  const keyMap = new Map<number, { ans: string; why: string }>();
  const cardRegex = /<div class=["']key-card["']>([\s\S]*?)<\/div>/gi;
  let cm;
  while ((cm = cardRegex.exec(html)) !== null) {
    const cardHtml = cm[1];
    const numM = cardHtml.match(/<b class=["']q-num["']>(\d+)\.<\/b>/i);
    const ansM = cardHtml.match(/<span class=["']ans["']>([\s\S]*?)<\/span>/i);
    const whyM = cardHtml.match(/<i class=["']why["']>([\s\S]*?)<\/i>/i);
    if (numM && ansM) {
      const qNum = parseInt(numM[1], 10);
      const ans = decodeHtml(ansM[1].replace(/<[^>]+>/g, '').trim());
      const why = whyM ? decodeHtml(whyM[1].replace(/<[^>]+>/g, '').trim()) : '';
      keyMap.set(qNum, { ans, why });
    }
  }

  const questions: any[] = [];
  const firstKeyCardIdx = html.indexOf('<div class="key-card">');
  const qBody = firstKeyCardIdx !== -1 ? html.slice(0, firstKeyCardIdx) : html;

  const olRegex = /<ol([^>]*)>([\s\S]*?)<\/ol>/gi;
  let om;
  while ((om = olRegex.exec(qBody)) !== null) {
    const attr = om[1];
    const olContent = om[2];
    const startM = attr.match(/start=["']?(\d+)["']?/i);
    let qCounter = startM ? parseInt(startM[1], 10) : 1;

    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let lm;
    while ((lm = liRegex.exec(olContent)) !== null) {
      const rawLi = lm[1];
      const qNum = qCounter++;
      const key = keyMap.get(qNum) || { ans: '', why: '' };

      const optsMatches = [...rawLi.matchAll(/<span>\s*([A-D]\.\s*[^<]+)<\/span>/gi)];
      let options: string[] = [];
      if (optsMatches.length > 0) {
        options = optsMatches.map(o => decodeHtml(o[1].trim()));
      } else {
        const bracketMatch = rawLi.match(/\(([^)]+?\/[^)]+?)\)/);
        if (bracketMatch) {
          options = bracketMatch[1].split('/').map(s => s.trim());
        }
      }

      let qText = rawLi
        .replace(/<div class=["']opts-grid["']>[\s\S]*?<\/div>/gi, '')
        .replace(/<span class=["']blank[^"']*["']><\/span>/gi, '______')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      qText = decodeHtml(qText);

      let cleanAns = key.ans;
      const choiceMatch = cleanAns.match(/^([A-D])\.\s*(.*)/i);
      if (choiceMatch) {
        cleanAns = choiceMatch[2].trim();
      }

      questions.push({
        id: `b05-q-${qNum}`,
        question: qText,
        options,
        correct_answer: cleanAns,
        explanation: key.why,
        type: options.length >= 2 ? 'multiple_choice' : 'fill_blank',
        difficulty: qNum <= 15 ? 1 : qNum <= 30 ? 2 : 3,
      });
    }
  }

  // Đoạn văn đục lỗ Phần 5 (câu 40 đến 47)
  for (let qNum = 40; qNum <= 47; qNum++) {
    const key = keyMap.get(qNum);
    if (key && !questions.some(q => q.id === `b05-q-${qNum}`)) {
      questions.push({
        id: `b05-q-${qNum}`,
        question: `Câu ${qNum} (Đoạn văn Kế hoạch du học của Linh): Điền dạng đúng của động từ.`,
        options: [],
        correct_answer: key.ans,
        explanation: key.why,
        type: 'fill_blank',
        difficulty: 2,
      });
    }
  }

  return questions;
}

// Parser for Buổi 07 (30 câu kiểm tra Chặng 1 + 10 câu BTVN)
function parseBuoi07(buoiFolder: string): any[] {
  const questions: any[] = [];
  const testPath = path.join(buoiFolder, '05-Bai-Kiem-Tra-Chang1.md');
  const btvnKeyPath = path.join(buoiFolder, 'BTVN-buoi07-KEY.md');

  if (fs.existsSync(testPath)) {
    const content = fs.readFileSync(testPath, 'utf8');
    const parts = content.split(/#\s*(?:ĐÁP ÁN|DAP AN)\s*&(?:AMP;)?\s*(?:GIẢI THÍCH|GIAI THICH)\s*CHI TIẾT/i);
    const qSection = parts[0];
    const keySection = parts[1] || '';

    const keyMap = new Map<number, { letter: string; exp: string }>();
    const keyMatches = [...keySection.matchAll(/(\d+)\.\s*\*{0,2}([A-D])\*{0,2}\.?\s*(.*)/gi)];
    keyMatches.forEach(km => {
      const qNum = parseInt(km[1], 10);
      const letter = km[2].toUpperCase();
      const exp = km[3].replace(/\*\*/g, '').trim();
      keyMap.set(qNum, { letter, exp });
    });

    const qBlocks = qSection.split(/\n(?=\*\*\d+\.\*\*|\d+\.\s+)/);
    qBlocks.forEach(qb => {
      const m = qb.match(/^(?:\*\*)?(\d+)\.?(?:\*\*)?\s*([\s\S]*?)(?=(?:\n[A-D]\.|\n\*\*[A-D]\.|$))/i);
      if (!m) return;
      const qNum = parseInt(m[1], 10);
      const qText = m[2].replace(/\*\*/g, '').trim();
      const opts = [...qb.matchAll(/(?:^|\n)\s*([A-D])\.\s*([^\n]+)/gi)].map(om => `${om[1].toUpperCase()}. ${om[2].trim()}`);

      const key = keyMap.get(qNum) || { letter: '', exp: '' };
      let ans = key.letter;
      if (key.letter && opts.length > 0) {
        const found = opts.find(o => o.startsWith(`${key.letter}.`));
        if (found) {
          ans = found.replace(/^[A-D]\.\s*/, '').trim();
        }
      }

      if (qText) {
        questions.push({
          id: `b07-test-q-${qNum}`,
          question: qText,
          options: opts,
          correct_answer: ans,
          explanation: key.exp,
          type: opts.length >= 2 ? 'multiple_choice' : 'fill_blank',
          difficulty: qNum <= 15 ? 1 : qNum <= 25 ? 2 : 3,
        });
      }
    });
  }

  // Thêm 10 câu BTVN buổi 7
  if (fs.existsSync(btvnKeyPath)) {
    const keyContent = fs.readFileSync(btvnKeyPath, 'utf8');
    const rows = [...keyContent.matchAll(/\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/gi)];
    rows.forEach(r => {
      const qNum = parseInt(r[1], 10);
      const qSentence = r[2].trim();
      const qAns = r[3].replace(/\*\*/g, '').trim();
      const qWhy = r[4].trim();
      if (qSentence && qAns) {
        questions.push({
          id: `b07-btvn-q-${qNum}`,
          question: qSentence,
          options: [],
          correct_answer: qAns,
          explanation: qWhy,
          type: 'fill_blank',
          difficulty: 2,
        });
      }
    });
  }

  return questions;
}

// Parser for 04-BTVN-BuoiXX-Combined.md (Buổi 01-04)
function parseCombinedMd(filePath: string, buoiNum?: number): any[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const questions: any[] = [];
  
  const parts = content.split(/##?\s*(?:🔑\s*)?ĐÁP ÁN\s*(?:VÀ|&)\s*(?:GIẢI THÍCH|LỜI GIẢI)\s*CHI TIẾT/i);
  const qSection = parts[0];
  const keySection = parts[1] || '';

  const keyMap = new Map<number, { ans: string; why: string }>();
  const keyLines = keySection.split('\n');
  keyLines.forEach(line => {
    const km = line.match(/^[-*•]?\s*\*{0,2}(?:Câu\s*)?(\d+)(?:\\\.|\.)?\s*(.*?)\*{0,2}(?:\s*[-–—:]\s*(.*))?$/);
    if (km) {
      const qNum = parseInt(km[1], 10);
      let ans = (km[2] || '').replace(/\*\*/g, '').trim();
      let why = (km[3] || '').trim();
      const choiceMatch = ans.match(/^([A-D])\s*\((.*?)\)/i);
      if (choiceMatch) {
        ans = choiceMatch[2].trim();
      } else {
        const arrowMatch = ans.match(/^([A-D])\s*->\s*(.*)/i);
        if (arrowMatch) {
          ans = arrowMatch[2].trim();
        }
      }
      keyMap.set(qNum, { ans, why });
    }
  });

  const qLines = qSection.split('\n');
  for (let i = 0; i < qLines.length; i++) {
    const line = qLines[i].trim();
    const qMatch = line.match(/^(\d+)\\\.\s*(.*)$/) || line.match(/^(\d+)\.\s*(.*)$/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1], 10);
      let rawText = qMatch[2].trim();
      const keyInfo = keyMap.get(qNum) || { ans: '', why: '' };
      let ans = keyInfo.ans;
      let why = keyInfo.why;

      let options: string[] = [];
      const bracketMatch = rawText.match(/\(([^)]+?\/[^)]+?)\)/);
      if (bracketMatch) {
        options = bracketMatch[1].split('/').map(s => s.trim());
      }

      let nextLineIdx = i + 1;
      const choices: string[] = [];
      while (nextLineIdx < qLines.length && /^(?:\*\*)?[A-D]\./.test(qLines[nextLineIdx].trim())) {
        choices.push(qLines[nextLineIdx].trim());
        nextLineIdx++;
      }
      if (choices.length > 0) {
        if (choices.length === 1 && choices[0].includes('|')) {
          const parts = choices[0].split('|').map(s => s.trim());
          options = [];
          parts.forEach(p => {
            const isBold = p.includes('**');
            const clean = p.replace(/\*\*/g, '').trim();
            options.push(clean);
            if (isBold && !ans) {
              ans = clean.replace(/^[A-D]\.\s*/, '').trim();
            }
          });
        } else {
          options = [];
          choices.forEach(ch => {
            const isBold = ch.includes('**');
            const clean = ch.replace(/\*\*/g, '').trim();
            options.push(clean);
            if (isBold && !ans) {
              ans = clean.replace(/^[A-D]\.\s*/, '').trim();
            }
          });
        }
        i = nextLineIdx - 1;
      }

      if (!ans && i + 1 < qLines.length && /^\s*→\s*\*\*/.test(qLines[i + 1])) {
        const am = qLines[i + 1].trim().match(/^→\s*\*\*([^*]+)\*\*(?:\s*·\s*(.*))?/);
        if (am) {
          ans = am[1].trim();
          if (am[2] && !why) why = am[2].trim();
        }
      }

      if (!ans) {
        const boldInlines = [...rawText.matchAll(/\*\*([^*]+)\*\*\s*\(([^)]+)\)/g)];
        if (boldInlines.length > 0) {
          ans = boldInlines.map(m => m[1].trim()).join(' / ');
        }
      }

      if (!ans && buoiNum === 3) {
        if (qNum === 2) { ans = 'was feeding'; why = 'at 8 p.m. last night = mốc giờ quá khứ → QK tiếp diễn'; }
        else if (qNum === 3) { ans = 'was having'; why = 'việc dài đang xảy ra (ăn sáng) thì việc ngắn xen vào (stopped)'; }
        else if (qNum === 4) { ans = "didn't know"; why = 'know là động từ trạng thái chỉ nhận thức → không chia tiếp diễn'; }
        else if (qNum === 6) { ans = 'TD'; why = 'were learning → Quá khứ tiếp diễn'; }
        else if (qNum === 7) { ans = 'D'; why = 'rang → Quá khứ đơn'; }
        else if (qNum === 8) { ans = 'D'; why = 'ran away → Quá khứ đơn'; }
        else if (qNum === 11) { ans = 'were'; why = 'Where were you last night? (To-be quá khứ đi với you)'; }
      }

      // Sanitize spoiled bold answers in question text: e.g. "**didn't have** (not / have)" -> "______ (not / have)"
      rawText = rawText.replace(/\*\*([^*]+)\*\*\s*\(([^)]+)\)/g, '______ ($2)');

      let qType: 'multiple_choice' | 'fill_blank' | 'error_correction' = 'fill_blank';
      if (options.length >= 2) {
        qType = 'multiple_choice';
      }

      questions.push({
        id: `q-${qNum}`,
        question: rawText,
        options,
        correct_answer: ans,
        explanation: why,
        type: qType,
        difficulty: qNum <= 10 ? 1 : qNum <= 35 ? 2 : 3,
      });
    }
  }

  return questions;
}

// Parser for Buoi 06
function parseBuoi06(): any[] {
  const qHtmlPath = path.join(buoiDir, 'buoi06/04-BTVN-Buoi06.html');
  const keyMdPath = path.join(buoiDir, 'buoi06/05-Giai-Thich-Chi-Tiet-Buoi06.md');
  if (!fs.existsSync(qHtmlPath) || !fs.existsSync(keyMdPath)) return [];

  const keyContent = fs.readFileSync(keyMdPath, 'utf8');
  const keyMap = new Map<number, { letter: string; ans: string; exp: string }>();
  const keyMatches = [...keyContent.matchAll(/\*\*Câu\s*(\d+)\.\s*\[([A-D])\]\s*`([^`]+)`\*\*[^\n]*\n➔\s*([^\n]+)/gi)];
  keyMatches.forEach(m => {
    const qNum = parseInt(m[1], 10);
    const letter = m[2].toUpperCase();
    const ans = m[3].trim();
    const exp = m[4].trim();
    keyMap.set(qNum, { letter, ans, exp });
  });

  const html = fs.readFileSync(qHtmlPath, 'utf8');
  const questions: any[] = [];
  const liMatches = [...html.matchAll(/<li>\s*([\s\S]*?)\s*<\/li>/gi)];
  
  let qNum = 0;
  liMatches.forEach(m => {
    const raw = m[1];
    if (raw.includes('______') || raw.includes('_____')) {
      qNum++;
      const textParts = raw.split(/<br\s*\/?>/i);
      const qText = textParts[0].replace(/<[^>]+>/g, '').trim();
      const optsText = textParts[1] ? textParts[1].replace(/<[^>]+>/g, '').trim() : '';
      
      const opts: string[] = [];
      const optMatches = [...optsText.matchAll(/([A-D]\.\s*[^A-D]+)/g)];
      optMatches.forEach(om => opts.push(om[1].trim()));

      const key = keyMap.get(qNum) || { letter: '', ans: '', exp: '' };
      questions.push({
        id: `b06-q-${qNum}`,
        question: qText,
        options: opts,
        correct_answer: key.ans || key.letter,
        explanation: key.exp,
        type: 'multiple_choice',
        difficulty: qNum <= 20 ? 1 : qNum <= 40 ? 2 : 3,
      });
    }
  });

  return questions;
}

// Fallback loader
function parseDataJson(buoiNum: number): any[] {
  const pad = String(buoiNum).padStart(2, '0');
  const dPath = path.join(dataDir, `buoi${pad}.json`);
  const inPath = path.join(dataInDir, `buoi${pad}.json`);
  const questions: any[] = [];

  if (fs.existsSync(dPath)) {
    const d = JSON.parse(fs.readFileSync(dPath, 'utf8'));
    (d.drills || []).forEach((dr: any, dIdx: number) => {
      (dr.items || []).forEach((item: any, iIdx: number) => {
        let options: string[] = [];
        const qText = item.q || '';
        const match = qText.match(/\(([^)]+?\/[^)]+?)\)/);
        if (match) {
          options = match[1].split('/').map((s: string) => s.trim());
        }
        questions.push({
          id: `b${pad}-drill-${dIdx + 1}-${iIdx + 1}`,
          question: qText,
          options,
          correct_answer: item.ans || '',
          explanation: item.why || '',
          type: options.length >= 2 ? 'multiple_choice' : 'fill_blank',
          difficulty: 1,
        });
      });
    });
  }

  if (fs.existsSync(inPath)) {
    const inData = JSON.parse(fs.readFileSync(inPath, 'utf8'));
    (inData.baiTap || []).forEach((bt: any, bIdx: number) => {
      const items = bt.cauHoi || bt.items || [];
      items.forEach((item: any, cIdx: number) => {
        let options: string[] = [];
        const qText = item.q || item.question || '';
        if (item.options && Array.isArray(item.options)) {
          options = item.options.map((o: any) => typeof o === 'string' ? o : o.text || String(o));
        } else if (qText) {
          const match = qText.match(/\(([^)]+?\/[^)]+?)\)/);
          if (match) {
            options = match[1].split('/').map((s: string) => s.trim());
          }
        }
        questions.push({
          id: `b${pad}-bt-${bIdx + 1}-${cIdx + 1}`,
          question: qText,
          options,
          correct_answer: item.ans || item.correct_answer || '',
          explanation: item.why || item.explanation || item.giaiThich || '',
          type: bt.type === 'MCQ' || options.length === 4 ? 'multiple_choice' : 'fill_blank',
          difficulty: item.level || 2,
        });
      });
    });
  }

  return questions;
}

function cleanExercise(ex: any): any {
  let q = (ex.question || ex.q || '').trim();
  let exp = (ex.explanation || ex.why || '').trim();
  let opts = Array.isArray(ex.options) ? [...ex.options] : [];

  // 1. Strip duplicate question prefix: "Câu 1: Câu 1." or "1. 1."
  q = q.replace(/^\s*(?:Câu\s*\d+[\.:]?\s*)?\d+[\.:\)]\s*\d+[\.:\)]\s*/i, '');
  q = q.replace(/^(?:(?:Câu|Question)\s*\d+[\.:\s]*){2,}/i, '');

  // 2. Strip redundant "Câu X: " or "Câu X (Ghi chú): " while keeping any parenthesis context
  // e.g. "Câu 40 (Đoạn văn Kế hoạch du học của Linh): Điền dạng đúng..." -> "(Đoạn văn Kế hoạch du học của Linh): Điền dạng đúng..."
  q = q.replace(/^(?:Câu|Question)\s*\d+\s*(?:\(([^)]+)\))?[:\s]*/i, (_match, p1) => {
    if (p1) return `(${p1}): `;
    return '';
  }).trim();

  // 3. Clean options: strip duplicate prefix "A. A." or "A. A) "
  opts = opts.map(o => {
    if (typeof o !== 'string') return o;
    let opt = o.trim();
    opt = opt.replace(/^([A-D][\.\)])\s*[A-D][\.\)]\s*/i, '$1 ');
    return opt;
  });

  // 4. Clean explanation: strip card tags, noise labels, slide references
  exp = exp
    .replace(/(?:^|[^\w\u00C0-\u1EF9])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/giu, ' ')
    .replace(/\s*\((?:Ô|Thẻ)\s+[A-Z0-9]\)/giu, '')
    .replace(/cần thuộc lòng/gi, 'trọng tâm')
    .replace(/cần thuộc[:\*]*\s*/gi, 'cần nhớ: ')
    .replace(/\s*[-—–]\s*\*(?:SAI|ĐÚNG|Sai|Đúng)\*/g, '')
    .replace(/\s*\((?:SAI|ĐÚNG|Sai|Đúng)\)/g, '')
    .replace(/`slide[^`]*`/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  q = cleanExamTerminology(q);
  exp = cleanExamTerminology(exp);

  return {
    ...ex,
    question: q,
    options: opts,
    explanation: exp,
  };
}

async function runMasterSync() {
  console.log('================================================================');
  console.log('   STARTING MASTER GRAMMAR SYNC: buoi/ -> SUPABASE WEB APP     ');
  console.log('================================================================\n');

  const { data: clsData } = await supabase.from('classrooms').select('id').limit(1);
  const defaultClassroomId = clsData?.[0]?.id || '5998db96-7c1c-4113-9aee-e61d4a57ca6b';
  console.log(`Using classroom_id: ${defaultClassroomId}\n`);

  console.log('1. Clearing outdated grammar tables...');
  await supabase.from('grammar_exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('grammar_lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('grammar_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('   Cleaned old records cleanly.\n');

  let totalTopicsCreated = 0;
  let totalLessonsCreated = 0;
  let totalExercisesInserted = 0;

  for (let bNum = 1; bNum <= 25; bNum++) {
    const pad = String(bNum).padStart(2, '0');
    const bFolder = path.join(buoiDir, `buoi${pad}`);
    const title = BUOI_TITLES[bNum];
    const level = getLevelForBuoi(bNum);
    const slug = `buoi-${pad}-${slugify(title).slice(0, 45)}`;

    console.log(`\n--------------------------------------------------------------`);
    console.log(`[Buổi ${pad}/25]: "${title}" (${level})`);

    // 1. Create Topic
    const { data: topicData, error: topicErr } = await supabase
      .from('grammar_topics')
      .insert({
        slug,
        title: `Buổi ${bNum}: ${title}`,
        title_vi: title,
        level,
        order_index: bNum,
      })
      .select()
      .single();

    if (topicErr) {
      console.error(`❌ Error inserting topic for Buổi ${pad}:`, topicErr);
      continue;
    }
    totalTopicsCreated++;

    // 2. Extract Cheat Sheet (Bảng Tra) from 01-Phieu-Hoc-Tap
    const handoutPath = path.join(bFolder, `01-Phieu-Hoc-Tap-Buoi${pad}.html`);
    const altHandoutPath = path.join(bFolder, `Phieu-Hoc-Tap-Buoi${pad}.html`);
    const activeHandoutPath = fs.existsSync(handoutPath) ? handoutPath : altHandoutPath;
    const cheatSheetHtml = extractCheatSheetHtml(activeHandoutPath);

    // 3. Extract Theory from 03-Giao-An & Handout
    const gaPath = path.join(bFolder, `03-Giao-An-Buoi${pad}.md`);
    const altGaPath = path.join(bFolder, `giao-an-buoi${pad}.md`);
    const activeGaPath = fs.existsSync(gaPath) ? gaPath : altGaPath;
    const theoryData = extractGiaoAnTheory(activeGaPath, activeHandoutPath, bNum);

    // 4. Extract Exercises with best available parser
    let exercises: any[] = [];
    const questionsJsonPath = path.join(bFolder, 'questions_data.json');

    if (bNum >= 10 && fs.existsSync(questionsJsonPath)) {
      // Buổi 10-25: High-fidelity questions_data.json
      exercises = parseQuestionsJson(questionsJsonPath);
    } else if (bNum === 5) {
      // Buổi 05: 04-BTVN-Buoi05.html
      const b05HtmlPath = path.join(bFolder, '04-BTVN-Buoi05.html');
      exercises = parseBuoi05Html(b05HtmlPath);
    } else if (bNum === 6) {
      // Buổi 06: 04-BTVN-Buoi06.html & KEY.md
      exercises = parseBuoi06();
    } else if (bNum === 7) {
      // Buổi 07: 05-Bai-Kiem-Tra-Chang1.md & BTVN-KEY.md
      exercises = parseBuoi07(bFolder);
    } else if (bNum === 8 || bNum === 9) {
      // Buổi 08, 09: 01-Phieu-Bai-Tap-BuoiXX-KEY.html
      const keyHtmlPath = path.join(bFolder, `01-Phieu-Bai-Tap-Buoi${pad}-KEY.html`);
      const altKeyHtmlPath = path.join(bFolder, `BTVN-Buoi08-Mo-Rong-KEY.html`);
      if (fs.existsSync(keyHtmlPath)) {
        exercises = parseKeyHtml(keyHtmlPath);
      } else if (fs.existsSync(altKeyHtmlPath)) {
        exercises = parseKeyHtml(altKeyHtmlPath);
      }
    } else if (bNum >= 1 && bNum <= 4) {
      // Buổi 01-04: Combined.md with sanitized blanks
      const combPath = path.join(bFolder, `04-BTVN-Buoi${pad}-Combined.md`);
      exercises = parseCombinedMd(combPath, bNum);
    }

    // Fallback if needed
    if (exercises.length < 10) {
      exercises = parseDataJson(bNum);
    }

    // Sanitize exercises across all lessons
    exercises = exercises.map(cleanExercise);

    console.log(`   Theory: ${theoryData.markdown.length} chars | Cheat Sheet: ${cheatSheetHtml.length} chars | Exercises: ${exercises.length}`);

    // Build structured sections
    const sections: any = {
      bigQuestion: theoryData.bigQuestion,
      outcome: theoryData.outcome,
      videoUrl: VIDEO_URLS[bNum] || null,
      cheatSheetHtml: cheatSheetHtml || null,
      contrastPairs: theoryData.contrastPairs || [],
      traps: theoryData.traps || [],
    };

    // 5. Create Lesson
    const { data: lessonData, error: lessonErr } = await supabase
      .from('grammar_lessons')
      .insert({
        topic_id: topicData.id,
        title,
        theory: theoryData.markdown,
        theory_vi: theoryData.markdown,
        examples: theoryData.examples,
        exercises,
        source: '25-buoi-master',
        source_url: VIDEO_URLS[bNum] || null,
        sections,
        order_index: bNum,
      })
      .select()
      .single();

    if (lessonErr) {
      console.error(`❌ Error inserting lesson for Buổi ${pad}:`, lessonErr);
      continue;
    }
    totalLessonsCreated++;

    // 6. Insert Exercises into grammar_exercises
    if (exercises.length > 0) {
      const dbExercises = exercises.map(ex => ({
        lesson_id: lessonData.id,
        classroom_id: defaultClassroomId,
        topic: title,
        level,
        question: ex.question,
        options: ex.options || [],
        correct_answer: ex.correct_answer || '',
        explanation: ex.explanation || '',
        type: ex.type || 'multiple_choice',
        difficulty: ex.difficulty || 2,
      }));

      for (let i = 0; i < dbExercises.length; i += 50) {
        const chunk = dbExercises.slice(i, i + 50);
        const { error: exErr } = await supabase.from('grammar_exercises').insert(chunk);
        if (exErr) {
          console.error(`⚠️ Error inserting exercises chunk for Buổi ${pad}:`, exErr);
        } else {
          totalExercisesInserted += chunk.length;
        }
      }
    }

    console.log(`   ✅ Synced Buổi ${pad}: Lesson ID [${lessonData.id}] with ${exercises.length} exercises.`);
  }

  console.log('\n================================================================');
  console.log('              MASTER SYNC COMPLETED SUCCESSFULLY               ');
  console.log('================================================================');
  console.log(`Topics Created: ${totalTopicsCreated} / 25`);
  console.log(`Lessons Created: ${totalLessonsCreated} / 25`);
  console.log(`Total Exercises Inserted: ${totalExercisesInserted}`);
}

runMasterSync()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
