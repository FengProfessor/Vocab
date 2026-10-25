/**
 * scripts/grammar/normalize-grammar-data.ts
 *
 * Normalizes all 62 topic JSON files in `scripts/grammar-gen/out/*.json`:
 * 1. Converts legacy exercise keys (q, opts, answer, fb) to unified schema:
 *    (question, options, correct_answer, explanation, difficulty, type).
 * 2. Generates/enriches structured `distractor_breakdowns` for multiple choice questions,
 *    explaining specifically why each distractor is grammatically invalid.
 * 3. Enforces 100% pedagogical tone purity: replaces all "**Mẹo nhớ:**", "**Mẹo:**",
 *    and other informal prefixes with "**Lưu ý trọng tâm:**".
 * 4. Aligns topic CEFR levels (A0, A1, A2, B1, B2) and canonical order index (1..62).
 */

import * as fs from 'fs';
import * as path from 'path';
import { FILL_BLANK_DISTRACTORS } from './fill-blank-distractors';

export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'error_correction';

export interface DistractorBreakdown {
  option: string;
  isCorrect: boolean;
  pedagogicalReason: string;
}

export interface UnifiedExercise {
  id: string;
  type: ExerciseType;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  distractor_breakdowns: DistractorBreakdown[];
  difficulty: number;
}

export const CANONICAL_LEVEL_MAP: Record<CefrLevel, string[]> = {
  A0: ['personal-pronouns', 'verb-to-be', 'demonstratives', 'possessives', 'plural-nouns', 'adjectives-basic'],
  A1: [
    'there-is-there-are', 'articles', 'present-simple', 'have-got',
    'wh-questions', 'adverbs-frequency', 'present-continuous',
    'prepositions-place', 'imperatives', 'modals-ability',
  ],
  A2: [
    'countable-uncountable', 'quantifiers', 'prepositions-time', 'past-simple',
    'past-continuous', 'be-going-to', 'future-will', 'comparatives-superlatives',
    'modals-permission', 'modals-obligation', 'modals-advice', 'conditionals-0-1',
  ],
  B1: [
    'used-to', 'present-perfect', 'conjunctions-linking', 'present-perfect-continuous',
    'phrasal-verbs', 'past-perfect', 'future-continuous', 'passive-voice',
    'gerunds-infinitives', 'reported-speech', 'relative-clauses', 'question-tags',
    'second-conditional', 'third-conditional', 'modals-deduction',
  ],
  B2: [
    'past-perfect-continuous', 'future-perfect', 'future-in-the-past', 'mixed-conditionals',
    'wish-if-only', 'modals-perfect', 'causative', 'advanced-passive',
    'advanced-relative-clauses', 'participle-clauses', 'ellipsis-substitution', 'subjunctive',
    'emphasis-structures', 'cleft-sentences', 'inversion', 'discourse-markers',
    'nominalisation', 'hedging-language', 'grammatical-collocations',
  ],
};

// Flatten to full order lookup
const TOPIC_ORDER_LOOKUP = new Map<string, { level: CefrLevel; order: number }>();
let globalIndex = 1;
for (const level of ['A0', 'A1', 'A2', 'B1', 'B2'] as CefrLevel[]) {
  for (const slug of CANONICAL_LEVEL_MAP[level]) {
    TOPIC_ORDER_LOOKUP.set(slug, { level, order: globalIndex++ });
  }
}

/** Clean tone text of clickbait */
function scrubToneText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*Mẹo nhớ:\*\*/g, '**Lưu ý trọng tâm:**')
    .replace(/\*\*Mẹo 2×2:\*\*/g, '**Lưu ý trọng tâm:**')
    .replace(/\*\*Mẹo:\*\*/g, '**Lưu ý trọng tâm:**')
    .replace(/\bMẹo 5s\b/gi, 'Quy tắc phân tích cú pháp')
    .replace(/\bMẹo 5 giây\b/gi, 'Quy tắc trọng tâm')
    .replace(/\bThần chú\b/gi, 'Quy tắc')
    .replace(/\bhack điểm\b/gi, 'tối ưu hóa điểm số')
    .replace(/\băn trọn điểm\b/gi, 'đạt điểm tối đa')
    .replace(/\btuyệt chiêu\b/gi, 'phương pháp chuyên sâu');
}

