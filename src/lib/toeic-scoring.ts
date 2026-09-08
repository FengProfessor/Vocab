/**
 * TOEIC Scoring Engine & CEFR Analytics.
 * Converts raw question counts to ETS 10-990 scaled scores,
 * computes Part 1-7 accuracy metrics, and provides diagnostic assessment.
 */

import { lookupListeningScore, lookupReadingScore } from './toeic-barem';
import type {
  ToeicPart,
  ToeicUnifiedQuestion,
  ToeicClientQuestion,
  ToeicScoreResult,
  ToeicPartStat,
  ToeicCefrLevel,
  ToeicAccuracyRating,
} from '@/types/toeic';

/**
 * Convert raw listening score (0-100) to ETS scaled score (5-495).
 */
export function getScaledListeningScore(raw: number): number {
  return lookupListeningScore(raw);
}

/**
 * Convert raw reading score (0-100) to ETS scaled score (5-495).
 */
export function getScaledReadingScore(raw: number): number {
  return lookupReadingScore(raw);
}

/**
 * Determine CEFR level based on total scaled score (10-990).
 *
 * Mapping standard:
 * - 905 - 990: C1 (Advanced / Professional proficiency)
 * - 605 - 900: B2 (Vantage / MNC workplace standard; includes 785)
 * - 405 - 600: B1 (Intermediate / VN University graduation standard)
 * - 255 - 400: A2 (Elementary / Basic communication)
 * - 10 - 250:  A1 (Beginner / Foundational grammar & vocab needed)
 */
export function getCefrLevel(totalScaled: number): ToeicCefrLevel {
  if (totalScaled >= 905) return 'C1';
  if (totalScaled >= 605) return 'B2';
  if (totalScaled >= 405) return 'B1';
  if (totalScaled >= 255) return 'A2';
  return 'A1';
}

/**
 * Qualitative accuracy rating based on percentage correct.
 */
export function getPartAccuracyRating(percentage: number): ToeicAccuracyRating {
  if (percentage >= 80) return 'high';
  if (percentage >= 50) return 'medium';
  return 'low';
}

/**
 * Comprehensive CEFR descriptor and action feedback in Vietnamese.
 */
export function getCefrDescriptor(level: ToeicCefrLevel): {
  level: ToeicCefrLevel;
  title: string;
  descriptionVi: string;
  targetFeedbackVi: string;
} {
  switch (level) {
    case 'C1':
      return {
        level: 'C1',
        title: 'Thành thạo chuyên nghiệp (Advanced)',
        descriptionVi:
          'Khả năng tiếng Anh lưu loát trong môi trường quốc tế phức tạp, hiểu sâu các sắc thái ngôn từ, bẫy ngữ pháp và văn bản thương mại chuyên sâu.',
        targetFeedbackVi:
          'Duy trì tốc độ làm bài và phản xạ nghe tự nhiên để giữ vững phong độ 900+.',
      };
    case 'B2':
      return {
        level: 'B2',
        title: 'Giao tiếp & Làm việc vững vàng (Vantage)',
        descriptionVi:
          'Đạt chuẩn tuyển dụng các tập đoàn đa quốc gia và ngân hàng. Tự tin trao đổi nghiệp vụ, đọc hiểu hợp đồng và email thương mại.',
        targetFeedbackVi:
          'Tăng cường luyện các câu bẫy Part 3-4 và văn bản phức tạp Part 7 Multiple Passages để bứt phá lên C1.',
      };
    case 'B1':
      return {
        level: 'B1',
        title: 'Trung cấp — Chuẩn tốt nghiệp (Intermediate)',
        descriptionVi:
          'Đạt chuẩn đầu ra của hầu hết các trường Đại học tại Việt Nam. Hiểu được ý chính trong hội thoại công sở và văn bản đơn giản.',
        targetFeedbackVi:
          'Tập trung củng cố từ vựng thương mại và tốc độ đọc quét (scanning) Part 7 để nâng cao điểm Reading.',
      };
    case 'A2':
      return {
        level: 'A2',
        title: 'Cơ bản — Giao tiếp tình huống (Elementary)',
        descriptionVi:
          'Nắm được ngữ pháp cơ bản, hiểu các thông báo ngắn nhưng còn gặp khó khăn khi nghe đoạn hội thoại nhanh hoặc đọc bài dài.',
        targetFeedbackVi:
          'Cần ôn tập 2.000 từ vựng cốt lõi và luyện phản xạ Part 1 & Part 2 để lấy trọn điểm căn bản.',
      };
    case 'A1':
    default:
      return {
        level: 'A1',
        title: 'Mất gốc / Mới bắt đầu (Beginner)',
        descriptionVi:
          'Chỉ hiểu được các từ đơn lẻ và câu chào hỏi căn bản, chưa đủ phản xạ với cấu trúc bài thi TOEIC.',
        targetFeedbackVi:
          'Ưu tiên học lộ trình Lấy gốc Ngữ pháp và luyện từ vựng qua Flashcard FSRS trước khi giải đề full.',
      };
  }
}

