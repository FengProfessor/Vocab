/**
 * Specification Reference Engine (Oracle) for Universal Student Activity Aggregation.
 * Authoritative source: ORIGINAL_REQUEST.md (## 2026-10-05T02:42:14Z) & PROJECT.md
 */

import type {
  StudentActivitySummary,
  TimelineItem,
  TimelineActivityGroup,
  MultiSkillStats,
  CrmLifecycle,
  StudentStatusInfo,
} from './contracts';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RawActivitySources {
  srsLastReviewedAt?: string | null;
  quizCompletedAt?: string | null;
  wordCreatedAt?: string | null;
  grammarLastReviewedAt?: string | null;
  grammarMicroUpdatedAt?: string | null;
  dailyReadingCompletedAt?: string | null;
  toeicLastAnsweredAt?: string | null;
  assessmentCreatedAt?: string | null;
  vocabPackLastStudiedAt?: string | null;
  streakLastActiveDate?: string | null; // YYYY-MM-DD
}

/**
 * Normalizes all 9 activity sources using GREATEST timestamp logic.
 * Handles streak date format ('YYYY-MM-DD') by parsing as UTC start of day.
 */
export function calculateTrueLastActive(sources: RawActivitySources): string | null {
  const timestamps: number[] = [];

  const checkAndAdd = (dateStr?: string | null) => {
    if (!dateStr || typeof dateStr !== 'string') return;
    const trimmed = dateStr.trim();
    if (!trimmed) return;

    // Check if it's a date-only string like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsedDate = new Date(`${trimmed}T00:00:00.000Z`).getTime();
      if (!isNaN(parsedDate)) {
        timestamps.push(parsedDate);
      }
      return;
    }

    const t = new Date(trimmed).getTime();
    if (!isNaN(t)) {
      timestamps.push(t);
    }
  };

  checkAndAdd(sources.srsLastReviewedAt);
  checkAndAdd(sources.quizCompletedAt);
  checkAndAdd(sources.wordCreatedAt);
  checkAndAdd(sources.grammarLastReviewedAt);
  checkAndAdd(sources.grammarMicroUpdatedAt);
  checkAndAdd(sources.dailyReadingCompletedAt);
  checkAndAdd(sources.toeicLastAnsweredAt);
  checkAndAdd(sources.assessmentCreatedAt);
  checkAndAdd(sources.vocabPackLastStudiedAt);
  checkAndAdd(sources.streakLastActiveDate);

  if (timestamps.length === 0) return null;
  const maxTs = Math.max(...timestamps);
  return new Date(maxTs).toISOString();
}

/**
 * Builds StudentActivitySummary following Interface Contract 1.
 */
export function buildStudentActivitySummary(params: {
  userId: string;
  sources: RawActivitySources;
  wordCount: number;
  totalActivitiesCount: number;
}): StudentActivitySummary {
  const trueLastActive = calculateTrueLastActive(params.sources);
  return {
    userId: params.userId,
    trueLastActive,
    lastSrsAt: params.sources.srsLastReviewedAt || null,
    lastQuizAt: params.sources.quizCompletedAt || null,
    lastWordAt: params.sources.wordCreatedAt || null,
    lastGrammarAt: params.sources.grammarLastReviewedAt || params.sources.grammarMicroUpdatedAt || null,
    lastReadingAt: params.sources.dailyReadingCompletedAt || null,
    lastToeicAt: params.sources.toeicLastAnsweredAt || null,
    lastAssessmentAt: params.sources.assessmentCreatedAt || null,
    lastVocabPackAt: params.sources.vocabPackLastStudiedAt || null,
    lastStreakDate: params.sources.streakLastActiveDate || null,
    wordCount: params.wordCount,
    totalActivitiesCount: params.totalActivitiesCount,
  };
}

/**
 * Computes pedagogical status info based on true_last_active.
 * Invariant: An active learner in TOEIC, Grammar, Reading etc. within 3 days MUST NOT be dormant!
 */
