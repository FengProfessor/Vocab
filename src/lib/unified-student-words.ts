export interface UnifiedWordSummaryCounts {
  total: number;
  dueCount: number;
  newCount: number;
  reviewDueCount: number;
  levelCounts: number[];
}

const LEVEL_BUCKET_COUNT = 6;

function toSafeCount(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function parseTimestampMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Cộng gộp bộ đếm summary từ nhiều lớp (kho cá nhân + các lớp đang theo học)
 * thành một kho thống nhất cho học sinh.
 */
export function aggregateWordSummaries(
  summaries: UnifiedWordSummaryCounts[],
): UnifiedWordSummaryCounts {
  const levelCounts = Array.from({ length: LEVEL_BUCKET_COUNT }, () => 0);
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return {
      total: 0,
      dueCount: 0,
      newCount: 0,
      reviewDueCount: 0,
      levelCounts,
    };
  }

  let total = 0;
  let dueCount = 0;
  let newCount = 0;
  let reviewDueCount = 0;

  for (const s of summaries) {
    if (!s) continue;
    total += toSafeCount(s.total);
    dueCount += toSafeCount(s.dueCount);
    newCount += toSafeCount(s.newCount);
    reviewDueCount += toSafeCount(s.reviewDueCount);
    if (Array.isArray(s.levelCounts)) {
      for (let i = 0; i < LEVEL_BUCKET_COUNT; i += 1) {
        levelCounts[i] += toSafeCount(s.levelCounts[i]);
      }
    }
  }

  return {
    total,
    dueCount,
    newCount,
    reviewDueCount,
    levelCounts,
  };
}

function getNewWordCandidatePriority(
  item: {
    classroom_id?: string | null;
    created_at?: string | null;
    source?: string;
  },
  personalClassroomId: string | null,
): { isTeacherImport: number; isEnrolledClass: number; createdMs: number } {
  const isTeacherImport = item.source === 'teacher_import' ? 1 : 0;
  const isEnrolledClass =
    Boolean(item.classroom_id) && item.classroom_id !== personalClassroomId ? 1 : 0;
  const createdMs = parseTimestampMs(item.created_at);
  return { isTeacherImport, isEnrolledClass, createdMs };
}

function shouldReplaceCandidate<
  T extends {
    classroom_id?: string | null;
    created_at?: string | null;
    source?: string;
  },
>(existing: T, incoming: T, personalClassroomId: string | null): boolean {
  const a = getNewWordCandidatePriority(incoming, personalClassroomId);
  const b = getNewWordCandidatePriority(existing, personalClassroomId);
  if (a.isTeacherImport !== b.isTeacherImport) {
    return a.isTeacherImport > b.isTeacherImport;
  }
  if (a.isEnrolledClass !== b.isEnrolledClass) {
    return a.isEnrolledClass > b.isEnrolledClass;
  }
  if (a.createdMs !== b.createdMs) {
    return a.createdMs > b.createdMs;
  }
  return false;
}

/**
 * Gộp và khử trùng danh sách từ mới từ kho cá nhân và các lớp đang học.
 * Khi trùng từ, ưu tiên bản do giáo viên giao (`source === 'teacher_import'`)
 * rồi đến từ thuộc lớp học, sau đó là bản mới hơn. Kết quả sắp xếp theo
 * `created_at` giảm dần (bảo toàn thứ tự bài giáo viên giao) và giới hạn theo `limit`.
 */
export function mergeAndDedupeNewWords<
  T extends {
    id: string;
    word: string;
    classroom_id?: string | null;
    created_at?: string | null;
    source?: string;
  },
>(items: T[], personalClassroomId: string | null, limit: number): T[] {
  const safeLimit = Math.max(0, Math.floor(limit));
  if (!Array.isArray(items) || items.length === 0 || safeLimit === 0) {
    return [];
  }

  const dedupedByWord = new Map<string, { item: T; firstSeenIndex: number }>();

  items.forEach((item, index) => {
    if (!item || typeof item.word !== 'string') return;
    const key = item.word.trim().toLowerCase();
    if (!key) return;

    const existing = dedupedByWord.get(key);
    if (!existing) {
      dedupedByWord.set(key, { item, firstSeenIndex: index });
      return;
    }

    if (shouldReplaceCandidate(existing.item, item, personalClassroomId)) {
      dedupedByWord.set(key, { item, firstSeenIndex: existing.firstSeenIndex });
    }
  });

  const sorted = Array.from(dedupedByWord.values())
    .sort((a, b) => {
      const timeDiff =
        parseTimestampMs(b.item.created_at) - parseTimestampMs(a.item.created_at);
      if (timeDiff !== 0) return timeDiff;
      return a.firstSeenIndex - b.firstSeenIndex;
    })
    .map((entry) => entry.item);

  return sorted.slice(0, safeLimit);
}
