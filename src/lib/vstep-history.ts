/**
 * VSTEP Smart Question History Tracker & Anti-Duplication System
 * Lưu trữ lịch sử câu hỏi trên localStorage và đồng bộ lên database
 */

import {
  VstepSkillType,
  VstepCefrLevel,
  VstepExamAttemptRecord,
  VstepExamSummary,
  VstepExamHistoryStore,
} from './vstep-types';

export const VSTEP_HISTORY_STORAGE_KEY = 'lingo_vstep_question_history';
export const VSTEP_EXAM_HISTORY_STORAGE_KEY = 'lingo_vstep_exam_history';
export const VSTEP_HISTORY_UPDATED_EVENT = 'lingo_vstep_history_updated';

export interface VstepQuestionRecord {
  questionId: string;
  skill: VstepSkillType;
  part: string; // e.g. 'part1', 'part2', 'part3', 'reading_p1'
  lastAnsweredAt: string;
  isCorrect: boolean;
  attemptCount: number;
  selectedOption?: number;
  examId?: string;
  canonicalId?: string;
}

export type VstepHistoryStore = Record<string, VstepQuestionRecord>;

export type VstepPracticeFilterMode = 'unseen' | 'mistakes' | 'all_random';

/**
 * Tạo canonical question ID dạng `${examId}:${q.id}`
 */
export function toCanonicalVstepQuestionId(examId: string, questionId: string): string {
  if (!examId || questionId.includes(':')) return questionId;
  return `${examId}:${questionId}`;
}

/**
 * Phân tích canonical question ID thành examId và raw questionId
 */
export function parseCanonicalVstepQuestionId(id: string): { examId?: string; questionId: string } {
  if (!id) return { questionId: '' };
  const colonIdx = id.indexOf(':');
  if (colonIdx > 0) {
    return {
      examId: id.substring(0, colonIdx),
      questionId: id.substring(colonIdx + 1),
    };
  }
  return { questionId: id };
}

/**
 * Tạo proxy cho VstepHistoryStore để hỗ trợ tra cứu kép (canonical ID & raw ID)
 */
export function createHistoryStoreProxy(target: VstepHistoryStore): VstepHistoryStore {
  return new Proxy(target, {
    get(obj, prop: string | symbol) {
      if (typeof prop === 'symbol' || prop in obj) return (obj as any)[prop];
      if (typeof prop === 'string') {
        // 1. Tra cứu trực tiếp theo questionId hoặc canonicalId
        for (const val of Object.values(obj)) {
          if (val.questionId === prop || val.canonicalId === prop) return val;
        }
        // 2. Tra cứu hậu tố (ví dụ: 'L1Q1' khi lưu dạng 'vstep-exam-01:L1Q1')
        for (const [key, val] of Object.entries(obj)) {
          if (key.endsWith(`:${prop}`)) return val;
        }
        // 3. Tra cứu tiền tố (ví dụ: 'vstep-exam-01:L1Q1' khi lưu dạng 'L1Q1')
        const colonIdx = prop.indexOf(':');
        if (colonIdx > 0) {
          const rawId = prop.substring(colonIdx + 1);
          if (rawId in obj) return obj[rawId];
        }
      }
      return undefined;
    },
  });
}

/**
 * Đọc toàn bộ lịch sử câu hỏi từ localStorage
 */
export function getVstepHistory(): VstepHistoryStore {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VSTEP_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return createHistoryStoreProxy(parsed as VstepHistoryStore);
    }
    return {};
  } catch (err) {
    console.error('Lỗi khi đọc VSTEP question history:', err);
    return {};
  }
}

/**
 * Lưu 1 câu hỏi vào lịch sử
 */
export function recordVstepQuestionAnswer(
  record: Omit<VstepQuestionRecord, 'lastAnsweredAt' | 'attemptCount'>
): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const store = getVstepHistory();
    const canonicalId = record.examId
      ? toCanonicalVstepQuestionId(record.examId, record.questionId)
      : record.questionId.includes(':')
      ? record.questionId
      : undefined;

    const rawQId = record.questionId.includes(':')
      ? record.questionId.substring(record.questionId.indexOf(':') + 1)
      : record.questionId;

    const existing = store[record.questionId] || (canonicalId ? store[canonicalId] : undefined);

    store[record.questionId] = {
      ...record,
      questionId: rawQId,
      lastAnsweredAt: new Date().toISOString(),
      attemptCount: (existing?.attemptCount || 0) + 1,
      canonicalId: canonicalId || (record.examId ? `${record.examId}:${rawQId}` : undefined),
    };

    localStorage.setItem(VSTEP_HISTORY_STORAGE_KEY, JSON.stringify(store));

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(VSTEP_HISTORY_UPDATED_EVENT, {
          detail: { type: 'question_answer', questionId: record.questionId },
        })
      );
    }
  } catch (err) {
    console.error('Lỗi khi ghi VSTEP question record:', err);
  }
}