export function evaluatePedagogicalStatus(
  student: {
    last_active?: string | null;
    vms?: number;
    words_reviewed?: number;
    lcs?: number;
    avg_quiz_accuracy?: number;
    quizzes_taken?: number;
  },
  now: number = Date.now(),
): StudentStatusInfo {
  const lastActiveTs = student.last_active ? new Date(student.last_active).getTime() : 0;
  const isDormant = Boolean(lastActiveTs && now - lastActiveTs > 3 * DAY_MS);

  if (isDormant) {
    return {
      key: 'dormant',
      dot: '💤',
      label: 'Vắng mặt',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      tag: 'DORMANT',
      title: 'Học sinh ngừng hoạt động > 3 ngày',
      advice: 'Cần gửi tin nhắn nhắc nhở ngay để học sinh không bị rơi rụng từ vựng theo đường cong lãng quên Ebbinghaus.',
    };
  }

  const isAtRisk = Boolean((student.vms || 0) < 30 && (student.words_reviewed || 0) > 10);
  if (isAtRisk) {
    return {
      key: 'at_risk',
      dot: '🔴',
      label: 'Cần củng cố',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      tag: 'AT RISK',
      title: 'Gặp khó khăn trong việc ghi nhớ',
      advice: 'Độ bền ghi nhớ (VMS) dưới 30% dù đã học nhiều từ. Hãy giao bài tập củng cố (Drill) các từ hay quên.',
    };
  }

  const isCramming = Boolean(
    (student.lcs || 0) < 30 && (student.avg_quiz_accuracy || 0) > 0.8 && (student.quizzes_taken || 0) > 2,
  );
  if (isCramming) {
    return {
      key: 'cramming',
      dot: '🟡',
      label: 'Học dồn',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      tag: 'CRAMMING',
      title: 'Học sinh có dấu hiệu học dồn',
      advice: 'Điểm quiz cao nhưng tính đều đặn thấp. Học dồn chỉ nhớ ngắn hạn; cần hướng dẫn học sinh phân bổ 5-10 phút mỗi ngày.',
    };
  }

  const isRisingStar = Boolean((student.lcs || 0) > 80 && (student.avg_quiz_accuracy || 0) > 0.8);
  if (isRisingStar) {
    return {
      key: 'rising_star',
      dot: '🟢',
      label: 'Tích cực',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      tag: 'RISING STAR',
      title: 'Học sinh duy trì phong độ xuất sắc',
      advice: 'Tính đều đặn và độ chính xác đều rất cao. Hãy khuyến khích học sinh tiếp tục duy trì và nạp thêm các bài nâng cao.',
    };
  }

  return {
    key: 'active',
    dot: '⚪',
    label: 'Bình thường',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    tag: 'ACTIVE',
    title: 'Học sinh đang học tập đều đặn',
    advice: 'Tiếp tục theo dõi tiến độ học tập hàng tuần.',
  };
}

/**
 * Calculates 7-day active student count KPI for Teacher Dashboard.
 */
export function calculate7DayActiveKpi(
  students: { last_active?: string | null }[],
  now: number = Date.now(),
): number {
  return students.filter((s) => {
    if (!s.last_active) return false;
    const ts = new Date(s.last_active).getTime();
    return !isNaN(ts) && now - ts <= 7 * DAY_MS;
  }).length;
}

/**
 * Calculates CRM customer lifecycle.
 * Rules:
 * - Created <= 7 days -> 'new'
 * - Days since true last active <= 7 -> 'active'
 * - Days since true last active <= 30 -> 'at_risk'
 * - Inactive > 30 days or never active -> 'churned'
 */
export function calculateCrmLifecycle(
  createdAtStr: string,
  trueLastActiveStr: string | null,
  now: number = Date.now(),
): CrmLifecycle {
  const createdTs = new Date(createdAtStr).getTime();
  const lastActiveTs = trueLastActiveStr ? new Date(trueLastActiveStr).getTime() : 0;

  if (now - createdTs <= 7 * DAY_MS) {
    return 'new';
  }

  if (!lastActiveTs) {
    return 'churned';
  }

  const daysSinceActive = (now - lastActiveTs) / DAY_MS;
  if (daysSinceActive <= 7) {
    return 'active';
  }
  if (daysSinceActive <= 30) {
    return 'at_risk';
  }
  return 'churned';
}

/**
 * Multi-skill Timeline Builder supporting all 6+ activity groups:
 * 'srs_review' | 'quiz' | 'word_saved' | 'grammar' | 'daily_reading' | 'toeic' | 'assessment' | 'vocab_pack'
 */
