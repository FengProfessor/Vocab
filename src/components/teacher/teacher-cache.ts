import { authFetch } from '@/lib/auth-fetch';
import type { StudentProgress } from '@/lib/supabase';

export interface HistoryPoint {
  recorded_at: string;
  vms: number;
  lcs: number;
}

export interface QuizPoint {
  completed_at: string;
  score: number;
  total_questions: number;
  accuracy: number;
}

export interface StudentDetailPayload {
  success: boolean;
  current: StudentProgress;
  history: HistoryPoint[];
  quizzes: QuizPoint[];
}

export interface StudentErrorItem {
  wordId: string;
  word: string;
  translation?: string;
  pos?: string;
  example?: string;
  difficulty?: number;
  stability?: number;
  reviewCount: number;
  lastReviewedAt?: string | null;
  nextReviewDate: string;
}

const MAX_CACHE_ENTRIES = 120;

function enforceLimit<K, V>(map: Map<K, V>, max: number) {
  if (map.size >= max) {
    const firstKey = map.keys().next().value;
    if (firstKey !== undefined) map.delete(firstKey);
  }
}

const detailCache = new Map<string, StudentDetailPayload>();
const errorsCache = new Map<string, StudentErrorItem[]>();
const aiInsightCache = new Map<string, string>();
const inFlightRequests = new Set<string>();

function makeKey(studentId: string, classroomId: string): string {
  return `${classroomId}:${studentId}`;
}

export function getCachedStudentDetail(studentId: string, classroomId: string): StudentDetailPayload | undefined {
  return detailCache.get(makeKey(studentId, classroomId));
}

export function setCachedStudentDetail(studentId: string, classroomId: string, data: StudentDetailPayload): void {
  enforceLimit(detailCache, MAX_CACHE_ENTRIES);
  detailCache.set(makeKey(studentId, classroomId), data);
}

export function getCachedStudentErrors(studentId: string, classroomId: string): StudentErrorItem[] | undefined {
  return errorsCache.get(makeKey(studentId, classroomId));
}

export function setCachedStudentErrors(studentId: string, classroomId: string, data: StudentErrorItem[]): void {
  enforceLimit(errorsCache, MAX_CACHE_ENTRIES);
  errorsCache.set(makeKey(studentId, classroomId), data);
}

export function getCachedAiInsight(studentId: string): string | undefined {
  return aiInsightCache.get(studentId);
}

export function setCachedAiInsight(studentId: string, text: string): void {
  enforceLimit(aiInsightCache, MAX_CACHE_ENTRIES);
  aiInsightCache.set(studentId, text);
}

/**
 * Prefetches student detail and errors in the background so navigating via keyboard
 * or clicking a student renders instantly.
 */
export async function prefetchStudent(studentId: string, classroomId: string): Promise<void> {
  const key = makeKey(studentId, classroomId);
  if (detailCache.has(key) || inFlightRequests.has(key)) return;

  inFlightRequests.add(key);
  try {
    const detailPromise = authFetch(`/api/teacher/student-detail?studentId=${studentId}&classroomId=${classroomId}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json() as StudentDetailPayload;
        if (data.success && data.current) {
          detailCache.set(key, data);
        }
      })
      .catch(() => {});

    const errorsPromise = authFetch(`/api/teacher/student-errors?studentId=${studentId}&classroomId=${classroomId}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json() as { success: boolean; data: StudentErrorItem[] };
        if (data.success && Array.isArray(data.data)) {
          errorsCache.set(key, data.data);
        }
      })
      .catch(() => {});

    await Promise.allSettled([detailPromise, errorsPromise]);
  } finally {
    inFlightRequests.delete(key);
  }
}
