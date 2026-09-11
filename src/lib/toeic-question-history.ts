'use client';

/**
 * TOEIC Question History Tracker & Cloud Synchronization Protocol
 * File: src/lib/toeic-question-history.ts
 *
 * Client-authoritative, offline-first question attempt history tracking with:
 * - LocalStorage state management (lingo_toeic_question_history)
 * - Reactive CustomEvent event bus (lingo_toeic_history_updated)
 * - Part practice progress statistics & anti-duplication queries
 * - Opportunistic bidirectional synchronization with Supabase (user_toeic_question_history)
 * - Offline sync queue & Last-Write-Wins (LWW) reconciliation
 */

import { supabase } from '@/lib/supabase';

// ── 1. Storage Keys & Constants ──────────────────────────────────────────────

export const TOEIC_QUESTION_HISTORY_STORAGE_KEY = 'lingo_toeic_question_history';
export const TOEIC_HISTORY_SYNC_QUEUE_KEY = 'lingo_toeic_history_sync_queue';
export const TOEIC_HISTORY_UPDATED_EVENT = 'lingo_toeic_history_updated';
export const TOEIC_HISTORY_STORAGE_VERSION = 1;
export const TOEIC_HISTORY_VERSION = 1;
export const SYNC_BATCH_CHUNK_SIZE = 100;

/**
 * Canonical bank totals per Part verified from catalog index (src/data/toeic/toeic-catalog-index.json).
 * 231 practice sets across 7 Parts, total 7,549 questions.
 */
export const TOEIC_PART_BANK_TOTALS: Record<number, number> = {
  1: 210,   // 35 sets x 6 questions = 210
  2: 1543,  // 29 sets = 1,543
  3: 858,   // 22 sets x 39 questions = 858
  4: 1407,  // 23 sets = 1,407
  5: 720,   // 24 sets x 30 questions = 720
  6: 384,   // 24 sets x 16 questions = 384
  7: 2427,  // 74 sets = 2,427
};

export const TOEIC_TOTAL_BANK_QUESTIONS = 7549;

// ── 2. Data Types & Interfaces ───────────────────────────────────────────────

export interface ToeicQuestionHistoryRecord {
  /** Unique question identifier, e.g. q-estudyme-p5-set1-1 or q-6852-101 */
  questionId: string;
  /** TOEIC Part number (1 to 7) */
  part: number;
  /** ISO 8601 string of the most recent answer timestamp */
  lastAnsweredAt: string;
  /** Whether the most recent attempt was correct */
  isCorrect: boolean;
  /** Total number of attempts on this question (>= 1) */
  attemptCount: number;
  /** Selected option letter on latest attempt ('A' | 'B' | 'C' | 'D' | '') */
  selectedOption: string;
}

export interface ToeicQuestionHistoryStorage {
  /** Schema version, currently 1 */
  version: number;
  /** ISO 8601 string when storage was last modified */
  updatedAt: string;
  /** Map of questionId -> ToeicQuestionHistoryRecord for O(1) lookups */
  records: Record<string, ToeicQuestionHistoryRecord>;
}

export interface PartProgressStats {
  /** TOEIC Part (1 to 7) */
  part: number;
  /** Number of unique questions answered at least once in this part */
  completedCount: number;
  /** Total available questions in catalog bank for this part */
  totalQuestions: number;
  /** Completion percentage (0 to 100) */
  percentage: number;
  /** Number of questions currently flagged as incorrect on their latest attempt */
  mistakeCount: number;
  /** Remaining unseen questions: Math.max(0, totalQuestions - completedCount) */
  unseenCount: number;

  // Compatibility & supplemental analytics aliases
  /** Alias for completedCount */
  totalAnswered: number;
  /** Alias for mistakeCount */
  totalMistakes: number;
  /** Number of questions answered correctly on their latest attempt */
  totalCorrect: number;
  /** Alias for totalQuestions */
  totalInBank: number;
  /** Alias for percentage */
  completionPercentage: number;
  /** Accuracy percentage (0 to 100) */
  accuracyPercentage: number;
}

export interface QuestionAnswerInput {
  questionId: string;
  part: number;
  selectedOption: string;
  isCorrect: boolean;
  answeredAt?: string;
}

export type QuestionAnswerRecord = QuestionAnswerInput;

export interface ToeicHistoryUpdatedEventDetail {
  part?: number;
  affectedParts?: number[];
  questionIds: string[];
  source: 'local_record' | 'supabase_sync' | 'reconciliation' | 'reset';
  timestamp: string;
}