export function buildTimeline(raw: {
  srsReviews?: { id: string; timestamp: string; word: string; result: 'again' | 'hard' | 'good' | 'easy' }[];
  quizzes?: { id: string; completed_at: string; quiz_type?: string; score: number; total_questions: number; accuracy?: number }[];
  savedWords?: { id: string; created_at: string; word: string; pos?: string; translation?: string }[];
  grammarLessons?: { id: string; updated_at: string; topic_title: string; is_micro?: boolean; passed?: boolean; score?: number }[];
  dailyReadings?: { id: string; completed_at: string; article_title: string; score: number; total_questions: number }[];
  toeicDrills?: { id: string; answered_at: string; part: number; is_correct: boolean; question_id: string }[];
  assessments?: { id: string; created_at: string; track?: string; score: number; passed?: boolean }[];
  vocabPacks?: { id: string; last_studied_at: string; pack_title: string; reviewed_count: number; word_count: number; status: string }[];
}): TimelineItem[] {
  const timeline: TimelineItem[] = [];

  // 1. SRS Reviews
  for (const r of raw.srsReviews || []) {
    timeline.push({
      id: `srs-${r.id}`,
      type: 'srs_review',
      title: `Ôn Flashcard SRS: "${r.word}"`,
      timestamp: r.timestamp,
      badge: r.result.toUpperCase(),
      badgeVariant: r.result === 'good' || r.result === 'easy' ? 'emerald' : 'amber',
      details: { word: r.word, result: r.result },
    });
  }

  // 2. Quizzes
  for (const q of raw.quizzes || []) {
    const acc = q.accuracy ?? (q.total_questions > 0 ? q.score / q.total_questions : 0);
    const accPct = Math.round(acc * 100);
    timeline.push({
      id: `quiz-${q.id}`,
      type: 'quiz',
      title: `Bài Quiz ${q.quiz_type === 'grammar' ? 'Ngữ pháp' : 'Từ vựng'}`,
      timestamp: q.completed_at,
      score: q.score,
      totalQuestions: q.total_questions,
      accuracy: acc,
      badge: `${q.score}/${q.total_questions} (${accPct}%)`,
      badgeVariant: acc >= 0.8 ? 'emerald' : 'amber',
      details: { quizType: q.quiz_type, score: q.score, totalQuestions: q.total_questions, accuracy: acc },
    });
  }

  // 3. Saved Words
  for (const w of raw.savedWords || []) {
    timeline.push({
      id: `word-${w.id}`,
      type: 'word_saved',
      title: `Lưu từ mới: "${w.word}"`,
      timestamp: w.created_at,
      badge: 'Đã lưu',
      badgeVariant: 'sky',
      details: { word: w.word, pos: w.pos, translation: w.translation },
    });
  }

  // 4. Grammar Lessons & Micro-lessons
  for (const g of raw.grammarLessons || []) {
    timeline.push({
      id: `grammar-${g.id}`,
      type: 'grammar',
      title: `${g.is_micro ? 'Micro-lesson' : 'Ngữ pháp'}: ${g.topic_title}`,
      timestamp: g.updated_at,
      badge: g.passed !== false ? 'Hoàn thành' : 'Chưa đạt',
      badgeVariant: g.passed !== false ? 'emerald' : 'amber',
      score: g.score,
      details: { topicTitle: g.topic_title, isMicro: g.is_micro, passed: g.passed },
    });
  }

  // 5. Daily Reading
  for (const dr of raw.dailyReadings || []) {
    const acc = dr.total_questions > 0 ? dr.score / dr.total_questions : 0;
    timeline.push({
      id: `reading-${dr.id}`,
      type: 'daily_reading',
      title: `Đọc bài báo: ${dr.article_title}`,
      timestamp: dr.completed_at,
      score: dr.score,
      totalQuestions: dr.total_questions,
      accuracy: acc,
      badge: `${dr.score}/${dr.total_questions} đúng`,
      badgeVariant: acc >= 0.8 ? 'emerald' : 'sky',
      details: { articleTitle: dr.article_title, score: dr.score, totalQuestions: dr.total_questions },
    });
  }

  // 6. TOEIC Practice Drills
  for (const t of raw.toeicDrills || []) {
    timeline.push({
      id: `toeic-${t.id}`,
      type: 'toeic',
      title: `Luyện đề Sát thủ TOEIC Part ${t.part}`,
      timestamp: t.answered_at,
      badge: t.is_correct ? 'Chính xác' : 'Sai',
      badgeVariant: t.is_correct ? 'emerald' : 'rose',
      details: { part: t.part, isCorrect: t.is_correct, questionId: t.question_id },
    });
  }

  // 7. Assessments
  for (const a of raw.assessments || []) {
    timeline.push({
      id: `assessment-${a.id}`,
      type: 'assessment',
      title: `Thi đánh giá: ${a.track || 'TOEIC Mock'}`,
      timestamp: a.created_at,
      score: a.score,
      badge: `${a.score}%`,
      badgeVariant: a.passed ? 'emerald' : 'indigo',
      details: { track: a.track, score: a.score, passed: a.passed },
    });
  }

  // 8. Vocab Packs
  for (const p of raw.vocabPacks || []) {
    timeline.push({
      id: `pack-${p.id}`,
      type: 'vocab_pack',
      title: `Học bộ từ vựng: ${p.pack_title}`,
      timestamp: p.last_studied_at,
      badge: `${p.reviewed_count}/${p.word_count}`,
      badgeVariant: 'violet',
      details: { packTitle: p.pack_title, status: p.status, reviewedCount: p.reviewed_count },
    });
  }

  // Sort chronologically descending (newest first)
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return timeline;
}