/** Extract clauses discussing specific options from the master explanation */
function extractClauseForOption(explanation: string, opt: string): string | null {
  if (!explanation) return null;
  const cleanOpt = opt.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Look for patterns like: “opt” ..., 'opt' ..., "opt" ..., hoặc opt dùng..., opt sai...
  const patterns = [
    new RegExp(`(?:[“"']${cleanOpt}[”"']|\\b${cleanOpt}\\b)[^.;\n]*?(?:dùng|chỉ|thiếu|sai|không|phù hợp|thay cho)[^.;\n]*`, 'i'),
    new RegExp(`(?:[“"']${cleanOpt}[”"']|\\b${cleanOpt}\\b)[^.;\n]*`, 'i'),
  ];

  for (const pat of patterns) {
    const match = explanation.match(pat);
    if (match && match[0].trim().length > cleanOpt.length + 5) {
      let clause = match[0].trim();
      clause = clause.replace(/^[,;:]\s*/, '').replace(/[,;:]\s*$/, '');
      if (clause.length > 10) return clause;
    }
  }

  return null;
}

/** Synthesize high-quality pedagogical reason for a distractor if not explicitly in master explanation */
function generateSynthesizedDistractorReason(
  question: string,
  option: string,
  correctAnswer: string,
  isErrorCorrection: boolean,
  topicSlug: string
): string {
  const opt = option.trim();
  const qLower = question.toLowerCase();
  const optLower = opt.toLowerCase();
  const ansLower = correctAnswer.toLowerCase();

  if (isErrorCorrection) {
    return `Từ hoặc cụm từ "${opt}" được sử dụng hoàn toàn đúng ngữ pháp trong câu, không phải là lỗi sai cần sửa.`;
  }

  // 1. True / False questions
  if (opt === 'Đúng' || opt === 'Sai') {
    return opt === 'Đúng'
      ? `Khẳng định này không phản ánh đúng quy tắc ngữ pháp của câu đã cho.`
      : `Khẳng định này là chính xác về mặt ngữ pháp, không phải là phát biểu sai.`;
  }

  // 2. Pronoun Case & Forms
  const subjectPronouns = ['i', 'he', 'she', 'we', 'they'];
  const objectPronouns = ['me', 'him', 'her', 'us', 'them'];
  const possessiveAdjs = ['my', 'his', 'her', 'our', 'their', 'its'];
  const possessivePronouns = ['mine', 'his', 'hers', 'ours', 'theirs'];

  if (subjectPronouns.includes(optLower) && objectPronouns.includes(ansLower)) {
    return `"${opt}" là đại từ chủ ngữ (Subject Pronoun), không thể đứng ở vị trí tân ngữ sau động từ hoặc giới từ.`;
  }
  if (objectPronouns.includes(optLower) && subjectPronouns.includes(ansLower)) {
    return `"${opt}" là đại từ tân ngữ (Object Pronoun), không thể làm chủ ngữ đứng trước động từ vị ngữ.`;
  }
  if (possessiveAdjs.includes(optLower) && !possessiveAdjs.includes(ansLower)) {
    return `"${opt}" là tính từ sở hữu, bắt buộc phải có danh từ theo sau bổ nghĩa, không thể đứng độc lập.`;
  }
  if (possessivePronouns.includes(optLower) && possessiveAdjs.includes(ansLower)) {
    return `"${opt}" là đại từ sở hữu (thay thế cả cụm Noun), không đứng trực tiếp trước một danh từ đã có sẵn.`;
  }

  // 3. To-Be / Auxiliary Agreement
  if (['am', 'is', 'are', 'was', 'were'].includes(optLower)) {
    if (optLower === 'am') return `Động từ to-be "am" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất "I".`;
    if (optLower === 'is' || optLower === 'was') return `Dạng số ít "${opt}" không hòa hợp với chủ ngữ số nhiều hoặc "you/we/they".`;
    if (optLower === 'are' || optLower === 'were') return `Dạng số nhiều "${opt}" không hòa hợp với chủ ngữ số ít hoặc danh từ không đếm được.`;
  }
  if (['do', 'does', 'did'].includes(optLower)) {
    if (optLower === 'does') return `Trợ động từ "does" chỉ dùng cho chủ ngữ ngôi thứ ba số ít (he/she/it).`;
    if (optLower === 'do') return `Trợ động từ "do" không dùng cho chủ ngữ ngôi thứ ba số ít ở thì hiện tại đơn.`;
  }
  if (['has', 'have', 'had'].includes(optLower)) {
    if (optLower === 'has') return `"has" dùng cho chủ ngữ số ít (he/she/it), không phù hợp với chủ ngữ hiện tại.`;
    if (optLower === 'have') return `"have" không đi với chủ ngữ ngôi thứ ba số ít ở dạng khẳng định hiện tại đơn.`;
  }

  // 4. Articles
  if (['a', 'an', 'the'].includes(optLower)) {
    if (optLower === 'a') return `Mạo từ "a" chỉ đứng trước danh từ đếm được số ít phát âm bắt đầu bằng một phụ âm.`;
    if (optLower === 'an') return `Mạo từ "an" chỉ đứng trước danh từ đếm được số ít phát âm bắt đầu bằng một nguyên âm.`;
    if (optLower === 'the') return `Mạo từ xác định "the" chỉ dùng cho đối tượng đã được xác định cụ thể trong ngữ cảnh.`;
  }

  // 5. Demonstratives
  if (['this', 'that', 'these', 'those'].includes(optLower)) {
    if (['these', 'those'].includes(optLower) && ['this', 'that'].includes(ansLower)) {
      return `"${opt}" là đại từ/tính từ chỉ định số nhiều, không thể đi với danh từ hoặc động từ số ít.`;
    }
    if (['this', 'that'].includes(optLower) && ['these', 'those'].includes(ansLower)) {
      return `"${opt}" là đại từ/tính từ chỉ định số ít, không thể đi với danh từ hoặc động từ số nhiều.`;
    }
  }

  // 6. Word Class / Morphology (-ly, -tion, -ful, etc.)
  if (optLower.endsWith('ly') && !ansLower.endsWith('ly')) {
    return `"${opt}" là trạng từ (adverb), không thể đứng trước danh từ hoặc làm bổ ngữ sau linking verb thay cho tính từ.`;
  }
  if (!optLower.endsWith('ly') && ansLower.endsWith('ly')) {
    return `"${opt}" là tính từ hoặc danh từ, không có chức năng trạng từ để bổ nghĩa cho động từ/tính từ trong câu.`;
  }
  if ((optLower.endsWith('tion') || optLower.endsWith('ness') || optLower.endsWith('ment')) && !ansLower.endsWith('tion')) {
    return `"${opt}" là danh từ trừu tượng, không thể đảm nhận vai trò tính từ hoặc động từ ở vị trí này.`;
  }

  // 7. Relative Pronouns
  if (['who', 'whom', 'which', 'whose', 'where', 'when', 'that'].includes(optLower)) {
    if (optLower === 'whom') return `"whom" làm tân ngữ chỉ người, không thay thế cho chủ ngữ hoặc danh từ chỉ vật.`;
    if (optLower === 'which') return `"which" chỉ thay thế cho danh từ chỉ sự vật/hiện tượng, không dùng cho danh từ chỉ người.`;
    if (optLower === 'who') return `"who" chỉ thay thế cho danh từ chỉ người, không dùng cho sự vật/hiện tượng.`;
    if (optLower === 'whose') return `"whose" chỉ quan hệ sở hữu (whose + noun), không đứng độc lập làm đại từ quan hệ chủ ngữ.`;
    if (optLower === 'that') return `"that" không được dùng trong mệnh đề quan hệ không xác định (đứng sau dấu phẩy) hoặc sau giới từ.`;
  }

  // 8. Prepositions
  if (['in', 'on', 'at', 'by', 'for', 'during', 'since'].includes(optLower)) {
    if (optLower === 'during') return `"during" đi với danh từ sự kiện/thời kỳ, không đi kèm khoảng thời gian có số đếm cụ thể (dùng "for").`;
    if (optLower === 'for') return `"for" diễn đạt khoảng thời gian đo đếm được, không dùng cho mốc thời gian xác định (dùng "since").`;
    if (optLower === 'since') return `"since" đi với mốc thời gian bắt đầu trong quá khứ, không đi với khoảng thời gian.`;
    if (optLower === 'at') return `Giới từ "at" thường dùng cho mốc giờ chính xác hoặc địa điểm cụ thể, không phù hợp ở ngữ cảnh này.`;
    if (optLower === 'in') return `Giới từ "in" dùng cho khoảng thời gian dài (tháng, năm, mùa) hoặc không gian kín, không phù hợp ở đây.`;
  }

  // 9. Conditionals & Inversions
  if (topicSlug.includes('conditional') || topicSlug.includes('inversion')) {
    return `Cấu trúc động từ của "${opt}" không khớp với quy tắc thì của mệnh đề điều kiện hoặc đảo ngữ tương ứng.`;
  }

  // 10. General grammatical fallback
  return `Phương án "${opt}" không thỏa mãn quy tắc ngữ pháp hoặc sự hòa hợp cú pháp trong cấu trúc câu này.`;
}