// ── 3. Internal Safe Storage Helpers (SSR Safe) ──────────────────────────────

function createDefaultStorage(): ToeicQuestionHistoryStorage {
  return {
    version: TOEIC_HISTORY_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
    records: {},
  };
}

/**
 * Reads question history envelope from LocalStorage with SSR guarding and error resilience.
 */
export function loadToeicQuestionHistory(): ToeicQuestionHistoryStorage {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return createDefaultStorage();
  }

  try {
    const raw = localStorage.getItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY);
    if (!raw) return createDefaultStorage();

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // Versioned envelope format
      if (parsed.records && typeof parsed.records === 'object') {
        return {
          version: typeof parsed.version === 'number' ? parsed.version : TOEIC_HISTORY_STORAGE_VERSION,
          updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
          records: parsed.records as Record<string, ToeicQuestionHistoryRecord>,
        };
      }

      // Backward compatibility: If stored as an unversioned dictionary map { [id]: record }
      const isRecordMap = Object.values(parsed).some(
        (v) => v && typeof v === 'object' && ('part' in v || 'isCorrect' in v)
      );
      if (isRecordMap) {
        return {
          version: TOEIC_HISTORY_STORAGE_VERSION,
          updatedAt: new Date().toISOString(),
          records: parsed as Record<string, ToeicQuestionHistoryRecord>,
        };
      }
    }
  } catch (err) {
    console.warn('[ToeicHistory] Failed to read from localStorage:', err);
  }

  return createDefaultStorage();
}

/**
 * Persists question history envelope to LocalStorage with quota protection.
 */
export function saveToeicQuestionHistory(storage: ToeicQuestionHistoryStorage): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  try {
    storage.updatedAt = new Date().toISOString();
    localStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, JSON.stringify(storage));
  } catch (err) {
    console.warn('[ToeicHistory] Failed to save to localStorage:', err);
  }
}

// Aliases for storage functions
export const getStoredQuestionHistory = loadToeicQuestionHistory;
export const saveStoredQuestionHistory = saveToeicQuestionHistory;
export const getQuestionHistory = loadToeicQuestionHistory;

/**
 * Dispatches CustomEvent on window for reactive cross-component synchronization.
 */
export function notifyHistoryUpdated(detail: Omit<ToeicHistoryUpdatedEventDetail, 'timestamp'>): void {
  if (typeof window === 'undefined' || typeof (window as any).dispatchEvent !== 'function') {
    return;
  }

  try {
    const payload: ToeicHistoryUpdatedEventDetail = {
      ...detail,
      timestamp: new Date().toISOString(),
    };

    const event =
      typeof CustomEvent === 'function'
        ? new CustomEvent(TOEIC_HISTORY_UPDATED_EVENT, { detail: payload })
        : ({
            type: TOEIC_HISTORY_UPDATED_EVENT,
            detail: payload,
          } as any);

    (window as any).dispatchEvent(event);
  } catch (err) {
    console.warn('[ToeicHistory] Failed to dispatch history event:', err);
  }
}

// ── 4. Public Core API Methods ────────────────────────────────────────────────

/**
 * Record a batch of question answers after exam completion or practice session.
 * Updates LocalStorage synchronously, dispatches reactive DOM event, and triggers
 * opportunistic remote sync to Supabase.
 */
export function recordQuestionAnswers(results: QuestionAnswerInput[]): void {
  if (!Array.isArray(results) || results.length === 0) return;

  const storage = loadToeicQuestionHistory();
  const now = new Date().toISOString();
  const affectedParts = new Set<number>();
  const recordedIds: string[] = [];

  for (const item of results) {
    if (!item || !item.questionId || typeof item.questionId !== 'string') {
      continue;
    }

    const cleanId = item.questionId.trim();
    if (!cleanId) continue;

    const partNum = Math.min(7, Math.max(1, Math.floor(Number(item.part) || 1)));
    const existing = storage.records[cleanId];
    const attemptCount = existing ? (existing.attemptCount || 0) + 1 : 1;
    const answeredAt =
      item.answeredAt && !isNaN(Date.parse(item.answeredAt)) ? item.answeredAt : now;

    storage.records[cleanId] = {
      questionId: cleanId,
      part: partNum,
      lastAnsweredAt: answeredAt,
      isCorrect: Boolean(item.isCorrect),
      attemptCount,
      selectedOption: (item.selectedOption || '').trim().toUpperCase(),
    };

    affectedParts.add(partNum);
    recordedIds.push(cleanId);
  }

  if (recordedIds.length === 0) return;

  saveToeicQuestionHistory(storage);

  const partsArray = Array.from(affectedParts).sort((a, b) => a - b);
  notifyHistoryUpdated({
    part: partsArray.length === 1 ? partsArray[0] : undefined,
    affectedParts: partsArray,
    questionIds: recordedIds,
    source: 'local_record',
  });

  // Opportunistic background sync to Supabase
  if (typeof window !== 'undefined') {
    void syncQuestionHistoryToSupabase(results);
  }
}

