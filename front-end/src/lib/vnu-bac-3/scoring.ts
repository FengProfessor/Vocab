/**
 * VNU Test Bậc 3 (ULIS ĐHQGHN) Barem Scoring Engine
 * File: src/lib/vnu-bac-3/scoring.ts
 */

import type { VnuBac3Exam, VnuBac3ScoreResult, VnuBac3QuestionReview } from '@/types/vnu-bac-3';

/**
 * Quy tắc làm tròn số học đến 0.5 gần nhất
 * Math.round(val * 2) / 2
 * Ví dụ:
 * 0.4 -> 0.5; 0.8 -> 1.0; 1.2 -> 1.0; 1.6 -> 1.5; 2.0 -> 2.0; 5.6 -> 5.5; 6.4 -> 6.5
 */
export function roundToHalf(val: number): number {
  if (isNaN(val) || val <= 0) return 0.0;
  return Math.round(val * 2) / 2;
}

/**
 * Quy đổi điểm Reading thô (0..25) sang thang điểm 10.0 làm tròn 0.5
 * rawCorrect / 25 * 10.0, rounded to nearest 0.5
 */
export function calculateVnuReadingScore(rawCorrect: number): number {
  const boundedRaw = Math.max(0, Math.min(25, Math.round(rawCorrect)));
  const scaled = (boundedRaw / 25) * 10.0;
  return roundToHalf(scaled);
}

/**
 * Quy đổi điểm Listening thô (0..20) sang thang điểm 10.0 làm tròn 0.5
 * rawCorrect / 20 * 10.0 = rawCorrect * 0.5, rounded to nearest 0.5
 */
export function calculateVnuListeningScore(rawCorrect: number): number {
  const boundedRaw = Math.max(0, Math.min(20, Math.round(rawCorrect)));
  const scaled = (boundedRaw / 20) * 10.0;
  return roundToHalf(scaled);
}

/**
 * Tính điểm trung bình cộng 2 kỹ năng trắc nghiệm và làm tròn 0.5
 */
export function calculateVnuOverallScore(readingScore: number, listeningScore: number): number {
  const avg = (readingScore + listeningScore) / 2.0;
  return roundToHalf(avg);
}

/**
 * Kiểm tra tiêu chuẩn Đạt / Chưa Đạt:
 * 1. overallScore >= 6.0
 * 2. readingScore >= 2.0 (không liệt)
 * 3. listeningScore >= 2.0 (không liệt)
 */
export function checkVnuPassCriteria(readingScore: number, listeningScore: number, overallScore: number): {
  isPassed: boolean;
  statusLabel: 'ĐẠT (BẬC 3 / B1)' | 'CHƯA ĐẠT';
  failureReason?: string;
} {
  const isReadingEliminated = readingScore < 2.0;
  const isListeningEliminated = listeningScore < 2.0;

  if (isReadingEliminated && isListeningEliminated) {
    return {
      isPassed: false,
      statusLabel: 'CHƯA ĐẠT',
      failureReason: 'Dính điểm liệt cả hai kỹ năng Đọc và Nghe (< 2.0/10.0)',
    };
  }

  if (isReadingEliminated) {
    return {
      isPassed: false,
      statusLabel: 'CHƯA ĐẠT',
      failureReason: 'Dính điểm liệt kỹ năng Đọc (< 2.0/10.0 - dưới 5 câu đúng)',
    };
  }

  if (isListeningEliminated) {
    return {
      isPassed: false,
      statusLabel: 'CHƯA ĐẠT',
      failureReason: 'Dính điểm liệt kỹ năng Nghe (< 2.0/10.0 - dưới 4 câu đúng)',
    };
  }

  if (overallScore < 6.0) {
    return {
      isPassed: false,
      statusLabel: 'CHƯA ĐẠT',
      failureReason: `Điểm trung bình (${overallScore.toFixed(1)}/10.0) chưa đạt ngưỡng chuẩn Bậc 3 (yêu cầu tối thiểu >= 6.0)`,
    };
  }

  return {
    isPassed: true,
    statusLabel: 'ĐẠT (BẬC 3 / B1)',
  };
}

