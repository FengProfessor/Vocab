const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatOcrTheory(text) {
  if (!text) return '';

  // 1. Chuẩn hóa xuống dòng
  let normalized = text.replace(/\r\n/g, '\n');

  // 2. Phân tách dòng và gộp các câu bị bẻ xuống dòng lỗi
  const lines = normalized.split('\n');
  const resultLines = [];
  let currentLine = '';

  const listPattern = /^(?:\*\*|\*)?(?:\d+(?:\.\d+)*\.?|[a-z]\.|\-|•|Ex:|Ví dụ:|Note:|\*\s+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Kiểm tra dòng mới có bắt đầu một mục danh sách, tiêu đề, blockquote, ví dụ không
    const isNewSection = listPattern.test(line) || 
                         line.startsWith('##') || 
                         line.startsWith('###') ||
                         line.startsWith('>') ||
                         (currentLine && (currentLine.endsWith(':') || currentLine.endsWith('** :') || currentLine.endsWith('**:')));

    if (isNewSection) {
      if (currentLine) {
        resultLines.push(currentLine);
      }
      currentLine = line;
    } else {
      if (currentLine) {
        if (currentLine.endsWith('-')) {
          currentLine = currentLine.slice(0, -1) + line;
        } else {
          currentLine += ' ' + line;
        }
      } else {
        currentLine = line;
      }
    }
  }

  if (currentLine) {
    resultLines.push(currentLine);
  }

  // 3. Định dạng markdown cho từng dòng đã gộp
  let formatted = resultLines.map(line => {
    let clean = line;

    // Các mục bắt đầu bằng số thứ tự như "1. ", "2. ", "1.1. " -> làm nổi bật
    if (/^(?:\*\*)?\d+(\.\d+)*\.?\s/i.test(clean)) {
      // Đảm bảo bọc tiêu đề chính trong thẻ headings hoặc in đậm nếu chưa có
      if (!clean.startsWith('**') && !clean.startsWith('##')) {
        clean = '**' + clean.replace(/^(\d+(\.\d+)*\.?\s+)/, '$1**');
      }
    }

    // Các sub-bullet dạng "a. ", "b. " -> thụt dòng danh sách markdown
    if (/^(?:\*\*)?[a-z]\.\s/i.test(clean)) {
      clean = '  - ' + clean;
    }

    // Định dạng ví dụ "Ex: " -> dùng blockquote nhỏ cho đẹp mắt
    if (/^(?:\*\*)?Ex:\s*/i.test(clean)) {
      clean = '> **Ví dụ:** ' + clean.replace(/^(?:\*\*)?Ex:\s*/i, '');
    }
    
    return clean;
  }).join('\n\n');

  return formatted;
}

async function test() {
  const { data: lesson } = await supabase
    .from('grammar_lessons')
    .select('id, title, theory')
    .ilike('title', '%Các loại danh từ%')
    .maybeSingle();

  if (!lesson) {
    console.log('Lesson not found');
    return;
  }

  const formatted = formatOcrTheory(lesson.theory);
  console.log('--- FORMATTED ---');
  console.log(formatted.substring(0, 1500));
}

test().catch(console.error);