/**
 * Pure calculation function: computes full TOEIC score, scaled scores,
 * Part 1-7 accuracy statistics, and CEFR level.
 *
 * @param answers Map of questionNumber -> selected option ('A' | 'B' | 'C' | 'D')
 * @param questions Full or partial list of ToeicUnifiedQuestion
 * @param timeSpentSeconds Elapsed exam time in seconds
 */
export function calculateToeicScore(
  answers: Record<number, 'A' | 'B' | 'C' | 'D' | string>,
  questions: (ToeicUnifiedQuestion | ToeicClientQuestion)[],
  timeSpentSeconds: number = 0
): ToeicScoreResult {
  let rawListening = 0;
  let rawReading = 0;

  // Initialize part stats for all 7 parts
  const partStats: Record<ToeicPart, ToeicPartStat> = {
    1: { part: 1, total: 0, correct: 0, percentage: 0, accuracyRating: 'low' },
    2: { part: 2, total: 0, correct: 0, percentage: 0, accuracyRating: 'low' },
    3: { part: 3, total: 0, correct: 0, percentage: 0, accuracyRating: 'low' },
    4: { part: 4, total: 0, correct: 0, percentage: 0, accuracyRating: 'low' },
    5: { part: 5, total: 0, correct: 0, percentage: 0, accuracyRating: 'low' },
    6: { part: 6, total: 0, correct: 0, percentage: 0, accuracyRating: 'low' },
    7: { part: 7, total: 0, correct: 0, percentage: 0, accuracyRating: 'low' },
  };

  for (const q of questions) {
    const p = q.part;
    if (partStats[p]) {
      partStats[p].total += 1;
    }

    const selected = (answers[q.questionNumber] || '').trim().toUpperCase();
    const isCorrect = selected === q.correctAnswer;

    if (isCorrect) {
      if (partStats[p]) {
        partStats[p].correct += 1;
      }
      if (q.section === 'listening' || p <= 4) {
        rawListening += 1;
      } else {
        rawReading += 1;
      }
    }
  }

  // Calculate percentages and accuracy ratings
  for (let p = 1; p <= 7; p++) {
    const stat = partStats[p as ToeicPart];
    stat.percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    stat.accuracyRating = getPartAccuracyRating(stat.percentage);
  }

  const rawTotal = rawListening + rawReading;
  const scaledListening = getScaledListeningScore(rawListening);
  const scaledReading = getScaledReadingScore(rawReading);
  const scaledTotal = scaledListening + scaledReading;
  const cefrLevel = getCefrLevel(scaledTotal);

  return {
    rawListening,
    rawReading,
    rawTotal,
    scaledListening,
    scaledReading,
    scaledTotal,
    cefrLevel,
    partStats,
    timeSpentSeconds,
  };
}