/** Generate structured distractor breakdown array */
function generateBreakdowns(
  question: string,
  options: string[],
  correctAnswer: string,
  explanation: string,
  isErrorCorrection: boolean,
  topicSlug: string
): DistractorBreakdown[] {
  const rawAns = correctAnswer.trim();
  const normAns = rawAns.toLowerCase();
  const cleanAns = rawAns.replace(/^[A-D]\.\s*/i, '').replace(/^["']|["']$/g, '').trim().toLowerCase();

  return options.map((opt) => {
    const rawOpt = opt.trim();
    const rawOptLower = rawOpt.toLowerCase();
    const cleanOpt = rawOpt.replace(/^[A-D]\.\s*/i, '').replace(/^["']|["']$/g, '').trim();
    const cleanOptLower = cleanOpt.toLowerCase();

    // Check correctness
    const isCorrect =
      rawOptLower === normAns ||
      cleanOptLower === cleanAns ||
      cleanOptLower === normAns ||
      rawOptLower === cleanAns ||
      (normAns.length === 1 && /^[a-d]$/.test(normAns) && (rawOptLower.startsWith(normAns + '.') || rawOptLower.startsWith(normAns + ' '))) ||
      (normAns === 'đúng' && (cleanOptLower === 'true' || cleanOptLower === 'đúng')) ||
      (normAns === 'sai' && (cleanOptLower === 'false' || cleanOptLower === 'sai'));

    if (isCorrect) {
      let affirmativeReason = scrubToneText(explanation);
      if (!affirmativeReason || affirmativeReason.length < 15) {
        affirmativeReason = `Đáp án chính xác. "${cleanOpt}" thỏa mãn đầy đủ cấu trúc cú pháp và ý nghĩa ngữ pháp của câu.`;
      }
      return {
        option: rawOpt,
        isCorrect: true,
        pedagogicalReason: affirmativeReason,
      };
    } else {
      // Look for clause in explanation
      const extracted = extractClauseForOption(explanation, cleanOpt);
      let distractorReason = '';
      if (extracted && extracted.length >= 15) {
        distractorReason = `Không chính xác. ${extracted.charAt(0).toUpperCase() + extracted.slice(1)}.`;
      } else {
        distractorReason = `Không chính xác. ${generateSynthesizedDistractorReason(question, cleanOpt, correctAnswer, isErrorCorrection, topicSlug)}`;
      }

      return {
        option: rawOpt,
        isCorrect: false,
        pedagogicalReason: scrubToneText(distractorReason),
      };
    }
  });
}

/** Detect parenthetical choices or multiple-choice formats in question text */
export function extractOptionsFromQuestion(
  question: string,
  rawAns: string
): { options: string[]; cleanQuestion: string; cleanAnswer: string; extractedType?: ExerciseType } | null {
  // Case A: Dot choices (A tall · B taller · C tallest · D most tall)
  const dotParenMatch = question.match(/\(([A-D]\s+[^·)]+(?:\s*·\s*[A-D]\s+[^·)]+)+)\)/i);
  if (dotParenMatch) {
    const rawChoices = dotParenMatch[1].split('·');
    const options = rawChoices.map((s) => s.trim().replace(/^[A-D][\.\s]+/i, '').trim()).filter(Boolean);
    if (options.length >= 2) {
      const cleanAnswer = rawAns.replace(/^[A-D][\.\s]+/i, '').trim();
      const cleanQuestion = question.replace(dotParenMatch[0], '').replace(/\s{2,}/g, ' ').trim();
      return { options, cleanQuestion, cleanAnswer, extractedType: 'multiple_choice' };
    }
  }

  // Case B: ABCD in question without parens: e.g. "A. confused   B. faced   C. cried   D. defined"
  const abcdMatch = question.match(/^[A-D]\.\s+.*?[B-D]\.\s+.*?[C-D]\.\s+.*?[D]\.\s+/i);
  if (abcdMatch) {
    const parts = question.split(/(?=[A-D]\.\s+)/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 4) {
      const options = parts.map((p) => p.replace(/^[A-D]\.\s*/i, '').trim());
      const cleanAnswer = rawAns.replace(/^[A-D]\.\s*/i, '').trim();
      return { options, cleanQuestion: 'Chọn từ có phát âm hoặc trọng âm khác với các từ còn lại:', cleanAnswer, extractedType: 'multiple_choice' };
    }
  }

  // Case C: Slash choices in parens, e.g. (happy / happily), (a / an), (the / a; both people know which door)
  const parenSlashMatch = question.match(/\(([^)]+?\/[^)]+?)\)/);
  if (parenSlashMatch) {
    let inside = parenSlashMatch[1];
    if (inside.includes(';')) {
      inside = inside.split(';')[0];
    }
    const candidates = inside.split('/').map((s) => s.trim()).filter(Boolean);
    const isVerbCue = candidates.some((c) => /^(?:not|already|just|never|ever)\b/i.test(c));
    const isWordOrder = candidates.length > 2 && /sắp xếp/i.test(question);

    if (!isVerbCue && !isWordOrder && candidates.length >= 2 && candidates.length <= 4) {
      const cleanAns = rawAns.trim().toLowerCase();
      const options = candidates.map((c) => {
        if (c.toLowerCase() === cleanAns) return rawAns.trim();
        return c;
      });
      return { options, cleanQuestion: question, cleanAnswer: rawAns.trim(), extractedType: 'multiple_choice' };
    }
  }

  return null;
}

