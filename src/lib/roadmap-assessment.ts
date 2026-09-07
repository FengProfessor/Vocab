import { judgeAnswer } from '@/lib/study';

export type AssessmentType = 'mini_quiz' | 'checkpoint' | 'exit_exam';
export type AssessmentSkill = 'vocab' | 'grammar' | 'pronunciation' | 'reading';
export type SkillScoreStatus = 'mastered' | 'adequate' | 'weak';

export interface DiagnosticQuestion {
  id: string;
  skill: AssessmentSkill;
  subSkill?: string;
  conceptRef: string;
  conceptName: string;
  sourceStepId: string;
  sourceStepTitle: string;
  sourceUrl: string;
  prompt: string;
  audioWord?: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface SkillBreakdown {
  total: number;
  correct: number;
  pct: number;
  status: SkillScoreStatus;
}

export interface WeakConcept {
  conceptRef: string;
  conceptName: string;
  skill: AssessmentSkill;
  userChoice: string;
  correctAnswer: string;
  explanation?: string;
  sourceStepId: string;
  sourceStepTitle: string;
  sourceUrl: string;
}

export interface RemedialRecommendation {
  stepId: string;
  title: string;
  skill: AssessmentSkill;
  reason: string;
  url: string;
  errorCount: number;
}

export interface DiagnosticReport {
  stepId: string;
  targetId: string;
  type: AssessmentType;
  scorePct: number;
  passed: boolean;
  passThresholdPct: number;
  totalQuestions: number;
  correctQuestions: number;
  skills: Partial<Record<AssessmentSkill, SkillBreakdown>>;
  weakConcepts: WeakConcept[];
  recommendations: RemedialRecommendation[];
  summaryVi: string;
  completedAt: string;
}

export interface AssessmentAttempt {
  id?: string;
  userId: string;
  track: 'cefr' | 'thpt';
  tier: AssessmentType;
  targetId: string;
  score: number;
  passed: boolean;
  details: DiagnosticReport | Record<string, unknown>;
  createdAt?: string;
}

export interface DiagnosticEvaluationInput {
  questions: DiagnosticQuestion[];
  answers: Record<string, string>;
  metadata: {
    stepId: string;
    targetId?: string;
    type?: AssessmentType;
    passThresholdPct?: number;
    track?: 'cefr' | 'thpt';
    levelId?: string;
  };
}

/**
 * Đánh giá câu trả lời của người học.
 * Hỗ trợ cả so khớp trắc nghiệm (chính xác hoặc không phân biệt hoa thường/khoảng trắng)
 * và câu hỏi gõ từ mở (fuzzy match levenshtein <= 2 via judgeAnswer).
 */
export function judgeDiagnosticAnswer(guess: string, answer: string, isTyping = false): boolean {
  const g = (guess || '').trim().toLowerCase();
  const a = (answer || '').trim().toLowerCase();
  if (!g) return false;
  if (g === a) return true;
  if (isTyping) {
    const verdict = judgeAnswer(g, a);
    return verdict === 'correct' || verdict === 'close';
  }
  return false;
}

/**
 * Tạo URL học tập / ôn tập 1-click sâu vào đúng node bài học
 */
export function getReviewUrlForStep(
  stepId: string,
  type: string,
  ref: string,
  track: 'cefr' | 'thpt' = 'cefr'
): string {
  if (type === 'vocab') {
    if (ref.startsWith('starter-')) {
      return `/flashcard?class=roadmap&mode=learn&starter=${encodeURIComponent(ref)}&roadmapStep=${encodeURIComponent(stepId)}`;
    }
    return `/flashcard?class=roadmap&mode=learn&pack=${encodeURIComponent(ref)}&roadmapStep=${encodeURIComponent(stepId)}`;
  }
  if (type === 'grammar') {
    return `/grammar/learn?topic=${encodeURIComponent(ref)}&roadmapStep=${encodeURIComponent(stepId)}`;
  }
  if (type === 'pronunciation') {
    return `/pronunciation/${encodeURIComponent(ref)}?roadmapStep=${encodeURIComponent(stepId)}`;
  }
  if (
    type === 'reading' ||
    type === 'cloze' ||
    type === 'arrange' ||
    type === 'announcement' ||
    type === 'leaflet' ||
    type === 'exam'
  ) {
    return `/thpt/${encodeURIComponent(type)}/${encodeURIComponent(ref)}?roadmapStep=${encodeURIComponent(stepId)}`;
  }
  return `/journey?track=${track}&step=${encodeURIComponent(stepId)}`;
}

/**
 * Thuật toán phân tích chẩn đoán:
 * 1. Chấm điểm từng câu hỏi.
 * 2. Phân tách điểm theo từng kỹ năng (từ vựng, ngữ pháp, phát âm, đọc hiểu).
 * 3. Trích xuất các khái niệm còn yếu (weak concepts) kèm lựa chọn của user vs đáp án đúng.
 * 4. Tạo các thẻ khuyến nghị ôn tập 1-click có link trực tiếp về node nguồn.
 */
export function evaluateDiagnostic(input: DiagnosticEvaluationInput): DiagnosticReport {
  const { questions, answers, metadata } = input;
  const passThresholdPct = metadata.passThresholdPct ?? 80;
  const type = metadata.type || 'checkpoint';
  const targetId = metadata.targetId || metadata.stepId;

  const totalQuestions = questions.length;
  let correctQuestions = 0;

  const skillAccumulator: Record<
    AssessmentSkill,
    { total: number; correct: number }
  > = {
    vocab: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
    pronunciation: { total: 0, correct: 0 },
    reading: { total: 0, correct: 0 },
  };

  const weakConcepts: WeakConcept[] = [];
  const errorsByStep = new Map<
    string,
    {
      title: string;
      skill: AssessmentSkill;
      url: string;
      errorCount: number;
    }
  >();

  for (const q of questions) {
    const userGuess = answers[q.id] || '';
    const isTyping = !q.options || q.options.length === 0;
    const isCorrect = judgeDiagnosticAnswer(userGuess, q.answer, isTyping);

    const skillKey = q.skill || 'vocab';
    if (!skillAccumulator[skillKey]) {
      skillAccumulator[skillKey] = { total: 0, correct: 0 };
    }
    skillAccumulator[skillKey].total += 1;

    if (isCorrect) {
      correctQuestions += 1;
      skillAccumulator[skillKey].correct += 1;
    } else {
      weakConcepts.push({
        conceptRef: q.conceptRef || q.id,
        conceptName: q.conceptName || q.prompt,
        skill: skillKey,
        userChoice: userGuess || '(Chưa trả lời)',
        correctAnswer: q.answer,
        explanation: q.explanation,
        sourceStepId: q.sourceStepId,
        sourceStepTitle: q.sourceStepTitle,
        sourceUrl: q.sourceUrl,
      });

      const existingStep = errorsByStep.get(q.sourceStepId);
      if (existingStep) {
        existingStep.errorCount += 1;
      } else {
        errorsByStep.set(q.sourceStepId, {
          title: q.sourceStepTitle || 'Bài học liên quan',
          skill: skillKey,
          url: q.sourceUrl || `/journey?step=${encodeURIComponent(q.sourceStepId)}`,
          errorCount: 1,
        });
      }
    }
  }

  const scorePct = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 100;
  const passed = scorePct >= passThresholdPct;

  const skills: Partial<Record<AssessmentSkill, SkillBreakdown>> = {};
  for (const [key, val] of Object.entries(skillAccumulator) as [AssessmentSkill, { total: number; correct: number }][]) {
    if (val.total > 0) {
      const pct = Math.round((val.correct / val.total) * 100);
      let status: SkillScoreStatus = 'adequate';
      if (pct >= 85) status = 'mastered';
      else if (pct < 70) status = 'weak';

      skills[key] = {
        total: val.total,
        correct: val.correct,
        pct,
        status,
      };
    }
  }

  const recommendations: RemedialRecommendation[] = Array.from(errorsByStep.entries())
    .map(([stepId, data]) => ({
      stepId,
      title: data.title,
      skill: data.skill,
      reason: `Bạn làm sai ${data.errorCount} câu liên quan đến phần này.`,
      url: data.url,
      errorCount: data.errorCount,
    }))
    .sort((a, b) => b.errorCount - a.errorCount);

  let summaryVi = '';
  if (passed) {
    if (scorePct === 100) {
      summaryVi = 'Xuất sắc! Bạn đã trả lời đúng 100% tất cả các câu hỏi và hoàn toàn làm chủ kiến thức chặng.';
    } else {
      summaryVi = `Chúc mừng! Bạn đạt ${scorePct}% (ngưỡng đạt: ${passThresholdPct}%), đủ điều kiện hoàn thành bài kiểm tra.`;
    }
  } else {
    const weakSkills = Object.entries(skills)
      .filter(([, s]) => s && s.status === 'weak')
      .map(([k]) => {
        switch (k) {
          case 'vocab': return 'Từ vựng';
          case 'grammar': return 'Ngữ pháp';
          case 'pronunciation': return 'Phát âm';
          case 'reading': return 'Đọc hiểu';
        }
      });

    if (weakSkills.length > 0) {
      summaryVi = `Bạn đạt ${scorePct}%, chưa đủ ngưỡng đạt (${passThresholdPct}%). Cần chú trọng ôn lại: ${weakSkills.join(', ')}.`;
    } else {
      summaryVi = `Bạn đạt ${scorePct}%, chưa đủ ngưỡng đạt (${passThresholdPct}%). Hãy ôn lại các câu sai rồi thử lại nhé!`;
    }
  }

  return {
    stepId: metadata.stepId,
    targetId,
    type,
    scorePct,
    passed,
    passThresholdPct,
    totalQuestions,
    correctQuestions,
    skills,
    weakConcepts,
    recommendations,
    summaryVi,
    completedAt: new Date().toISOString(),
  };
}

/** Khóa lưu cache offline trong localStorage */
export function getDiagnosticStorageKey(userId: string, targetId: string): string {
  return `roadmap_diag:${userId}:${targetId}`;
}
