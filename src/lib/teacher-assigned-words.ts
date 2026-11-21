import type {
  AssignedWordItem,
  AssignedWordsSummary,
} from '@/components/teacher/teacher-cache';

export interface ClassroomWordRowInput {
  id: string;
  word: string;
  translation?: string | null;
  ipa?: string | null;
  pos?: string | null;
  example?: string | null;
  created_at?: string | null;
  dictionary_data?: {
    section?: string | null;
    source?: string | null;
  } | null;
}

export interface ClassroomSrsRowInput {
  user_id?: string | null;
  word_id: string;
  review_count?: number | null;
  stability?: number | null;
  last_reviewed_at?: string | null;
}

const SRS_WORD_CHUNK_SIZE = 200;
const MASTERED_STABILITY_DAYS = 7;

function hasStartedReview(srs: {
  review_count?: number | null;
  last_reviewed_at?: string | null;
} | null | undefined): boolean {
  if (!srs) return false;
  return (srs.review_count ?? 0) > 0 || Boolean(srs.last_reviewed_at);
}

/**
 * Classifies a student's progress on a classroom-assigned vocabulary item.
 */
export function classifyAssignedWordProgress(
  srs?: ClassroomSrsRowInput | null,
): {
  status: AssignedWordItem['status'];
  reviewCount: number;
  lastReviewedAt: string | null;
  stability: number | null;
} {
  const reviewCount = typeof srs?.review_count === 'number' ? srs.review_count : 0;
  const stability = typeof srs?.stability === 'number' ? srs.stability : null;
  const lastReviewedAt = srs?.last_reviewed_at ?? null;

  if (!hasStartedReview(srs)) {
    return {
      status: 'pending',
      reviewCount: 0,
      lastReviewedAt: null,
      stability,
    };
  }

  const isMastered = reviewCount > 0 && (stability ?? 0) >= MASTERED_STABILITY_DAYS;
  return {
    status: isMastered ? 'mastered' : 'learning',
    reviewCount: Math.max(reviewCount, 1),
    lastReviewedAt,
    stability,
  };
}

/**
 * Maps classroom words and the student's SRS progress rows into teacher-facing items and summary counts.
 */
export function buildAssignedWordsOverview(
  classroomWords: ClassroomWordRowInput[],
  srsRows: ClassroomSrsRowInput[],
): { items: AssignedWordItem[]; summary: AssignedWordsSummary } {
  const srsByWordId = new Map<string, ClassroomSrsRowInput>();
  for (const row of srsRows) {
    if (row.word_id && !srsByWordId.has(row.word_id)) {
      srsByWordId.set(row.word_id, row);
    }
  }

  let learned = 0;
  let mastered = 0;
  let pending = 0;

  const items: AssignedWordItem[] = classroomWords.map((w) => {
    const progress = classifyAssignedWordProgress(srsByWordId.get(w.id));
    if (progress.status === 'pending') {
      pending += 1;
    } else {
      learned += 1;
      if (progress.status === 'mastered') {
        mastered += 1;
      }
    }

    const section = typeof w.dictionary_data?.section === 'string' && w.dictionary_data.section.trim()
      ? w.dictionary_data.section.trim()
      : undefined;
    const source = typeof w.dictionary_data?.source === 'string' && w.dictionary_data.source.trim()
      ? w.dictionary_data.source.trim()
      : undefined;

    return {
      id: w.id,
      word: w.word,
      translation: w.translation ?? undefined,
      ipa: w.ipa ?? undefined,
      pos: w.pos ?? undefined,
      example: w.example ?? undefined,
      section,
      source,
      created_at: w.created_at ?? '',
      reviewCount: progress.reviewCount,
      lastReviewedAt: progress.lastReviewedAt,
      stability: progress.stability,
      status: progress.status,
    };
  });

  return {
    items,
    summary: {
      total: items.length,
      learned,
      mastered,
      pending,
    },
  };
}

/**
 * Counts how many distinct classroom words each student has started learning or reviewing.
 */
export function countLearnedClassroomWordsByStudent(
  classroomWordIds: string[],
  srsRows: ClassroomSrsRowInput[],
): Map<string, number> {
  const validWordIds = new Set(classroomWordIds);
  const learnedByStudent = new Map<string, Set<string>>();

  for (const row of srsRows) {
    if (!row.user_id || !row.word_id || !validWordIds.has(row.word_id)) continue;
    if (!hasStartedReview(row)) continue;

    let set = learnedByStudent.get(row.user_id);
    if (!set) {
      set = new Set<string>();
      learnedByStudent.set(row.user_id, set);
    }
    set.add(row.word_id);
  }

  const counts = new Map<string, number>();
  for (const [studentId, wordSet] of learnedByStudent) {
    counts.set(studentId, wordSet.size);
  }
  return counts;
}

/**
 * Fetches SRS progress rows for a classroom's words across one or more students in bounded chunks.
 */
export async function fetchClassroomSrsRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  classroomWordIds: string[],
  studentIds: string[],
): Promise<ClassroomSrsRowInput[]> {
  if (classroomWordIds.length === 0 || studentIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < classroomWordIds.length; i += SRS_WORD_CHUNK_SIZE) {
    chunks.push(classroomWordIds.slice(i, i + SRS_WORD_CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      supabase
        .from('srs_progress')
        .select('user_id, word_id, review_count, stability, last_reviewed_at')
        .in('word_id', chunk)
        .in('user_id', studentIds),
    ),
  );

  const rows: ClassroomSrsRowInput[] = [];
  for (const res of results) {
    if (res.data && Array.isArray(res.data)) {
      rows.push(...(res.data as ClassroomSrsRowInput[]));
    }
  }
  return rows;
}