/** Synthesize structured distractor breakdowns for open fill-in-the-blank and transformation exercises */
export function synthesizeFillBlankBreakdowns(
  id: string,
  question: string,
  correctAnswer: string,
  explanation: string,
  topicSlug: string
): DistractorBreakdown[] {
  const ans = correctAnswer.trim();
  let affirmativeReason = scrubToneText(explanation);
  if (!affirmativeReason || affirmativeReason.length < 15) {
    affirmativeReason = `Đáp án chính xác. Cấu trúc "${ans}" thỏa mãn đầy đủ quy tắc ngữ pháp của câu.`;
  }

  const breakdowns: DistractorBreakdown[] = [
    {
      option: ans,
      isCorrect: true,
      pedagogicalReason: affirmativeReason,
    },
  ];

  // 1. Check explicit tailored distractor registry
  const explicit = FILL_BLANK_DISTRACTORS[id];
  if (explicit && explicit.length > 0) {
    for (const item of explicit) {
      const reason = item.reason.startsWith('Không chính xác') ? item.reason : `Không chính xác. ${item.reason}`;
      breakdowns.push({
        option: item.opt,
        isCorrect: false,
        pedagogicalReason: scrubToneText(reason),
      });
    }
    return breakdowns;
  }

  // 2. Dynamic rule-based fallback for any unlisted open fill-in
  const distractors: { opt: string; reason: string }[] = [];
  const ansLower = ans.toLowerCase();

  if (ansLower === 'is') {
    distractors.push({ opt: 'are', reason: '"are" dùng cho chủ ngữ số nhiều hoặc "you/we/they", không hòa hợp với chủ ngữ số ít.' });
    distractors.push({ opt: 'am', reason: '"am" chỉ đi duy nhất với chủ ngữ ngôi thứ nhất "I".' });
  } else if (ansLower === 'are') {
    distractors.push({ opt: 'is', reason: '"is" dùng cho chủ ngữ số ít, không hòa hợp với chủ ngữ số nhiều.' });
    distractors.push({ opt: 'was', reason: 'Ngữ cảnh hiện tại không dùng to-be ở quá khứ đơn.' });
  } else if (ansLower === 'was') {
    distractors.push({ opt: 'were', reason: '"were" dùng cho chủ ngữ số nhiều hoặc "you/we/they", không hòa hợp với chủ ngữ số ít.' });
    distractors.push({ opt: 'is', reason: 'Sự việc xảy ra trong quá khứ, không dùng to-be hiện tại.' });
  } else if (ansLower === 'were') {
    distractors.push({ opt: 'was', reason: '"was" dùng cho chủ ngữ số ít, không hòa hợp với chủ ngữ số nhiều.' });
    distractors.push({ opt: 'are', reason: 'Sự việc đã kết thúc trong quá khứ, không dùng to-be hiện tại.' });
  } else if (ansLower === 'who') {
    distractors.push({ opt: 'which', reason: '"which" chỉ thay thế cho danh từ chỉ vật/hiện tượng, không dùng cho danh từ chỉ người.' });
    distractors.push({ opt: 'whom', reason: '"whom" làm tân ngữ, không thể làm chủ ngữ đứng trước động từ vị ngữ.' });
  } else if (ansLower === 'which') {
    distractors.push({ opt: 'who', reason: '"who" chỉ thay thế cho danh từ chỉ người, không dùng cho sự vật.' });
    distractors.push({ opt: 'that', reason: question.includes(',') ? 'Trong mệnh đề quan hệ không xác định (sau dấu phẩy), tuyệt đối không dùng "that".' : 'Không phù hợp với cấu trúc ngữ pháp trang trọng của câu.' });
  } else if (ansLower === 'whose') {
    distractors.push({ opt: 'who', reason: '"who" không đứng trước danh từ để chỉ quan hệ sở hữu.' });
    distractors.push({ opt: 'which', reason: '"which" thay thế cho danh từ vật, không dùng chỉ quan hệ sở hữu.' });
  } else {
    distractors.push({ opt: ans + 's', reason: `Dạng biến thể "${ans}s" không thỏa mãn quy tắc ngữ pháp hoặc sự hòa hợp chủ vị trong câu này.` });
    distractors.push({ opt: 'to ' + ans, reason: `Không dùng cấu trúc to-V ở vị trí này trong câu.` });
  }

  for (const d of distractors) {
    breakdowns.push({
      option: d.opt,
      isCorrect: false,
      pedagogicalReason: scrubToneText(`Không chính xác. ${d.reason}`),
    });
  }

  return breakdowns;
}