/**
 * Retrieve all history records for a specific TOEIC Part (1 to 7).
 * Deterministically sorted by most recent attempt first.
 */
export function getQuestionHistoryByPart(part: number): ToeicQuestionHistoryRecord[] {
  if (!part || part < 1 || part > 7) return [];

  const storage = loadToeicQuestionHistory();
  const matched: ToeicQuestionHistoryRecord[] = [];

  for (const id in storage.records) {
    const record = storage.records[id];
    if (record && record.part === part) {
      matched.push(record);
    }
  }

  return matched.sort(
    (a, b) => new Date(b.lastAnsweredAt).getTime() - new Date(a.lastAnsweredAt).getTime()
  );
}

/**
 * Retrieve question IDs that have been answered at least once.
 * @param part Optional part filter (1..7). If omitted, returns all answered IDs.
 */
export function getAnsweredQuestionIds(part?: number): string[] {
  const storage = loadToeicQuestionHistory();
  const answeredIds: string[] = [];

  for (const id in storage.records) {
    const record = storage.records[id];
    if (record && record.attemptCount > 0) {
      if (part === undefined || record.part === part) {
        answeredIds.push(record.questionId);
      }
    }
  }

  return answeredIds;
}

/**
 * Retrieve question IDs answered incorrectly on their most recent attempt.
 * @param part Optional part filter (1..7). If omitted, returns all mistake IDs.
 */
export function getMistakeQuestionIds(part?: number): string[] {
  const storage = loadToeicQuestionHistory();
  const mistakeIds: string[] = [];

  for (const id in storage.records) {
    const record = storage.records[id];
    if (record && !record.isCorrect && record.attemptCount > 0) {
      if (part === undefined || record.part === part) {
        mistakeIds.push(record.questionId);
      }
    }
  }

  return mistakeIds;
}

/**
 * Retrieve question IDs answered correctly on their most recent attempt.
 * @param part Optional part filter (1..7). If omitted, returns all correct IDs.
 */
export function getCorrectQuestionIds(part?: number): string[] {
  const storage = loadToeicQuestionHistory();
  const correctIds: string[] = [];

  for (const id in storage.records) {
    const record = storage.records[id];
    if (record && record.isCorrect && record.attemptCount > 0) {
      if (part === undefined || record.part === part) {
        correctIds.push(record.questionId);
      }
    }
  }

  return correctIds;
}

/**
 * Compute real-time progress statistics for Part Practice UI.
 * Single-pass O(N) aggregation over local history records.
 *
 * @param part Part number (1 to 7)
 * @param totalQuestionsInBank Optional total in bank. If omitted or <= 0, defaults to TOEIC_PART_BANK_TOTALS[part].
 */
export function getPartProgressStats(
  part: number,
  totalQuestionsInBank?: number
): PartProgressStats {
  const safePart = Math.min(7, Math.max(1, Math.floor(Number(part) || 1)));

  let totalQuestions =
    typeof totalQuestionsInBank === 'number' && totalQuestionsInBank > 0
      ? Math.floor(totalQuestionsInBank)
      : TOEIC_PART_BANK_TOTALS[safePart] || 0;

  if (totalQuestions < 0) {
    totalQuestions = 0;
  }

  const storage = loadToeicQuestionHistory();
  let completedCount = 0;
  let mistakeCount = 0;
  let totalCorrect = 0;

  for (const id in storage.records) {
    const record = storage.records[id];
    if (record && record.part === safePart && record.attemptCount > 0) {
      completedCount++;
      if (record.isCorrect) {
        totalCorrect++;
      } else {
        mistakeCount++;
      }
    }
  }

  const percentage =
    totalQuestions > 0
      ? Math.min(100, Math.max(0, Math.round((completedCount / totalQuestions) * 100)))
      : 0;

  const unseenCount = Math.max(0, totalQuestions - completedCount);
  const accuracyPercentage =
    completedCount > 0 ? Math.round((totalCorrect / completedCount) * 100) : 0;

  return {
    part: safePart,
    completedCount,
    totalQuestions,
    percentage,
    mistakeCount,
    unseenCount,

    // Aliases
    totalAnswered: completedCount,
    totalMistakes: mistakeCount,
    totalCorrect,
    totalInBank: totalQuestions,
    completionPercentage: percentage,
    accuracyPercentage,
  };
}

