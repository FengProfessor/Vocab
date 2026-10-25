import type { VnuBac3ExamMode, VnuBac3ScoreResult } from '@/types/vnu-bac-3';

export const VNU_B3_HISTORY_STORAGE_KEY = 'lingo_vnu_b3_exam_history';
export const VNU_B3_DRAFT_PREFIX = 'vnu_b3_draft_';
const MAX_HISTORY_RECORDS = 100;

export interface VnuB3ExamAttemptRecord {
  id: string;
  examId: string;
  examTitle: string;
  mode: VnuBac3ExamMode;
  submittedAt: number;
  durationSeconds: number;
  listeningRaw: number;
  listeningTotal: number;
  listeningScore10: number;
  readingRaw: number;
  readingTotal: number;
  readingScore10: number;
  objectiveScore10: number;
  passed: boolean;
  statusLabel: string;
  writingCompletedCount: number;
}

export interface VnuB3ExamHistorySummary {
  examId: string;
  examTitle: string;
  attemptCount: number;
  lastAttemptAt: number;
  highestScore: number;
  lastScore: number;
  passed: boolean;
  bestListeningScore10: number;
  bestReadingScore10: number;
}

export interface VnuB3DraftStatus {
  examId: string;
  mode: VnuBac3ExamMode;
  answeredCount: number;
  writingDraftCount: number;
  updatedAt: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadVnuB3History(): VnuB3ExamAttemptRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(VNU_B3_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is VnuB3ExamAttemptRecord =>
        Boolean(item && typeof item === 'object' && typeof item.examId === 'string')
    );
  } catch {
    return [];
  }
}

export function saveVnuB3History(records: VnuB3ExamAttemptRecord[]): void {
  if (!isBrowser()) return;
  try {
    const trimmed = records.slice(0, MAX_HISTORY_RECORDS);
    window.localStorage.setItem(VNU_B3_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('[vnu-b3-history] Failed to save history:', err);
  }
}

export function recordVnuB3Attempt(params: {
  examId: string;
  examTitle: string;
  mode: VnuBac3ExamMode;
  durationSeconds: number;
  result: VnuBac3ScoreResult;
  writingDrafts?: Record<string, string>;
}): VnuB3ExamAttemptRecord {
  const { examId, examTitle, mode, durationSeconds, result, writingDrafts } = params;
  const writingCompletedCount = writingDrafts
    ? Object.values(writingDrafts).filter((txt) => typeof txt === 'string' && txt.trim().length > 0).length
    : 0;

  const record: VnuB3ExamAttemptRecord = {
    id: `vnub3_${examId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    examId,
    examTitle,
    mode,
    submittedAt: Date.now(),
    durationSeconds: Math.max(0, Math.round(durationSeconds || result.timeSpentSeconds || 0)),
    listeningRaw: result.listeningCorrect,
    listeningTotal: result.listeningTotal,
    listeningScore10: result.listeningScore,
    readingRaw: result.readingCorrect,
    readingTotal: result.readingTotal,
    readingScore10: result.readingScore,
    objectiveScore10: result.overallScore,
    passed: result.isPassed,
    statusLabel: result.statusLabel,
    writingCompletedCount,
  };

  const existing = loadVnuB3History();
  const updated = [record, ...existing].slice(0, MAX_HISTORY_RECORDS);
  saveVnuB3History(updated);
  return record;
}

export function getVnuB3ExamHistoryMap(
  records?: VnuB3ExamAttemptRecord[]
): Record<string, VnuB3ExamHistorySummary> {
  const list = records ?? loadVnuB3History();
  const map: Record<string, VnuB3ExamHistorySummary> = {};

  for (const rec of list) {
    const existing = map[rec.examId];
    if (!existing) {
      map[rec.examId] = {
        examId: rec.examId,
        examTitle: rec.examTitle,
        attemptCount: 1,
        lastAttemptAt: rec.submittedAt,
        highestScore: rec.objectiveScore10,
        lastScore: rec.objectiveScore10,
        passed: rec.passed,
        bestListeningScore10: rec.listeningScore10,
        bestReadingScore10: rec.readingScore10,
      };
    } else {
      existing.attemptCount += 1;
      if (rec.submittedAt > existing.lastAttemptAt) {
        existing.lastAttemptAt = rec.submittedAt;
        existing.lastScore = rec.objectiveScore10;
      }
      if (rec.objectiveScore10 > existing.highestScore) {
        existing.highestScore = rec.objectiveScore10;
      }
      if (rec.passed) {
        existing.passed = true;
      }
      if (rec.listeningScore10 > existing.bestListeningScore10) {
        existing.bestListeningScore10 = rec.listeningScore10;
      }
      if (rec.readingScore10 > existing.bestReadingScore10) {
        existing.bestReadingScore10 = rec.readingScore10;
      }
    }
  }

  return map;
}

export function getVnuB3DraftStatusMap(examIds: string[]): Record<string, VnuB3DraftStatus> {
  if (!isBrowser()) return {};
  const result: Record<string, VnuB3DraftStatus> = {};

  for (const examId of examIds) {
    const modes: VnuBac3ExamMode[] = ['full_simulation', 'practice'];
    for (const mode of modes) {
      try {
        const raw = window.localStorage.getItem(`${VNU_B3_DRAFT_PREFIX}${examId}_${mode}`);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') continue;

        const answersObj = parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {};
        const answeredCount = Object.values(answersObj).filter(
          (v) => typeof v === 'string' && v.trim().length > 0
        ).length;

        const writingObj =
          parsed.writingDrafts && typeof parsed.writingDrafts === 'object' ? parsed.writingDrafts : {};
        const writingDraftCount = Object.values(writingObj).filter(
          (v) => typeof v === 'string' && v.trim().length > 0
        ).length;

        if (answeredCount === 0 && writingDraftCount === 0) continue;

        const updatedAt = typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0;
        const current = result[examId];
        if (!current || updatedAt >= current.updatedAt) {
          result[examId] = {
            examId,
            mode,
            answeredCount,
            writingDraftCount,
            updatedAt,
          };
        }
      } catch {
        // Ignore malformed localStorage item
      }
    }
  }

  return result;
}