/** Normalize a single raw exercise item into UnifiedExercise */
function normalizeExercise(
  raw: any,
  index: number,
  totalInLesson: number,
  topicSlug: string
): UnifiedExercise {
  const id = raw.id || `${topicSlug}-ex-${String(index + 1).padStart(2, '0')}`;

  // Raw question
  let question = String(raw.question || raw.q || raw.prompt || raw.sentence || '').trim();

  // Raw options
  let options: string[] = [];
  const rawOpts = raw.options || raw.opts;
  if (Array.isArray(rawOpts)) {
    options = rawOpts.map((o: any) => String(o ?? '').trim()).filter((o: string) => o.length > 0);
  }

  // Type resolution
  const rawType = String(raw.type || '').trim().toLowerCase();
  let type: ExerciseType = 'multiple_choice';

  if (rawType === 'fill' || rawType === 'fill_blank') {
    type = 'fill_blank';
  } else if (rawType === 'error' || rawType === 'error_correction') {
    type = 'error_correction';
  } else if (rawType === 'tf') {
    type = 'multiple_choice';
    if (options.length === 0) {
      options = ['Đúng', 'Sai'];
    }
  } else {
    type = 'multiple_choice';
  }

  // Correct answer
  let correctAnswer = '';
  if (rawType === 'tf') {
    const rawAns = raw.answer !== undefined ? raw.answer : raw.correct_answer;
    if (rawAns === true || String(rawAns).toLowerCase() === 'true' || String(rawAns) === 'Đúng') {
      correctAnswer = 'Đúng';
    } else {
      correctAnswer = 'Sai';
    }
  } else {
    const rawAns = raw.correct_answer !== undefined ? raw.correct_answer : raw.answer;
    if (Array.isArray(rawAns)) {
      correctAnswer = String(rawAns[0] ?? '').trim();
    } else {
      correctAnswer = String(rawAns ?? '').trim();
    }
  }

  // If options are empty, attempt extracting parenthetical or ABCD choices from question text
  if (options.length === 0) {
    const extracted = extractOptionsFromQuestion(question, correctAnswer);
    if (extracted) {
      options = extracted.options;
      question = extracted.cleanQuestion;
      correctAnswer = extracted.cleanAnswer;
      type = extracted.extractedType || 'multiple_choice';
    }
  }

  // Explanation
  let explanation = scrubToneText(String(raw.explanation || raw.fb || raw.why || '').trim());

  // Difficulty
  let difficulty = 2;
  if (typeof raw.difficulty === 'number' && [1, 2, 3].includes(raw.difficulty)) {
    difficulty = raw.difficulty;
  } else {
    if (index < totalInLesson * 0.35) difficulty = 1;
    else if (index < totalInLesson * 0.70) difficulty = 2;
    else difficulty = 3;
  }

  // Distractor breakdowns
  let distractorBreakdowns: DistractorBreakdown[] = [];
  if (options.length > 0) {
    distractorBreakdowns = generateBreakdowns(
      question,
      options,
      correctAnswer,
      explanation,
      type === 'error_correction',
      topicSlug
    );
  } else {
    distractorBreakdowns = synthesizeFillBlankBreakdowns(
      id,
      question,
      correctAnswer,
      explanation,
      topicSlug
    );
  }

  return {
    id,
    type,
    question,
    options,
    correct_answer: correctAnswer,
    explanation,
    distractor_breakdowns: distractorBreakdowns,
    difficulty,
  };
}