/**
 * Ghi nhận hàng loạt câu hỏi sau khi nộp bài
 */
export function batchRecordVstepAnswers(
  items: Array<{
    questionId: string;
    skill: VstepSkillType;
    part: string;
    isCorrect: boolean;
    selectedOption?: number;
    examId?: string;
  }>
): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || items.length === 0) return;
  try {
    const store = getVstepHistory();
    const now = new Date().toISOString();

    for (const item of items) {
      const canonicalId = item.examId
        ? toCanonicalVstepQuestionId(item.examId, item.questionId)
        : item.questionId.includes(':')
        ? item.questionId
        : undefined;

      const rawQId = item.questionId.includes(':')
        ? item.questionId.substring(item.questionId.indexOf(':') + 1)
        : item.questionId;

      const existing = store[item.questionId] || (canonicalId ? store[canonicalId] : undefined);
      const storeKey = item.questionId;

      store[storeKey] = {
        questionId: rawQId,
        skill: item.skill,
        part: item.part,
        isCorrect: item.isCorrect,
        selectedOption: item.selectedOption,
        lastAnsweredAt: now,
        attemptCount: (existing?.attemptCount || 0) + 1,
        examId: item.examId,
        canonicalId: canonicalId || (item.examId ? `${item.examId}:${rawQId}` : undefined),
      };
    }

    localStorage.setItem(VSTEP_HISTORY_STORAGE_KEY, JSON.stringify(store));

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(VSTEP_HISTORY_UPDATED_EVENT, {
          detail: { type: 'batch_questions', count: items.length },
        })
      );
    }
  } catch (err) {
    console.error('Lỗi khi batch ghi VSTEP question records:', err);
  }
}

/**
 * Lấy danh sách ID các câu đã làm theo kỹ năng / part
 */
export function getAnsweredVstepQuestionIds(skill?: VstepSkillType, part?: string): Set<string> {
  const store = getVstepHistory();
  const ids = new Set<string>();

  for (const [qId, rec] of Object.entries(store)) {
    if (skill && rec.skill !== skill) continue;
    if (part && rec.part !== part) continue;
    ids.add(qId);
  }

  return ids;
}

/**
 * Lấy danh sách ID các câu làm SAI gần nhất theo kỹ năng / part
 */
export function getIncorrectVstepQuestionIds(skill?: VstepSkillType, part?: string): Set<string> {
  const store = getVstepHistory();
  const ids = new Set<string>();

  for (const [qId, rec] of Object.entries(store)) {
    if (skill && rec.skill !== skill) continue;
    if (part && rec.part !== part) continue;
    if (!rec.isCorrect) {
      ids.add(qId);
    }
  }

  return ids;
}

/**
 * Thống kê tiến độ học tập cho 1 kỹ năng hoặc part
 */
export function getVstepProgressStats(skill: VstepSkillType, totalInBank: number): {
  answeredCount: number;
  totalCount: number;
  correctCount: number;
  mistakeCount: number;
  percentage: number;
} {
  const store = getVstepHistory();
  let answered = 0;
  let correct = 0;
  let mistake = 0;

  for (const rec of Object.values(store)) {
    if (rec.skill === skill) {
      answered++;
      if (rec.isCorrect) correct++;
      else mistake++;
    }
  }

  const effectiveTotal = Math.max(totalInBank, answered);
  const percentage = effectiveTotal > 0 ? Math.round((answered / effectiveTotal) * 100) : 0;

  return {
    answeredCount: answered,
    totalCount: effectiveTotal,
    correctCount: correct,
    mistakeCount: mistake,
    percentage: Math.min(100, percentage),
  };
}

/**
 * Đặt lại tiến độ của 1 kỹ năng
 */
export function resetVstepSkillProgress(skill: VstepSkillType): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const store = getVstepHistory();
    for (const [qId, rec] of Object.entries(store)) {
      if (rec.skill === skill) {
        delete store[qId];
      }
    }
    localStorage.setItem(VSTEP_HISTORY_STORAGE_KEY, JSON.stringify(store));

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(VSTEP_HISTORY_UPDATED_EVENT, {
          detail: { type: 'reset_skill', skill },
        })
      );
    }
  } catch (err) {
    console.error('Lỗi khi reset VSTEP skill progress:', err);
  }
}

/**
 * Đặt lại toàn bộ lịch sử câu hỏi VSTEP (backward compatible)
 */
export function resetAllVstepProgress(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(VSTEP_HISTORY_STORAGE_KEY);
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(VSTEP_HISTORY_UPDATED_EVENT, {
          detail: { type: 'reset_progress' },
        })
      );
    }
  } catch (err) {
    console.error('Lỗi khi reset all VSTEP progress:', err);
  }
}

