/**
 * Dùng Gemini cấu trúc hóa text thô (chunk PDF / trang web) thành bài học grammar.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GrammarLessonDraft } from './grammar-types';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

function pickKey(): string {
  let key = process.env.GEMINI_API_KEY || '';
  if (key.includes(',')) {
    const keys = key.split(',').map((k) => k.trim()).filter(Boolean);
    key = keys[Math.floor(Math.random() * keys.length)];
  }
  return key;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Gửi 1 đoạn text cho Gemini, cấu trúc hóa thành các bài học grammar.
 * Trả [] nếu text không chứa nội dung ngữ pháp.
 */
export async function structureGrammarText(
  text: string,
  source: string,
  sourceUrl?: string
): Promise<GrammarLessonDraft[]> {
  const key = pickKey();
  if (!key) throw new Error('Thiếu GEMINI_API_KEY');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `Bạn là chuyên gia ngữ pháp tiếng Anh. Dưới đây là text trích từ tài liệu dạy ngữ pháp.
Trích xuất các BÀI HỌC ngữ pháp có trong text. Bỏ qua mục lục, lời nói đầu, bài tập rời.
Trả về CHỈ JSON array hợp lệ, mỗi phần tử có dạng:
{
  "topic_slug": "present-simple",
  "topic_title": "Present Simple",
  "topic_title_vi": "Thì hiện tại đơn",
  "level": "beginner",
  "title": "tiêu đề bài học",
  "theory": "lý thuyết tiếng Anh, định dạng markdown",
  "theory_vi": "lý thuyết tiếng Việt, định dạng markdown",
  "examples": [{ "en": "câu ví dụ tiếng Anh", "vi": "dịch tiếng Việt" }]
}
"level" chỉ nhận: beginner | intermediate | advanced.
Nếu text không chứa nội dung ngữ pháp dạy được, trả về [].

TEXT:
${text}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\[[\s\S]*\]/);
    if (!m) return [];
    parsed = JSON.parse(m[0]);
  }
  if (!Array.isArray(parsed)) return [];

  return (parsed as Record<string, unknown>[])
    .filter((d) => d && typeof d.title === 'string' && typeof d.theory === 'string')
    .map((d) => {
      const level = String(d.level || 'beginner');
      const examples = Array.isArray(d.examples)
        ? (d.examples as Record<string, unknown>[])
            .filter((e) => e && typeof e.en === 'string')
            .map((e) => ({
              en: String(e.en),
              vi: e.vi ? String(e.vi) : undefined,
              note: e.note ? String(e.note) : undefined,
            }))
        : [];
      return {
        topic_slug: slugify(String(d.topic_slug || d.topic_title || 'misc')) || 'misc',
        topic_title: String(d.topic_title || 'Miscellaneous'),
        topic_title_vi: d.topic_title_vi ? String(d.topic_title_vi) : undefined,
        level: (LEVELS.includes(level) ? level : 'beginner') as GrammarLessonDraft['level'],
        title: String(d.title),
        theory: String(d.theory),
        theory_vi: d.theory_vi ? String(d.theory_vi) : undefined,
        examples,
        source,
        source_url: sourceUrl,
      };
    });
}