/** Main processor */
export async function normalizeAllGrammarFiles() {
  const dirPath = path.resolve(process.cwd(), 'scripts/grammar-gen/out');
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
  console.log(`🚀 Found ${files.length} grammar topic JSON files in ${dirPath}. Starting normalization...`);

  let totalExercisesNormalized = 0;
  let totalBreakdownsGenerated = 0;
  let modifiedFiles = 0;

  for (const filename of files) {
    const filePath = path.join(dirPath, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const slug = data.slug || filename.replace('.json', '');

    // Canonical level & order lookup
    const canonicalMeta = TOPIC_ORDER_LOOKUP.get(slug);
    const canonicalLevel = canonicalMeta ? canonicalMeta.level : (data.level || 'A1');
    const canonicalOrder = canonicalMeta ? canonicalMeta.order : (data.order || 1);

    // Scrub sections
    if (data.sections) {
      if (typeof data.sections.tips === 'string') {
        data.sections.tips = scrubToneText(data.sections.tips);
      }
      if (typeof data.sections.definition === 'string') {
        data.sections.definition = scrubToneText(data.sections.definition);
      }
      if (Array.isArray(data.sections.rules)) {
        for (const rule of data.sections.rules) {
          if (rule.rule) rule.rule = scrubToneText(rule.rule);
        }
      }
    }

    // Normalize exercises
    const rawExercises: any[] = data.exercises || [];
    const normalizedExercises: UnifiedExercise[] = [];

    rawExercises.forEach((ex, idx) => {
      const norm = normalizeExercise(ex, idx, rawExercises.length, slug);
      normalizedExercises.push(norm);
      totalExercisesNormalized++;
      totalBreakdownsGenerated += norm.distractor_breakdowns.length;
    });

    const updatedData = {
      slug,
      title: data.title,
      title_vi: data.title_vi,
      level: canonicalLevel,
      order: canonicalOrder,
      sections: data.sections,
      exercises: normalizedExercises,
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2) + '\n', 'utf8');
    modifiedFiles++;
  }

  console.log(`\n======================================================`);
  console.log(`✅ Normalization completed successfully!`);
  console.log(`Files Processed:             ${modifiedFiles} / 62`);
  console.log(`Total Exercises Normalized:  ${totalExercisesNormalized}`);
  console.log(`Total Breakdowns Generated:  ${totalBreakdownsGenerated}`);
  console.log(`======================================================\n`);
}

// Auto-run if executed directly
if (require.main === module) {
  normalizeAllGrammarFiles().catch((err) => {
    console.error('❌ Error during normalization:', err);
    process.exit(1);
  });
}
