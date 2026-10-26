/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Maps numeric FSRS review quality (1-5) or string labels into the .NET 10 `ReviewQuality` enum name.
 */
export function mapQualityToEnum(quality: unknown): 'Again' | 'Hard' | 'Good' | 'Easy' {
  if (typeof quality === 'string') {
    const normalized = quality.trim().toLowerCase();
    if (normalized === 'again') return 'Again';
    if (normalized === 'hard') return 'Hard';
    if (normalized === 'good') return 'Good';
    if (normalized === 'easy') return 'Easy';
  }
  const n = Number(quality);
  if (Number.isNaN(n) || n <= 1) return 'Again';
  if (n === 2 || n === 3) return 'Hard';
  if (n === 4) return 'Good';
  return 'Easy';
}

export interface MappedVocabWordItem {
  id: string;
  classroom_id: string;
  word: string;
  ipa: string;
  translation: string;
  pos: string;
  image_url: string;
  example: string;
  example_vi: string;
  created_at: string;
  isDue: boolean;
  srsLevel: number;
  reviewCount: number;
  mastery: number;
  srs: {
    id: string;
    user_id: string;
    word_id: string;
    stability: number;
    difficulty: number;
    interval_days: number;
    next_review_date: string;
    last_reviewed_at?: string;
    review_count: number;
    ease_factor: number;
  };
  [key: string]: any;
}

/**
 * Adapts the `.NET 10` `VocabAnalyticsDto` payload into the word list + FSRS breakdown shape
 * consumed by student, flashcard, review, and library views.
 */
export function mapVocabAnalyticsToWordsPayload(
  dto: Record<string, any> | null | undefined,
  ok = true,
  nowMs = Date.now(),
) {
  const safeDto = dto || {};
  const rawWords = Array.isArray(safeDto.words) ? safeDto.words : [];

  const words: MappedVocabWordItem[] = rawWords.map((d: Record<string, any>) => {
    const reviewCount = Number(d.reviewCount ?? d.review_count ?? 0);
    const nextReviewStr = d.nextReviewDate || d.next_review_date || null;
    const isDue =
      reviewCount === 0 ||
      !nextReviewStr ||
      new Date(nextReviewStr).getTime() <= nowMs;
    const srsLevel = Number(d.srsLevel ?? 1);
    return {
      id: String(d.id ?? ''),
      classroom_id: String(d.classroomId || d.classroom_id || safeDto.classroomId || ''),
      word: String(d.word || d.term || ''),
      ipa: d.ipa || null,
      translation: String(d.translation || ''),
      pos: d.pos || d.partOfSpeech || null,
      image_url: d.imageUrl || d.image_url || null,
      example: d.example || d.exampleSentence || null,
      example_vi: d.exampleVi || d.exampleTranslation || d.example_vi || null,
      created_at: String(d.createdAt || d.created_at || new Date(nowMs).toISOString()),
      isDue,
      srsLevel,
      reviewCount,
      mastery: Math.min(100, Math.round((srsLevel / 6) * 100)),
      srs: {
        id: String(d.id ?? ''),
        user_id: '',
        word_id: String(d.id ?? ''),
        stability: Number(d.stability ?? 0),
        difficulty: Number(d.difficulty ?? 5),
        interval_days: Number(d.intervalDays ?? 0),
        next_review_date: String(nextReviewStr ?? new Date(nowMs).toISOString()),
        last_reviewed_at: d.lastReviewedAt || d.last_reviewed_at || undefined,
        review_count: reviewCount,
        ease_factor: 2.5,
      },
    };
  });

  const levelCounts: number[] =
    Array.isArray(safeDto.levelCounts) && safeDto.levelCounts.length === 6
      ? safeDto.levelCounts.map((n: unknown) => Number(n) || 0)
      : [0, 0, 0, 0, 0, 0];

  const total = Number(safeDto.total ?? words.length);

  return {
    success: ok,
    classroomId: safeDto.classroomId ?? null,
    total,
    totalWords: total,
    newCount: Number(safeDto.newCount ?? 0),
    reviewDueCount: Number(safeDto.reviewDueCount ?? 0),
    dueCount: Number(safeDto.dueCount ?? 0),
    grammarDueCount: Number(safeDto.grammarDueCount ?? 0),
    levelCounts,
    avgStabilityDays: Number(safeDto.avgStabilityDays ?? 0),
    retentionRatePercent: Number(safeDto.retentionRatePercent ?? 0),
    skillScores: safeDto.skillScores ?? null,
    weakWords: Array.isArray(safeDto.weakWords) ? safeDto.weakWords : [],
    data: words,
    words,
  } as Record<string, any> & {
    success: boolean;
    classroomId: any;
    total: number;
    totalWords: number;
    newCount: number;
    reviewDueCount: number;
    dueCount: number;
    grammarDueCount: number;
    levelCounts: number[];
    avgStabilityDays: number;
    retentionRatePercent: number;
    skillScores: any;
    weakWords: any[];
    data: MappedVocabWordItem[];
    words: MappedVocabWordItem[];
  };
}