/**
 * Reset progress: removes history records for a specific Part, or for all parts if omitted.
 * Dispatches lingo_toeic_history_updated with source='reset' and deletes remote records.
 */
export function resetPartProgress(part?: number): void {
  const storage = loadToeicQuestionHistory();
  const deletedIds: string[] = [];
  const isSpecificPart = typeof part === 'number' && part >= 1 && part <= 7;
  const affectedParts: number[] = isSpecificPart ? [part] : [1, 2, 3, 4, 5, 6, 7];

  if (isSpecificPart) {
    for (const id in storage.records) {
      const record = storage.records[id];
      if (record && record.part === part) {
        deletedIds.push(id);
        delete storage.records[id];
      }
    }
  } else {
    for (const id in storage.records) {
      deletedIds.push(id);
    }
    storage.records = {};
  }

  storage.updatedAt = new Date().toISOString();
  saveToeicQuestionHistory(storage);

  notifyHistoryUpdated({
    part: isSpecificPart ? part : undefined,
    affectedParts,
    questionIds: deletedIds,
    source: 'reset',
  });

  // Propagate deletion to remote Supabase database
  if (typeof window !== 'undefined') {
    void deleteRemotePartProgress(part);
  }
}

// ── 5. Supabase Remote Synchronization Layer ─────────────────────────────────

/**
 * Opportunistic background batch upsert to Supabase user_toeic_question_history.
 * Runs silently in background; queues locally on network failure.
 */
export async function syncQuestionHistoryToSupabase(
  records: QuestionAnswerInput[] | ToeicQuestionHistoryRecord[]
): Promise<void> {
  if (typeof window === 'undefined' || !records || records.length === 0) return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      // Guest mode: gracefully remain in localStorage only
      return;
    }

    const userId = session.user.id;

    for (let i = 0; i < records.length; i += SYNC_BATCH_CHUNK_SIZE) {
      const chunk = records.slice(i, i + SYNC_BATCH_CHUNK_SIZE);
      const rows = chunk.map((r) => {
        const lastAnswered =
          ('lastAnsweredAt' in r ? r.lastAnsweredAt : r.answeredAt) || new Date().toISOString();
        const attemptCount = ('attemptCount' in r ? r.attemptCount : 1) || 1;

        return {
          user_id: userId,
          question_id: r.questionId.trim(),
          part: Number(r.part) || 1,
          last_answered_at: lastAnswered,
          is_correct: Boolean(r.isCorrect),
          attempt_count: attemptCount,
          selected_option: (r.selectedOption || '').trim().toUpperCase(),
        };
      });

      const { error } = await supabase
        .from('user_toeic_question_history')
        .upsert(rows, { onConflict: 'user_id,question_id' });

      if (error) {
        console.warn('[ToeicHistory] Supabase upsert error:', error.message);
        enqueueFailedSync(chunk);
        return;
      }
    }
  } catch (err) {
    console.warn('[ToeicHistory] Network error during Supabase sync:', err);
    enqueueFailedSync(records);
  }
}

// Alias for sync
export const syncAnswersToSupabase = syncQuestionHistoryToSupabase;

/**
 * Bidirectional reconciliation between LocalStorage and Supabase.
 * Applies Last-Write-Wins (LWW) by timestamp and Math.max for attemptCount.
 */
