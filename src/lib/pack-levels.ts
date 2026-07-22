/**
 * Cấp độ bài đọc pack — user chọn theo trình độ.
 * Ảnh hưởng: độ dài đoạn, cấu trúc câu, độ khó câu hỏi, số blank cloze.
 */

export interface PackReadingLevel {
  id: string;
  /** CEFR gợi ý */
  cefr: string;
  labelVi: string;
  labelEn: string;
  emoji: string;
  /** Độ dài đoạn (số từ EN) */
  minWords: number;
  maxWords: number;
  /** Số đoạn / paragraph gợi ý */
  paragraphs: string;
  /** Mô tả độ khó câu / từ vựng ngoài target */
  complexity: string;
  /** Số câu hỏi MCQ */
  questionCount: number;
  /** Số blank cloze */
  clozeBlanks: string;
  /** Kiểu câu hỏi */
  questionStyle: string;
  /** Gợi ý ngắn UI */
  hintVi: string;
}

export const PACK_READING_LEVELS: PackReadingLevel[] = [
  {
    id: 'starter',
    cefr: 'A1',
    labelVi: 'Mới bắt đầu',
    labelEn: 'Starter',
    emoji: '🌱',
    minWords: 80,
    maxWords: 110,
    paragraphs: '1 short paragraph',
    complexity:
      'Very simple sentences (SVO). Present simple only. Almost no unknown words beyond the target list. Short clauses only.',
    questionCount: 3,
    clozeBlanks: '4-5',
    questionStyle:
      'Literal detail only: Who / What / Where. Options must be short phrases (3-8 words), not full abstract sentences. One clear fact per question from the passage.',
    hintVi: 'Câu ngắn · hiện tại đơn · hỏi chi tiết rõ',
  },
  {
    id: 'elementary',
    cefr: 'A2',
    labelVi: 'Cơ bản',
    labelEn: 'Elementary',
    emoji: '📘',
    minWords: 120,
    maxWords: 160,
    paragraphs: '1–2 short paragraphs',
    complexity:
      'Simple and compound sentences. Present/past simple, high-frequency words. Easy connectors: and, but, because, so.',
    questionCount: 4,
    clozeBlanks: '5-7',
    questionStyle:
      'Clear factual questions (Who did X? Why did Y happen?). Options = full short answers the student can compare. No trick questions. No option like only "B".',
    hintVi: 'Đoạn vừa · thì quá khứ/hiện tại · hỏi vì sao/ở đâu',
  },
  {
    id: 'intermediate',
    cefr: 'B1',
    labelVi: 'Trung cấp',
    labelEn: 'Intermediate',
    emoji: '📗',
    minWords: 160,
    maxWords: 220,
    paragraphs: '2 paragraphs',
    complexity:
      'Mix of simple/complex sentences. Present perfect, conditionals lightly OK. Some academic but still clear. Natural cohesion.',
    questionCount: 4,
    clozeBlanks: '6-8',
    questionStyle:
      'Mix of detail + main idea + simple inference (What can we infer…?). Still concrete: base every answer on a sentence in the text. Options parallel in length/form.',
    hintVi: 'Dài hơn · suy luận nhẹ · ý chính + chi tiết',
  },
  {
    id: 'upper',
    cefr: 'B2',
    labelVi: 'Khá',
    labelEn: 'Upper-intermediate',
    emoji: '📙',
    minWords: 220,
    maxWords: 300,
    paragraphs: '2–3 paragraphs',
    complexity:
      'Longer complex sentences, relative clauses, passive, richer adjectives. Coherent mini-article tone.',
    questionCount: 5,
    clozeBlanks: '7-9',
    questionStyle:
      'Detail, main idea, inference, and vocabulary-in-context (What does X mean here?). Avoid ambiguous options; still one clearly best answer.',
    hintVi: 'Bài báo ngắn · suy luận + từ trong ngữ cảnh',
  },
  {
    id: 'advanced',
    cefr: 'C1',
    labelVi: 'Nâng cao',
    labelEn: 'Advanced',
    emoji: '📕',
    minWords: 280,
    maxWords: 380,
    paragraphs: '3 paragraphs',
    complexity:
      'Advanced syntax, nuanced stance, less common collocations. Still readable for strong high-school/early uni learners. No jargon walls.',
    questionCount: 5,
    clozeBlanks: '8-10',
    questionStyle:
      'Inference, author purpose/attitude, paraphrase matching. Questions must still be answerable only from the passage (not outside knowledge). Options carefully parallel.',
    hintVi: 'Dài · thái độ/mục đích tác giả · paraphrase',
  },
];

export function getPackReadingLevel(id: string | null | undefined): PackReadingLevel | null {
  if (!id) return null;
  return PACK_READING_LEVELS.find((l) => l.id === id) ?? null;
}

export function isValidPackReadingLevelId(id: unknown): id is string {
  return typeof id === 'string' && PACK_READING_LEVELS.some((l) => l.id === id);
}

/** Default khi user chưa chọn: A2 */
export const DEFAULT_PACK_READING_LEVEL_ID = 'elementary';