/**
 * Adapts the `.NET 10` `VocabAnalyticsDto` payload into the student dashboard stats shape.
 */
export function mapVocabAnalyticsToStudentStats(
  dto: Record<string, any> | null | undefined,
  isLite = false,
  ok = true,
) {
  const safeDto = dto || {};
  const lc: number[] =
    Array.isArray(safeDto.levelCounts) && safeDto.levelCounts.length === 6
      ? safeDto.levelCounts.map((n: unknown) => Number(n) || 0)
      : [0, 0, 0, 0, 0, 0];
  const totalWords = Number(safeDto.total ?? lc.reduce((a, b) => a + b, 0));
  const newCount = Number(safeDto.newCount ?? 0);
  const reviewDueCount = Number(safeDto.reviewDueCount ?? 0);
  const dueCount = Number(safeDto.dueCount ?? newCount + reviewDueCount);
  const reviewedWords = Math.max(0, totalWords - newCount);

  const statsData: Record<string, any> & {
    lite: boolean;
    totalWords: number;
    reviewedWords: number;
    dueCount: number;
    newCount: number;
    reviewDueCount: number;
    grammarDueCount: number;
    studyStreak: number;
    longestStreak: number;
    totalXp: number;
    todayXp: number;
    dailyGoal: number;
    todayWords: number;
    todayNewWords: number;
    todayReviewWords: number;
    avgStability: number;
    retentionRate: number;
    wordBreakdown: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
      level6: number;
      l1: number;
      l2: number;
      l3: number;
      l4: number;
      l5: number;
      l6: number;
      total: number;
    };
    skillScores: any;
    dailyActivity: any[];
    quizHistory: any[];
    weakWords: any[];
  } = {
    lite: isLite,
    totalWords,
    reviewedWords,
    dueCount,
    newCount,
    reviewDueCount,
    grammarDueCount: Number(safeDto.grammarDueCount ?? 0),
    studyStreak: Number(safeDto.studyStreak ?? 0),
    longestStreak: Number(safeDto.longestStreak ?? 0),
    totalXp: Number(safeDto.totalXp ?? 0),
    todayXp: Number(safeDto.todayXp ?? 0),
    dailyGoal: Number(safeDto.dailyGoal ?? 20),
    todayWords: Number(safeDto.todayWords ?? 0),
    todayNewWords: Number(safeDto.todayNewWords ?? 0),
    todayReviewWords: Number(safeDto.todayReviewWords ?? 0),
    avgStability: Number(safeDto.avgStabilityDays ?? 0),
    retentionRate: Number(safeDto.retentionRatePercent ?? 0),
    wordBreakdown: {
      level1: lc[0],
      level2: lc[1],
      level3: lc[2],
      level4: lc[3],
      level5: lc[4],
      level6: lc[5],
      l1: lc[0],
      l2: lc[1],
      l3: lc[2],
      l4: lc[3],
      l5: lc[4],
      l6: lc[5],
      total: totalWords,
    },
    skillScores: safeDto.skillScores || {
      vocabScore: 0,
      grammarScore: 0,
      reflexScore: 0,
      readingScore: 0,
      listeningScore: 0,
    },
    dailyActivity: Array.isArray(safeDto.dailyActivity) ? safeDto.dailyActivity : [],
    quizHistory: Array.isArray(safeDto.quizHistory) ? safeDto.quizHistory : [],
    weakWords: Array.isArray(safeDto.weakWords) ? safeDto.weakWords : [],
  };

  return {
    success: ok,
    ...statsData,
    data: statsData,
  };
}

/**
 * Adapts `.NET 10` `WordWithSrsDto[]` items from `GET /api/v1/vocab/due` into due word cards.
 */
export function mapDueWordsPayload(items: Record<string, any>[] | null | undefined) {
  const safeItems = Array.isArray(items) ? items : [];
  const words = safeItems.map((d) => ({
    id: d.id,
    word: d.term || d.word,
    ipa: d.ipa,
    translation: d.translation,
    pos: d.partOfSpeech || d.pos,
    image_url: d.imageUrl || d.image_url,
    example: d.exampleSentence || d.example,
    example_vi: d.exampleTranslation || d.example_vi,
    isDue: true,
    srs: {
      word_id: d.id,
      stability: d.stability ?? 0,
      difficulty: d.difficulty ?? 5,
      interval_days: d.intervalDays ?? 0,
      next_review_date: d.nextReviewDate ?? new Date().toISOString(),
      review_count: 1,
      ease_factor: 2.5,
    },
  }));
  return {
    success: true,
    data: words,
    words,
  };
}
