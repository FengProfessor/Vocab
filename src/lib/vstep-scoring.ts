/**
 * VSTEP Scoring Engine & CEFR Converter
 * Tuân thủ Quy chế thi đánh giá năng lực tiếng Anh theo Khung năng lực ngoại ngữ 6 bậc (VSTEP)
 * ban hành kèm theo Thông tư của Bộ Giáo dục và Đào tạo.
 */

import { VstepCefrLevel, VstepScoreResult } from './vstep-types';

/**
 * Làm tròn điểm chuẩn VSTEP theo quy chế Bộ GD&ĐT:
 * - Điểm làm tròn đến 0.5
 * - Điểm lẻ từ .00 đến .24 -> làm tròn về .0
 * - Điểm lẻ từ .25 đến .74 -> làm tròn thành .5
 * - Điểm lẻ từ .75 đến .99 -> làm tròn lên .0 tiếp theo
 */
export function roundVstepScore(rawScore: number): number {
  if (rawScore <= 0) return 0;
  if (rawScore >= 10) return 10;

  const integerPart = Math.floor(rawScore);
  const decimalPart = rawScore - integerPart;

  if (decimalPart < 0.25) {
    return integerPart;
  } else if (decimalPart < 0.75) {
    return integerPart + 0.5;
  } else {
    return integerPart + 1.0;
  }
}

/**
 * Quy đổi số câu đúng Reading (0 - 40 câu) sang thang điểm 10.0
 */
export function calculateReadingScore(correctCount: number, totalQuestions: number = 40): number {
  if (totalQuestions <= 0) return 0;
  const clamped = Math.max(0, Math.min(correctCount, totalQuestions));
  const raw = (clamped / totalQuestions) * 10;
  return roundVstepScore(raw);
}

/**
 * Quy đổi số câu đúng Listening (0 - 35 câu) sang thang điểm 10.0
 */
export function calculateListeningScore(correctCount: number, totalQuestions: number = 35): number {
  if (totalQuestions <= 0) return 0;
  const clamped = Math.max(0, Math.min(correctCount, totalQuestions));
  const raw = (clamped / totalQuestions) * 10;
  return roundVstepScore(raw);
}

/**
 * Xếp loại CEFR theo điểm tổng hợp VSTEP (0 - 10)
 */
export function getCefrLevel(overallScore: number): VstepCefrLevel {
  if (overallScore >= 8.5) return 'C1';
  if (overallScore >= 6.0) return 'B2';
  if (overallScore >= 4.0) return 'B1';
  return 'A2';
}

/**
 * Lấy mô tả chi tiết cấp bậc CEFR VSTEP
 */
export function getCefrDescription(level: VstepCefrLevel): {
  titleVi: string;
  badgeVi: string;
  summaryVi: string;
  colorClass: string;
} {
  switch (level) {
    case 'C1':
      return {
        titleVi: 'C1 — Bậc 5 (Cao Cấp / Thành Thạo)',
        badgeVi: 'Đạt C1 (8.5 - 10.0)',
        summaryVi: 'Có thể hiểu các văn bản dài, phức tạp; diễn đạt trôi chảy tự nhiên không lúng túng; sử dụng ngôn ngữ linh hoạt cho mục đích xã hội, học thuật và chuyên môn.',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      };
    case 'B2':
      return {
        titleVi: 'B2 — Bậc 4 (Trung Cao Cấp / Khá)',
        badgeVi: 'Đạt B2 (6.0 - 8.0)',
        summaryVi: 'Hiểu ý chính của văn bản phức tạp về các chủ đề cụ thể và trừu tượng; giao tiếp trôi chảy với người bản xứ; viết bài rõ ràng, chi tiết về nhiều chủ đề.',
        colorClass: 'text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
      };
    case 'B1':
      return {
        titleVi: 'B1 — Bậc 3 (Trung Cấp)',
        badgeVi: 'Đạt B1 (4.0 - 5.5)',
        summaryVi: 'Hiểu các ý chính trong giao tiếp quen thuộc tại công sở, trường học; xử lý hầu hết các tình huống khi đi lại; viết đoạn văn đơn giản liên kết các chủ đề quen thuộc.',
        colorClass: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
      };
    case 'A2':
    default:
      return {
        titleVi: 'Dưới B1 (Chưa Đạt Chuẩn B1)',
        badgeVi: 'Chưa Đạt (< 4.0)',
        summaryVi: 'Điểm số chưa đủ điều kiện cấp chứng chỉ B1. Cần củng cố thêm từ vựng, ngữ pháp cơ bản và kỹ năng nghe hiểu.',
        colorClass: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
      };
  }
}

/**
 * Tính điểm toàn diện cho bài thi VSTEP
 */
export function calculateVstepScore(params: {
  listeningCorrect?: number;
  listeningTotal?: number;
  readingCorrect?: number;
  readingTotal?: number;
  writingScore?: number;
  speakingScore?: number;
  partBreakdown?: Record<string, { label: string; correct: number; total: number; accuracy: number }>;
}): VstepScoreResult {
  const {
    listeningCorrect,
    listeningTotal = 35,
    readingCorrect,
    readingTotal = 40,
    writingScore,
    speakingScore,
    partBreakdown = {}
  } = params;

  const validScores: number[] = [];

  let lScore: number | undefined;
  if (typeof listeningCorrect === 'number') {
    lScore = calculateListeningScore(listeningCorrect, listeningTotal);
    validScores.push(lScore);
  }

  let rScore: number | undefined;
  if (typeof readingCorrect === 'number') {
    rScore = calculateReadingScore(readingCorrect, readingTotal);
    validScores.push(rScore);
  }

  if (typeof writingScore === 'number') {
    validScores.push(writingScore);
  }

  if (typeof speakingScore === 'number') {
    validScores.push(speakingScore);
  }

  // Điểm tổng là trung bình các kỹ năng đã thực hiện
  const average = validScores.length > 0
    ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
    : 0;

  const overallScore = roundVstepScore(average);
  const cefrLevel = getCefrLevel(overallScore);

  return {
    listeningScore: lScore,
    readingScore: rScore,
    writingScore,
    speakingScore,
    overallScore,
    cefrLevel,
    listeningCorrect,
    readingCorrect,
    listeningTotal,
    readingTotal,
    partBreakdown
  };
}