// ── EXAM HISTORY & COMPLETION TRACKING ──────────────────────────────────────

/**
 * Đọc toàn bộ lịch sử nộp bài thi (Full Mock & Practice) từ localStorage
 */
export function getVstepExamHistory(): VstepExamHistoryStore {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { version: 1, updatedAt: '', records: [] };
  }
  try {
    const raw = localStorage.getItem(VSTEP_EXAM_HISTORY_STORAGE_KEY);
    if (!raw) return { version: 1, updatedAt: '', records: [] };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.records)) {
      return {
        version: typeof parsed.version === 'number' ? parsed.version : 1,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
        records: parsed.records,
      };
    }
    return { version: 1, updatedAt: '', records: [] };
  } catch (err) {
    console.error('Lỗi khi đọc VSTEP exam history:', err);
    return { version: 1, updatedAt: '', records: [] };
  }
}

/**
 * Ghi nhận 1 lần thi / nộp bài VSTEP vào localStorage và phát event cập nhật
 */
export function recordVstepExamAttempt(attempt: Omit<VstepExamAttemptRecord, 'attemptId'>): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const store = getVstepExamHistory();
    const attemptId = `${attempt.examId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: VstepExamAttemptRecord = {
      ...attempt,
      attemptId,
    };
    store.records.push(newRecord);
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(VSTEP_EXAM_HISTORY_STORAGE_KEY, JSON.stringify(store));

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(VSTEP_HISTORY_UPDATED_EVENT, {
          detail: { type: 'exam_attempt', examId: attempt.examId, record: newRecord },
        })
      );
    }
  } catch (err) {
    console.error('Lỗi khi ghi VSTEP exam record:', err);
  }
}

/**
 * Tính toán bảng tổng hợp tóm tắt trạng thái từng đề thi:
 * - attemptCount: số lần thi
 * - highestScore: điểm cao nhất đạt được (monotonic max)
 * - highestCefr: cấp bậc CEFR cao nhất
 * - latestAttemptAt: thời điểm thi gần nhất
 * - latestScore: điểm số lần thi gần nhất
 * - latestCefr: cấp bậc CEFR lần thi gần nhất
 * - isCompleted: true nếu đã hoàn thành ít nhất 1 lần
 */
export function getVstepExamSummaries(): Record<string, VstepExamSummary> {
  const store = getVstepExamHistory();
  const summaries: Record<string, VstepExamSummary> = {};

  for (const rec of store.records) {
    const existing = summaries[rec.examId];
    if (!existing) {
      summaries[rec.examId] = {
        examId: rec.examId,
        attemptCount: 1,
        highestScore: rec.overallScore,
        highestCefr: rec.cefrLevel,
        latestAttemptAt: rec.completedAt,
        latestScore: rec.overallScore,
        latestCefr: rec.cefrLevel,
        isCompleted: true,
      };
    } else {
      existing.attemptCount += 1;
      if (rec.overallScore > existing.highestScore) {
        existing.highestScore = rec.overallScore;
        existing.highestCefr = rec.cefrLevel;
      }
      const existingTime = new Date(existing.latestAttemptAt).getTime();
      const newTime = new Date(rec.completedAt).getTime();
      if (newTime >= existingTime) {
        existing.latestAttemptAt = rec.completedAt;
        existing.latestScore = rec.overallScore;
        existing.latestCefr = rec.cefrLevel;
      }
    }
  }

  return summaries;
}

/**
 * Xóa toàn bộ lịch sử thi đề thi (giữ nguyên tiến độ câu hỏi)
 */
export function clearVstepExamHistory(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(VSTEP_EXAM_HISTORY_STORAGE_KEY);
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(VSTEP_HISTORY_UPDATED_EVENT, {
          detail: { type: 'clear_exams' },
        })
      );
    }
  } catch (err) {
    console.error('Lỗi khi clear VSTEP exam history:', err);
  }
}

/**
 * Xóa tiến độ luyện tập theo kỹ năng
 */
export function clearVstepSkillHistory(skill: 'listening' | 'reading'): void {
  resetVstepSkillProgress(skill);
}

/**
 * Đặt lại toàn bộ lịch sử VSTEP (cả câu hỏi và đề thi)
 */
export function resetAllVstepHistory(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(VSTEP_HISTORY_STORAGE_KEY);
    localStorage.removeItem(VSTEP_EXAM_HISTORY_STORAGE_KEY);
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent(VSTEP_HISTORY_UPDATED_EVENT, {
          detail: { type: 'reset_all' },
        })
      );
    }
  } catch (err) {
    console.error('Lỗi khi reset all VSTEP history:', err);
  }
}