export async function reconcileQuestionHistoryOnLogin(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const userId = session.user.id;

    // Fetch remote records for user
    const { data: remoteRows, error } = await supabase
      .from('user_toeic_question_history')
      .select('question_id, part, last_answered_at, is_correct, attempt_count, selected_option')
      .eq('user_id', userId);

    if (error || !remoteRows) {
      console.warn('[ToeicHistory] Failed to fetch remote history:', error?.message);
      return;
    }

    const storage = loadToeicQuestionHistory();
    let hasLocalUpdates = false;
    const recordsToPushToRemote: ToeicQuestionHistoryRecord[] = [];
    const remoteMap = new Map(remoteRows.map((r) => [r.question_id, r]));

    // 1. Process remote records into local
    for (const r of remoteRows) {
      const local = storage.records[r.question_id];
      if (!local) {
        storage.records[r.question_id] = {
          questionId: r.question_id,
          part: r.part,
          lastAnsweredAt: r.last_answered_at,
          isCorrect: Boolean(r.is_correct),
          attemptCount: r.attempt_count || 1,
          selectedOption: r.selected_option || '',
        };
        hasLocalUpdates = true;
      } else {
        const localTime = new Date(local.lastAnsweredAt).getTime();
        const remoteTime = new Date(r.last_answered_at).getTime();
        const mergedAttemptCount = Math.max(local.attemptCount || 1, r.attempt_count || 1);

        if (remoteTime > localTime) {
          storage.records[r.question_id] = {
            questionId: r.question_id,
            part: r.part,
            lastAnsweredAt: r.last_answered_at,
            isCorrect: Boolean(r.is_correct),
            attemptCount: mergedAttemptCount,
            selectedOption: r.selected_option || '',
          };
          hasLocalUpdates = true;

          if (mergedAttemptCount > (r.attempt_count || 1)) {
            recordsToPushToRemote.push(storage.records[r.question_id]);
          }
        } else {
          if (local.attemptCount !== mergedAttemptCount) {
            local.attemptCount = mergedAttemptCount;
            hasLocalUpdates = true;
          }

          if (localTime > remoteTime || mergedAttemptCount > (r.attempt_count || 1)) {
            recordsToPushToRemote.push(local);
          }
        }
      }
    }

    // 2. Identify local records absent on remote (answered as guest or offline)
    for (const [qId, local] of Object.entries(storage.records)) {
      if (!remoteMap.has(qId)) {
        recordsToPushToRemote.push(local);
      }
    }

    if (hasLocalUpdates) {
      saveToeicQuestionHistory(storage);
      notifyHistoryUpdated({
        questionIds: [],
        source: 'reconciliation',
      });
    }

    if (recordsToPushToRemote.length > 0) {
      await syncQuestionHistoryToSupabase(recordsToPushToRemote);
    }

    // Flush any pending items from offline queue
    await flushOfflineSyncQueue();
  } catch (err) {
    console.warn('[ToeicHistory] Failed reconciliation:', err);
  }
}

// Alias for reconciliation
export const reconcileToeicQuestionHistory = reconcileQuestionHistoryOnLogin;

/**
 * Delete records from Supabase on Part Reset.
 */
export async function deleteRemotePartProgress(part?: number): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    let query = supabase.from('user_toeic_question_history').delete().eq('user_id', session.user.id);
    if (part !== undefined && part >= 1 && part <= 7) {
      query = query.eq('part', part);
    }

    const { error } = await query;
    if (error) {
      console.warn('[ToeicHistory] Supabase delete error:', error.message);
    }
  } catch (err) {
    console.warn('[ToeicHistory] Network error during Supabase delete:', err);
  }
}

// Alias for delete
export const deletePartHistoryFromSupabase = deleteRemotePartProgress;

// ── 6. Offline Queue & Network Event Resilience ──────────────────────────────

function enqueueFailedSync(
  items: QuestionAnswerInput[] | ToeicQuestionHistoryRecord[]
): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(TOEIC_HISTORY_SYNC_QUEUE_KEY);
    const queue: QuestionAnswerInput[] = raw ? JSON.parse(raw) : [];

    for (const item of items) {
      const answeredAt =
        ('lastAnsweredAt' in item ? item.lastAnsweredAt : item.answeredAt) ||
        new Date().toISOString();
      queue.push({
        questionId: item.questionId,
        part: item.part,
        selectedOption: item.selectedOption,
        isCorrect: item.isCorrect,
        answeredAt,
      });
    }

    // Keep maximum 500 items to avoid quota issues
    localStorage.setItem(TOEIC_HISTORY_SYNC_QUEUE_KEY, JSON.stringify(queue.slice(-500)));
  } catch {}
}

export function dequeueFailedSync(): QuestionAnswerInput[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TOEIC_HISTORY_SYNC_QUEUE_KEY);
    if (!raw) return [];
    localStorage.removeItem(TOEIC_HISTORY_SYNC_QUEUE_KEY);
    return JSON.parse(raw) as QuestionAnswerInput[];
  } catch {
    return [];
  }
}

export async function flushOfflineSyncQueue(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const queued = dequeueFailedSync();
    if (queued && queued.length > 0) {
      await syncQuestionHistoryToSupabase(queued);
    }
  } catch {}
}

// Setup browser online listener once if on client
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('online', () => {
      void flushOfflineSyncQueue();
      void reconcileQuestionHistoryOnLogin();
    });
  } catch {}
}