/**
 * Chuẩn hóa đáp án để so sánh công bằng:
 * 'A' / 'B' / 'C' hoặc 'True' / 'False' / 'Correct' / 'Incorrect'
 */
export function normalizeAnswerKey(ans: unknown): string {
  if (ans === undefined || ans === null) return '';
  const s = String(ans).trim().toUpperCase();
  if (s === 'TRUE' || s === 'CORRECT' || s === 'A' || s === '0') return 'A';
  if (s === 'FALSE' || s === 'INCORRECT' || s === 'B' || s === '1') return 'B';
  if (s === 'C' || s === '2') return 'C';
  return s;
}

/**
 * Động cơ chấm điểm toàn diện một bài thi VNU Bậc 3 dựa trên authoritative master key
 */
export function gradeVnuBac3Exam(
  exam: VnuBac3Exam,
  userAnswers: Record<string, string>,
  timeSpentSeconds = 0
): VnuBac3ScoreResult {
  let readingCorrect = 0;
  let readingTotal = 0;
  let listeningCorrect = 0;
  let listeningTotal = 0;

  const partBreakdown: Record<string, { label: string; correct: number; total: number; accuracy: number }> = {};
  const reviewQuestions: VnuBac3QuestionReview[] = [];

  for (const section of exam.sections) {
    const isReading = section.type === 'reading';
    const isListening = section.type === 'listening';

    if (!isReading && !isListening) continue;

    for (const task of section.tasks) {
      const partKey = `${section.type}_part${task.partNumber}`;
      if (!partBreakdown[partKey]) {
        partBreakdown[partKey] = {
          label: `${section.label} - ${task.title}`,
          correct: 0,
          total: 0,
          accuracy: 0,
        };
      }

      for (const q of task.questions) {
        if (isReading) readingTotal++;
        if (isListening) listeningTotal++;
        partBreakdown[partKey].total++;

        const userRaw = userAnswers[q.id];
        const userNorm = normalizeAnswerKey(userRaw);
        const correctNorm = normalizeAnswerKey(q.correctAnswer ?? q.answerIndex);

        const isCorrect = Boolean(userNorm && correctNorm && userNorm === correctNorm);

        if (isCorrect) {
          if (isReading) readingCorrect++;
          if (isListening) listeningCorrect++;
          partBreakdown[partKey].correct++;
        }

        reviewQuestions.push({
          id: q.id,
          questionNumber: q.questionNumber,
          partNumber: q.partNumber,
          skill: section.type,
          prompt: q.prompt,
          options: q.options,
          userAnswer: userRaw || '',
          correctAnswer: String(q.correctAnswer ?? (q.answerIndex === 0 ? 'A' : q.answerIndex === 1 ? 'B' : 'C')),
          isCorrect,
          explanationVi: q.explanationVi || 'Chưa có lời giải thích cho câu hỏi này.',
          transcript: task.transcript,
          vocabularyNotes: q.vocabularyNotes,
        });
      }

      if (partBreakdown[partKey].total > 0) {
        partBreakdown[partKey].accuracy = Math.round(
          (partBreakdown[partKey].correct / partBreakdown[partKey].total) * 100
        );
      }
    }
  }

  // Fallback defaults if totals were 0
  const finalReadingTotal = readingTotal || 25;
  const finalListeningTotal = listeningTotal || 20;

  const readingScore = calculateVnuReadingScore(readingCorrect);
  const listeningScore = calculateVnuListeningScore(listeningCorrect);
  const overallScore = calculateVnuOverallScore(readingScore, listeningScore);

  const { isPassed, statusLabel, failureReason } = checkVnuPassCriteria(
    readingScore,
    listeningScore,
    overallScore
  );

  return {
    examId: exam.id,
    readingScore,
    readingCorrect,
    readingTotal: finalReadingTotal,
    listeningScore,
    listeningCorrect,
    listeningTotal: finalListeningTotal,
    overallScore,
    isPassed,
    statusLabel,
    failureReason,
    submittedAt: new Date().toISOString(),
    timeSpentSeconds,
    partBreakdown,
    reviewQuestions,
  };
}