/**
 * Builds MultiSkillStats contract for Admin CRM Customer Drawer.
 */
export function buildMultiSkillStats(params: {
  createdAt: string;
  sources: RawActivitySources;
  vocab: { wordsSaved: number; cardsLearned: number; reviewsTotal: number; lapsesTotal: number; dueCount: number };
  grammar: { lessonsCompleted: number; microLessonsPassed: number };
  reading: { articlesRead: number };
  toeic: { questionsAnswered: number; correctCount: number };
  gamification: { streakDays: number; lastActiveDate: string | null };
  now?: number;
}): MultiSkillStats {
  const now = params.now || Date.now();
  const trueLastActive = calculateTrueLastActive(params.sources);
  const lifecycle = calculateCrmLifecycle(params.createdAt, trueLastActive, now);

  const toeicAccuracy =
    params.toeic.questionsAnswered > 0
      ? Math.round((params.toeic.correctCount / params.toeic.questionsAnswered) * 100)
      : 0;

  return {
    vocab: {
      ...params.vocab,
      lastActive: params.sources.srsLastReviewedAt || params.sources.wordCreatedAt || null,
    },
    grammar: {
      ...params.grammar,
      lastActive: params.sources.grammarLastReviewedAt || params.sources.grammarMicroUpdatedAt || null,
    },
    reading: {
      ...params.reading,
      lastActive: params.sources.dailyReadingCompletedAt || null,
    },
    toeic: {
      questionsAnswered: params.toeic.questionsAnswered,
      accuracyPercent: toeicAccuracy,
      lastActive: params.sources.toeicLastAnsweredAt || null,
    },
    gamification: {
      streakDays: params.gamification.streakDays,
      lastActiveDate: params.gamification.lastActiveDate,
    },
    trueLastActive,
    lifecycle,
  };
}

/**
 * SWR Cache Simulator enforcing sub-5ms response time for warm cache.
 */
export class SwrCacheSimulator<T> {
  private cache = new Map<string, { data: T; expiresAt: number; staleAt: number }>();
  private ttlMs: number;
  private staleMs: number;

  constructor(ttlMs = 2000, staleMs = 30000) {
    this.ttlMs = ttlMs;
    this.staleMs = staleMs;
  }

  async get(key: string, fetcher: () => Promise<T>): Promise<{ data: T; tookMs: number; fromCache: boolean }> {
    const start = Date.now();
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry && now < entry.expiresAt) {
      // Warm cache hit (< 5ms)
      return { data: entry.data, tookMs: Date.now() - start, fromCache: true };
    }

    if (entry && now < entry.staleAt) {
      // Stale cache hit — return immediately, refresh in background
      fetcher().then((fresh) => {
        this.cache.set(key, { data: fresh, expiresAt: Date.now() + this.ttlMs, staleAt: Date.now() + this.staleMs });
      });
      return { data: entry.data, tookMs: Date.now() - start, fromCache: true };
    }

    // Cache miss — fetch fresh
    const fresh = await fetcher();
    this.cache.set(key, { data: fresh, expiresAt: Date.now() + this.ttlMs, staleAt: Date.now() + this.staleMs });
    return { data: fresh, tookMs: Date.now() - start, fromCache: false };
  }

  clear() {
    this.cache.clear();
  }
}
