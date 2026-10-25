const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getGeminiKey() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  if (!keys.length) throw new Error('GEMINI_API_KEY not set');
  return keys[0];
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

  console.log('Original length:', lesson.theory.length);

  const genAI = new GoogleGenerativeAI(getGeminiKey());
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2500,
    },
  });

  const prompt = `Bạn là một chuyên gia biên soạn tài liệu học tiếng Anh. Dưới đây là nội dung lý thuyết ngữ pháp tiếng Anh trích xuất từ sách OCR (chứa các lỗi xuống dòng tùy tiện, ký tự rác OCR và văn bản bị dính liền dập khuôn).

NỘI DUNG OCR:
---
${lesson.theory}
---

Yêu Cầu:
1. Hãy làm sạch và biên tập lại toàn bộ nội dung trên thành tài liệu lý thuyết tiếng Việt chuẩn học thuật, rõ ràng, mạch lạc và bắt mắt.
2. KHÔNG được tóm tắt quá ngắn làm mất đi các chi tiết ngữ pháp, cấu trúc và phân loại quan trọng của bài học. Hãy giữ lại đầy đủ các quy tắc ngữ pháp.
3. Sử dụng định dạng Markdown cao cấp:
   - Các phần chính dùng tiêu đề lớn (##), phần con dùng (###).
   - Sử dụng danh sách có dấu đầu dòng (- hoặc 1. 2.) thay vì viết liền tù tì.
   - Các từ tiếng Anh ví dụ hoặc thuật ngữ quan trọng hãy in đậm (**bold**) hoặc in nghiêng (*italic*).
   - Với các lưu ý đặc biệt, hãy bọc trong blockquote (bắt đầu bằng dấu >) để hiển thị nổi bật dưới dạng thẻ ghi chú.
4. Chỉ xuất ra nội dung Markdown bài học, không thêm lời chào, giải thích hay bất kỳ lời dẫn nào khác.`;

  console.log('Sending request to Gemini...');
  const result = await model.generateContent(prompt);
  const output = result.response.text().trim();

  console.log('\n--- GEMINI FORMATTED OUTPUT ---');
  console.log(output);
}

test().catch(console.error);
