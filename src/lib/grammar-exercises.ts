/**
 * Chuẩn hóa bài tập grammar từ grammar_lessons.exercises (canonical + legacy)
 * sang shape dùng trên trang drill `/grammar`.
 *
 * Lưu ý quan trọng:
 * - type canonical `error` thường là MCQ "Câu nào SAI?" (options = cả câu),
 *   KHÔNG phải click token trong câu.
 * - Chỉ map sang `error_correction` khi ≥2 options xuất hiện trong nội dung câu hỏi.
 */

export type DrillExerciseType = 'multiple_choice' | 'fill_blank' | 'error_correction';

export type NormalizedDrillExercise = {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  topic: string;
  level: string;
  type: DrillExerciseType;
  difficulty: number;
};

export function asExerciseRecord(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
}

/** Số option xuất hiện (substring) trong câu hỏi — dùng để nhận diện find-the-error thật. */
export function countOptionsInSentence(question: string, options: string[]): number {
  const clean = String(question || '')
    .replace(/^find\s+the\s+error:\s*/i, '')
    .toLowerCase();
  let hits = 0;
  for (const opt of options) {
    const t = String(opt || '').trim().toLowerCase();
    if (t && clean.includes(t)) hits += 1;
  }
  return hits;
}

/**
 * true khi UI click-từ-trong-câu khả thi:
 * ≥2 options và phần lớn options nằm trong câu.
 */
export function canUseErrorClickMode(question: string, options: string[]): boolean {
  if (!Array.isArray(options) || options.length < 2) return false;
  const hits = countOptionsInSentence(question, options);
  return hits >= 2 && hits >= Math.ceil(options.length / 2);
}

export function resolveDrillType(
  rawType: string | undefined,
  question: string,
  options: string[],
): DrillExerciseType {
  if (rawType === 'fill' || rawType === 'fill_blank') return 'fill_blank';
  if (rawType === 'tf') return 'multiple_choice';
  if (rawType === 'error' || rawType === 'error_correction') {
    // MCQ "Câu nào SAI?" / options = full sentence → multiple_choice
    // Find-the-error token thật → error_correction
    return canUseErrorClickMode(question, options) ? 'error_correction' : 'multiple_choice';
  }
  // mcq | multiple_choice | unknown
  return 'multiple_choice';
}

function parseOptions(ex: Record<string, unknown>): string[] {
  const rawOpts = ex.options ?? ex.opts;
  if (!Array.isArray(rawOpts)) return [];
  return rawOpts
    .map((o) => String(o ?? '').trim())
    .filter((o) => o.length > 0);
}

function parseCorrectAnswer(ex: Record<string, unknown>, type: string): string {
  if (type === 'tf') {
    const rawAns = ex.answer !== undefined ? ex.answer : ex.correct_answer;
    const rawAnsStr = String(rawAns !== undefined && rawAns !== null ? rawAns : '')
      .trim()
      .toLowerCase();
    return rawAns === true ||
      rawAnsStr === 'true' ||
      rawAnsStr === 'đúng' ||
      rawAnsStr === 'yes' ||
      rawAnsStr === 'correct'
      ? 'Đúng'
      : 'Sai';
  }

  const rawAns = ex.correct_answer !== undefined ? ex.correct_answer : ex.answer;
  if (Array.isArray(rawAns)) {
    return String(rawAns[0] ?? '').trim();
  }
  return String(rawAns !== undefined && rawAns !== null ? rawAns : '').trim();
}

/**
 * Sửa 1 exercise đã load (API / localStorage) trước khi render.
 * - options luôn là mảng
 * - error "Câu nào SAI?" → multiple_choice (có nút chọn)
 * - tf thiếu options → ['Đúng','Sai']
 */
export function sanitizeDrillExercise<T extends {
  question?: string;
  options?: string[] | null;
  type?: string | null;
  correct_answer?: string | null;
}>(ex: T): T {
  let options = Array.isArray(ex.options)
    ? ex.options.map((o) => String(o ?? '').trim()).filter((o) => o.length > 0)
    : [];

  const rawType = typeof ex.type === 'string' ? ex.type : undefined;
  const question = String(ex.question ?? '');

  // tf / Đúng-Sai bị mất options
  const ans = String(ex.correct_answer ?? '').trim();
  if (
    options.length === 0 &&
    (rawType === 'tf' || ans === 'Đúng' || ans === 'Sai')
  ) {
    options = ['Đúng', 'Sai'];
  }

  const type = resolveDrillType(rawType, question, options);

  return {
    ...ex,
    options,
    type,
  };
}

export function sanitizeDrillExercises<T extends {
  question?: string;
  options?: string[] | null;
  type?: string | null;
  correct_answer?: string | null;
}>(list: T[]): T[] {
  return list.map((ex) => sanitizeDrillExercise(ex));
}

/** Map 1 item trong grammar_lessons.exercises → shape drill. */
export function normalizeLessonExercise(
  raw: unknown,
  lessonId: string,
  index: number,
  topicTitle: string,
  level: string,
  idPrefix = 'pre',
): NormalizedDrillExercise {
  const ex = asExerciseRecord(raw);
  const difficulty =
    typeof ex.difficulty === 'number' && [1, 2, 3].includes(ex.difficulty) ? ex.difficulty : 2;

  const rawType = typeof ex.type === 'string' ? ex.type : undefined;
  const questionText = String(ex.question || ex.q || '').trim();
  const explanationText = String(ex.explanation || ex.fb || '').trim();

  let optionsList: string[] = [];
  if (rawType === 'tf') {
    optionsList = ['Đúng', 'Sai'];
  } else {
    optionsList = parseOptions(ex);
  }

  const correctAnswer = parseCorrectAnswer(ex, rawType || '');
  const qType = resolveDrillType(rawType, questionText, optionsList);

  // Nếu đáp án không nằm trong options nhưng match mềm (case/space) → chuẩn hóa về option
  let finalCorrect = correctAnswer;
  if (optionsList.length > 0 && correctAnswer && !optionsList.includes(correctAnswer)) {
    const soft = optionsList.find(
      (o) => o.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
    );
    if (soft) finalCorrect = soft;
  }

  return {
    id: `${idPrefix}-${lessonId}-${index}`,
    lesson_id: lessonId,
    question: questionText,
    options: optionsList,
    correct_answer: finalCorrect,
    explanation: explanationText,
    topic: topicTitle,
    level,
    type: qType,
    difficulty,
  };
}
