import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const COHORT_PROMO_ACTIVE_ISO = '2026-07-26T12:00:00+07:00';

/**
 * Formats a Date into YYYY-MM-DD in Asia/Ho_Chi_Minh timezone.
 */
export function dateKeyInVN(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Shifts a YYYY-MM-DD calendar key by deltaDays without local TZ drift.
 */
export function shiftDateKey(dateKey, deltaDays) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey).slice(0, 10));
  if (!match) return String(dateKey).slice(0, 10);
  const dt = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + deltaDays));
  return dt.toISOString().slice(0, 10);
}

/**
 * Returns dynamic VN date helpers relative to anchorDate (defaults to now).
 */
export function getVnDateContext(anchorDate = new Date()) {
  const now = anchorDate instanceof Date ? anchorDate : new Date(anchorDate);
  const todayVN = dateKeyInVN(now);
  const yesterdayVN = shiftDateKey(todayVN, -1);
  return {
    now,
    todayVN,
    yesterdayVN,
    plusDaysIso: (days) => new Date(now.getTime() + days * 86400000).toISOString(),
    minusDaysIso: (days) => new Date(now.getTime() - days * 86400000).toISOString(),
  };
}

/**
 * Builds a 30-day dailyActivity series with an exact consecutive study streak.
 */
export function buildDailyActivitySeries({
  days = 30,
  streak = 0,
  includeToday = true,
  todayCount = 4,
  empty = false,
  anchorDate = new Date(),
} = {}) {
  if (empty) return [];
  const { todayVN } = getVnDateContext(anchorDate);
  const safeStreak = Math.max(0, Math.min(days, Math.floor(streak)));
  const activeEndIndex = includeToday ? days - 1 : days - 2;
  const activeStartIndex = safeStreak > 0 ? activeEndIndex - safeStreak + 1 : days;

  return Array.from({ length: days }, (_, idx) => {
    const date = shiftDateKey(todayVN, -(days - 1 - idx));
    let count = 0;
    if (safeStreak > 0 && idx >= activeStartIndex && idx <= activeEndIndex) {
      count = idx === days - 1 ? Math.max(1, todayCount) : ((idx % 5) + 2);
    }
    return { date, count };
  });
}

const SAMPLE_WORDS = [
  ['resilient', 'kiên cường', 'adj', 'She remained resilient under pressure.'],
  ['ubiquitous', 'phổ biến khắp nơi', 'adj', 'Smartphones are ubiquitous in daily life.'],
  ['pragmatic', 'thực tế', 'adj', 'We need a pragmatic approach to this issue.'],
  ['mitigate', 'giảm nhẹ', 'v', 'Trees help mitigate urban heat.'],
  ['eloquent', 'hùng biện', 'adj', 'He gave an eloquent speech.'],
  ['ambiguous', 'mơ hồ', 'adj', 'The instructions were ambiguous.'],
  ['catalyst', 'chất xúc tác', 'n', 'Innovation acts as a catalyst for growth.'],
  ['ephemeral', 'ngắn ngủi', 'adj', 'Fame can be ephemeral.'],
  ['coherent', 'mạch lạc', 'adj', 'Write a coherent paragraph.'],
  ['diligent', 'chăm chỉ', 'adj', 'A diligent student reviews every day.'],
  ['abundant', 'dồi dào', 'adj', 'The region has abundant resources.'],
  ['candid', 'thẳng thắn', 'adj', 'She offered candid feedback.'],
  ['feasible', 'khả thi', 'adj', 'The schedule looks feasible.'],
  ['inevitable', 'không thể tránh khỏi', 'adj', 'Change is inevitable in technology.'],
  ['lucid', 'rõ ràng', 'adj', 'Her explanation was lucid and brief.'],
  ['novelty', 'tính mới lạ', 'n', 'The novelty soon wore off.'],
  ['obsolete', 'lỗi thời', 'adj', 'Floppy disks are obsolete now.'],
  ['perseverance', 'sự kiên trì', 'n', 'Success requires perseverance.'],
  ['scrutinize', 'xem xét kỹ', 'v', 'Inspectors scrutinize every contract.'],
  ['tentative', 'tạm thời', 'adj', 'We agreed on a tentative date.'],
  ['validate', 'xác thực', 'v', 'Tests validate our assumptions.'],
  ['zealous', 'nhiệt huyết', 'adj', 'She is a zealous learner.'],
  ['alleviate', 'làm dịu', 'v', 'Good sleep can alleviate stress.'],
  ['benchmark', 'chuẩn mực', 'n', 'This score sets a new benchmark.'],
  ['consolidate', 'củng cố', 'v', 'We consolidate notes weekly.'],
  ['diverse', 'đa dạng', 'adj', 'The library offers diverse topics.'],
];

/**
 * Generates deterministic words supporting status, srsLevel, classroomId, and teacher_import.
 */
export function buildWordsDataset({
  count = 15,
  userId = 'u-free-1',
  classrooms = [],
  teacherWordCount = 0,
  includeNamedWord = null,
  anchorDate = new Date(),
} = {}) {
  const { now, plusDaysIso, minusDaysIso } = getVnDateContext(anchorDate);
  const words = [];

  for (let i = 0; i < count; i++) {
    const sample = SAMPLE_WORDS[i % SAMPLE_WORDS.length];
    const isTeacher = i < teacherWordCount && classrooms.length > 0;
    const classroomId = isTeacher
      ? classrooms[i % classrooms.length].id
      : 'cls-personal-1';

    let srsLevel = (i % 6) + 1;
    let isDue = i % 3 === 1;
    let reviewCount = (i % 5) + 1;
    let stability = [0.8, 2.5, 6.0, 14.0, 35.0, 95.0][srsLevel - 1];
    let difficulty = Number((4 + ((i * 7) % 6)).toFixed(1));
    let status = 'learning';

    if (i % 4 === 0) {
      srsLevel = 1;
      isDue = false;
      reviewCount = 0;
      stability = 0;
      status = 'new';
    } else if (i % 4 === 3) {
      srsLevel = i % 8 === 7 ? 6 : 5;
      isDue = false;
      reviewCount = 6;
      stability = srsLevel === 6 ? 95.0 : 35.0;
      status = 'mastered';
    } else if (isDue) {
      status = 'learning';
    }

    const wordText =
      i === 0 && includeNamedWord
        ? includeNamedWord
        : isTeacher && i === 0
          ? 'teacherword'
          : i < SAMPLE_WORDS.length
            ? sample[0]
            : `${sample[0]}-${i + 1}`;

    const createdAt = new Date(now.getTime() - (i + 1) * 3600000).toISOString();
    const nextReviewDate = isDue ? minusDaysIso(1) : plusDaysIso(5);
    const source = isTeacher ? 'teacher_import' : 'manual';

    words.push({
      id: `w-${i + 1}`,
      word: wordText,
      translation: isTeacher ? `${sample[1]} (lớp)` : sample[1],
      ipa: `/${wordText}/`,
      pos: sample[2],
      example: sample[3],
      example_vi: `Ví dụ minh họa cho từ ${wordText}.`,
      image_url: null,
      synonyms: ['capable', 'steady'],
      antonyms: ['fragile'],
      classroom_id: classroomId,
      added_by: isTeacher ? 'teacher-1' : userId,
      created_at: createdAt,
      source,
      teacherNote: isTeacher ? 'Từ trọng tâm bài kiểm tra' : null,
      dictionary_data: {
        source,
        teacherNote: isTeacher ? 'Từ trọng tâm bài kiểm tra' : undefined,
        definition: isTeacher ? `${sample[1]} (lớp)` : sample[1],
        pos: sample[2],
        example: sample[3],
        example_vi: `Ví dụ minh họa cho từ ${wordText}.`,
        familyWords: [{ word: `${wordText}ly`, pos: 'adv', meaning: 'một cách tương ứng' }],
      },
      srs:
        reviewCount === 0 && !isDue
          ? null
          : {
              user_id: userId,
              word_id: `w-${i + 1}`,
              stability,
              review_count: reviewCount,
              next_review_date: nextReviewDate,
              ease_factor: 2.5,
              interval_days: Math.max(1, Math.round(stability)),
              difficulty,
              last_reviewed_at: minusDaysIso(2),
            },
      isDue,
      reviewCount,
      srsLevel,
      mastery: Math.min(100, srsLevel * 16),
      status,
    });
  }

  return words;
}

/**
 * Computes summary counts & 6-level distribution for a word list.
 */
export function computeWordSummary(words, classroomId = null) {
  const scoped =
    classroomId && classroomId !== '__personal__'
      ? words.filter((w) => w.classroom_id === classroomId)
      : words;

  const levelCounts = [0, 0, 0, 0, 0, 0];
  let newCount = 0;
  let reviewDueCount = 0;

  for (const w of scoped) {
    const lvl = Math.max(1, Math.min(6, Number(w.srsLevel || 1)));
    levelCounts[lvl - 1] += 1;
    if (w.status === 'new' || w.reviewCount === 0) newCount += 1;
    if (w.isDue) reviewDueCount += 1;
  }

  const totalWords = scoped.length;
  return {
    classroomId: classroomId && classroomId !== '__personal__' ? classroomId : null,
    totalWords,
    total: totalWords,
    newCount,
    reviewDueCount,
    dueCount: newCount + reviewDueCount,
    levelCounts,
  };
}

/**
 * Applies GET /api/words query filtering, sorting, and pagination.
 */
export function queryWordsDataset(words, searchParams) {
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const status = (searchParams.get('status') || 'all').trim().toLowerCase();
  const sort = (searchParams.get('sort') || 'newest').trim().toLowerCase();
  const classroomId = searchParams.get('classroomId') || '';
  const filter = searchParams.get('filter') || '';
  const rawLimit = Number.parseInt(searchParams.get('limit') ?? '20', 10);
  const rawOffset = Number.parseInt(searchParams.get('offset') ?? '0', 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 20;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

  let filtered = words.slice();
  if (classroomId && classroomId !== '__personal__') {
    filtered = filtered.filter((w) => w.classroom_id === classroomId);
  }
  if (filter === 'review') {
    filtered = filtered.filter((w) => w.isDue);
  } else if (filter === 'new') {
    filtered = filtered.filter((w) => w.status === 'new' || w.reviewCount === 0);
  }
  if (q) {
    filtered = filtered.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        (w.translation || '').toLowerCase().includes(q),
    );
  }
  if (status && status !== 'all') {
    if (status === 'new') {
      filtered = filtered.filter((w) => w.status === 'new' || w.reviewCount === 0);
    } else if (status === 'due') {
      filtered = filtered.filter((w) => Boolean(w.isDue));
    } else if (status === 'learned') {
      filtered = filtered.filter((w) => w.reviewCount > 0 && w.srsLevel < 5 && !w.isDue);
    } else if (status === 'mastered') {
      filtered = filtered.filter((w) => w.srsLevel >= 5 || w.status === 'mastered');
    }
  }

  filtered.sort((a, b) => {
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === 'az') return a.word.localeCompare(b.word);
    if (sort === 'hardest') {
      const diffA = a.srs?.difficulty ?? 5;
      const diffB = b.srs?.difficulty ?? 5;
      return diffB - diffA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const total = filtered.length;
  const pageData = filtered.slice(offset, offset + limit);
  const summary = computeWordSummary(words, classroomId || null);

  return {
    success: true,
    data: pageData,
    classroomId: classroomId && classroomId !== '__personal__' ? classroomId : null,
    total: searchParams.get('noCount') === '1' && searchParams.get('includeCounts') !== '1' ? null : total,
    limit,
    offset,
    hasMore: offset + pageData.length < total,
    ...(searchParams.get('includeCounts') === '1'
      ? {
          newCount: summary.newCount,
          reviewDueCount: summary.reviewDueCount,
          dueCount: summary.dueCount,
        }
      : {}),
  };
}

/**
 * Builds deterministic vocab packs (in_progress, not_started, completed).
 */
export function buildVocabPacks({
  inProgressCount = 1,
  includeNotStarted = false,
  includeCompleted = false,
  userId = 'u-free-1',
  anchorDate = new Date(),
} = {}) {
  const { minusDaysIso } = getVnDateContext(anchorDate);
  const packs = [];

  for (let i = 0; i < inProgressCount; i++) {
    packs.push({
      user_id: userId,
      pack_id: `pack-inprog-${i + 1}`,
      catalog_version: 'v3',
      topic_id: `topic-${i + 1}`,
      topic_title: `Chủ đề Thực chiến ${i + 1}`,
      pack_index: i,
      status: 'in_progress',
      word_count: 10,
      reviewed_count: 3 + (i % 5),
      started_at: minusDaysIso(3),
      last_studied_at: minusDaysIso(0),
      completed_at: null,
      words: [
        { pack_id: `pack-inprog-${i + 1}`, word_id: `w-${i + 1}`, position: 0, progress: null },
      ],
      progress: { reviewedCount: 3 + (i % 5), wordCount: 10, percent: (3 + (i % 5)) * 10 },
    });
  }

  if (includeNotStarted) {
    packs.push({
      user_id: userId,
      pack_id: 'pack-not-started-1',
      catalog_version: 'v3',
      topic_id: 'topic-ns',
      topic_title: 'Gói Chưa Bắt Đầu',
      pack_index: 9,
      status: 'not_started',
      word_count: 12,
      reviewed_count: 0,
      started_at: null,
      last_studied_at: null,
      completed_at: null,
      words: [{ pack_id: 'pack-not-started-1', word_id: 'w-1', position: 0, progress: null }],
      progress: { reviewedCount: 0, wordCount: 12, percent: 0 },
    });
  }

  if (includeCompleted) {
    packs.push({
      user_id: userId,
      pack_id: 'pack-done-1',
      catalog_version: 'v3',
      topic_id: 'topic-done',
      topic_title: 'Gói Đã Hoàn Thành',
      pack_index: 10,
      status: 'completed',
      word_count: 10,
      reviewed_count: 10,
      started_at: minusDaysIso(10),
      last_studied_at: minusDaysIso(4),
      completed_at: minusDaysIso(4),
      words: [{ pack_id: 'pack-done-1', word_id: 'w-2', position: 0, progress: null }],
      progress: { reviewedCount: 10, wordCount: 10, percent: 100 },
    });
  }

  return packs;
}

/**
 * Builds enrolled classroom fixtures.
 */
export function buildClassrooms(count = 0) {
  const catalog = [
    {
      id: 'cls-1',
      name: 'TOEIC 650+',
      description: 'Lớp luyện thi TOEIC mục tiêu 650+',
      invite_code: 'TOEIC650',
      joined_at: '2026-10-15T00:00:00.000Z',
      teacher: { id: 'teacher-1', name: 'Cô Minh Anh', email: 'teacher1@example.com' },
    },
    {
      id: 'cls-2',
      name: 'VSTEP B2',
      description: 'Lớp luyện thi VSTEP B2',
      invite_code: 'VSTEPB2',
      joined_at: '2026-10-20T00:00:00.000Z',
      teacher: { id: 'teacher-2', name: 'Thầy Quốc Bảo', email: 'teacher2@example.com' },
    },
  ];
  if (Array.isArray(count)) return count;
  return catalog.slice(0, Math.max(0, count));
}

/**
 * Builds deterministic CEFR roadmap tree matching /api/roadmap response shape.
 */
function buildRoadmapTree({ unitsDone = 0, levelsDone = [] } = {}) {
  const levelSpecs = [
    { id: 'A0', title: 'Foundation', titleVi: 'Mất gốc', description: 'Thoát mất gốc', unitCount: 6 },
    { id: 'A1', title: 'Elementary', titleVi: 'Sơ cấp', description: 'Giao tiếp cơ bản', unitCount: 10 },
    { id: 'A2', title: 'Pre-Intermediate', titleVi: 'Tiền trung cấp', description: 'Nền tảng vững chắc', unitCount: 12 },
    { id: 'B1', title: 'Intermediate', titleVi: 'Trung cấp', description: 'Giao tiếp tự tin', unitCount: 15 },
    { id: 'B2', title: 'Upper-Intermediate', titleVi: 'Trung cao cấp', description: 'Thành thạo học thuật', unitCount: 19 },
  ];
  const doneSet = new Set(levelsDone);
  const completedMatrix = levelSpecs.map((spec) =>
    Array.from({ length: spec.unitCount }, () => doneSet.has(spec.id)),
  );
  let totalDone = completedMatrix.reduce(
    (sum, row) => sum + row.filter(Boolean).length,
    0,
  );
  for (let li = 0; li < levelSpecs.length && totalDone < unitsDone; li++) {
    for (let ui = 0; ui < completedMatrix[li].length && totalDone < unitsDone; ui++) {
      if (!completedMatrix[li][ui]) {
        completedMatrix[li][ui] = true;
        totalDone += 1;
      }
    }
  }

  return levelSpecs.map((spec, li) => ({
    id: spec.id,
    title: spec.title,
    titleVi: spec.titleVi,
    description: spec.description,
    isStartLevel: spec.id === 'A0',
    units: Array.from({ length: spec.unitCount }, (_, ui) => {
      const unitId = `u-${spec.id.toLowerCase()}-${ui + 1}`;
      const isDone = completedMatrix[li][ui];
      return {
        id: unitId,
        index: ui + 1,
        title: `Chặng ${ui + 1}`,
        steps: [
          {
            id: `step-${unitId}-1`,
            type: 'vocab',
            ref: unitId,
            title: `Bài ${ui + 1}`,
            status: isDone ? 'completed' : 'locked',
            score: isDone ? 100 : null,
          },
        ],
      };
    }),
  }));
}

/**
 * Creates a complete deterministic scenario state for a persona preset + overrides.
 */
export function createPersonaConfig(preset = 'free-newbie', overrides = {}) {
  const anchorDate = overrides.anchorDate ? new Date(overrides.anchorDate) : new Date();
  const vn = getVnDateContext(anchorDate);

  const presets = {
    'free-newbie': {
      userId: 'u-free-newbie',
      plan: 'free',
      effectivePlan: 'free',
      expiresAt: null,
      remainingDays: null,
      wordCount: 20,
      wordQuotaUsed: 20,
      studyStreak: 2,
      rawStreak: 2,
      dailyGoal: 10,
      totalXp: 180,
      todayXp: 20,
      todayNewWords: 4,
      todayReviewWords: 3,
      inProgressPacks: 1,
      milestone: { enrolled: true, eligible: false, alreadyClaimed: false },
    },
    'free-near-limit': {
      userId: 'u-free-near',
      plan: 'free',
      effectivePlan: 'free',
      expiresAt: null,
      remainingDays: null,
      wordCount: 20,
      wordQuotaUsed: 180,
      studyStreak: 5,
      rawStreak: 5,
      dailyGoal: 15,
      totalXp: 420,
      todayXp: 30,
      todayNewWords: 6,
      todayReviewWords: 8,
      inProgressPacks: 1,
      milestone: { enrolled: false, eligible: false, alreadyClaimed: false },
    },
    'free-over-limit': {
      userId: 'u-free-over',
      plan: 'free',
      effectivePlan: 'free',
      expiresAt: null,
      remainingDays: null,
      wordCount: 20,
      wordQuotaUsed: 210,
      studyStreak: 5,
      rawStreak: 5,
      dailyGoal: 10,
      totalXp: 450,
      todayXp: 15,
      todayNewWords: 2,
      todayReviewWords: 5,
      inProgressPacks: 1,
      milestone: { enrolled: false, eligible: false, alreadyClaimed: false },
    },
    'free-milestone-eligible': {
      userId: 'u-free-elig',
      plan: 'free',
      effectivePlan: 'free',
      expiresAt: null,
      remainingDays: null,
      wordCount: 60,
      wordQuotaUsed: 60,
      studyStreak: 4,
      rawStreak: 4,
      dailyGoal: 10,
      totalXp: 350,
      todayXp: 25,
      todayNewWords: 5,
      todayReviewWords: 4,
      inProgressPacks: 1,
      milestone: { enrolled: true, eligible: true, alreadyClaimed: false },
    },
    'free-milestone-claimed': {
      userId: 'u-free-claimed',
      plan: 'free',
      effectivePlan: 'free',
      expiresAt: null,
      remainingDays: null,
      wordCount: 60,
      wordQuotaUsed: 60,
      studyStreak: 4,
      rawStreak: 4,
      dailyGoal: 10,
      totalXp: 350,
      todayXp: 25,
      todayNewWords: 5,
      todayReviewWords: 4,
      inProgressPacks: 1,
      milestone: { enrolled: true, eligible: false, alreadyClaimed: true },
    },
    pro: {
      userId: 'u-pro-active',
      plan: 'pro',
      effectivePlan: 'pro',
      expiresAt: vn.plusDaysIso(30),
      remainingDays: 30,
      wordCount: 25,
      wordQuotaUsed: 180,
      studyStreak: 7,
      rawStreak: 7,
      dailyGoal: 20,
      totalXp: 650,
      todayXp: 40,
      todayNewWords: 8,
      todayReviewWords: 12,
      inProgressPacks: 2,
      milestone: { enrolled: false, eligible: false, alreadyClaimed: false },
    },
    vip: {
      userId: 'u-vip-active',
      plan: 'premium',
      effectivePlan: 'premium',
      expiresAt: vn.plusDaysIso(60),
      remainingDays: 60,
      wordCount: 15,
      wordQuotaUsed: 250,
      studyStreak: 10,
      rawStreak: 10,
      dailyGoal: 25,
      totalXp: 1200,
      todayXp: 50,
      todayNewWords: 10,
      todayReviewWords: 15,
      inProgressPacks: 0,
      milestone: { enrolled: false, eligible: false, alreadyClaimed: false },
    },
    'expired-pro': {
      userId: 'u-pro-expired',
      plan: 'pro',
      effectivePlan: 'free',
      expiresAt: vn.minusDaysIso(1),
      remainingDays: -1,
      wordCount: 20,
      wordQuotaUsed: 175,
      studyStreak: 3,
      rawStreak: 3,
      dailyGoal: 10,
      totalXp: 310,
      todayXp: 20,
      todayNewWords: 3,
      todayReviewWords: 4,
      inProgressPacks: 1,
      milestone: { enrolled: true, eligible: false, alreadyClaimed: false },
    },
  };

  const base = presets[preset] || presets['free-newbie'];
  const userId = overrides.userId ?? base.userId;
  const classrooms = buildClassrooms(overrides.classrooms ?? 0);
  const wordCount = overrides.wordCount ?? base.wordCount;
  const teacherWordCount = overrides.teacherWordCount ?? (classrooms.length > 0 ? Math.min(3, wordCount) : 0);

  const words = buildWordsDataset({
    count: wordCount,
    userId,
    classrooms,
    teacherWordCount,
    includeNamedWord: overrides.includeNamedWord ?? null,
    anchorDate,
  });

  const studyStreak = overrides.studyStreak ?? base.studyStreak;
  const rawStreak = overrides.rawStreak ?? base.rawStreak;
  const includeTodayInStreak = overrides.includeTodayInStreak ?? true;
  const dailyActivity = buildDailyActivitySeries({
    days: 30,
    streak: studyStreak,
    includeToday: includeTodayInStreak,
    todayCount: overrides.todayWords ?? (overrides.todayNewWords ?? base.todayNewWords) + (overrides.todayReviewWords ?? base.todayReviewWords),
    empty: Boolean(overrides.emptyDailyActivity),
    anchorDate,
  });

  const vocabPacks = buildVocabPacks({
    inProgressCount: overrides.inProgressPacks ?? base.inProgressPacks,
    includeNotStarted: Boolean(overrides.includeNotStartedPacks),
    includeCompleted: Boolean(overrides.includeCompletedPacks),
    userId,
    anchorDate,
  });

  const profile = {
    id: userId,
    full_name: overrides.fullName ?? 'Học Viên Kiểm Thử',
    email: overrides.email ?? `${userId}@example.com`,
    role: overrides.role ?? 'student',
    avatar_url: null,
    plan: overrides.plan ?? base.plan,
    plan_expires_at: overrides.expiresAt !== undefined ? overrides.expiresAt : base.expiresAt,
    daily_goal: overrides.dailyGoal !== undefined ? overrides.dailyGoal : base.dailyGoal,
    notification_hour: overrides.notificationHour ?? 8,
    province: overrides.province ?? 'Hà Nội',
    created_at: '2026-06-01T00:00:00.000Z',
  };

  const effectivePlan = overrides.effectivePlan ?? base.effectivePlan;
  const wordQuotaUsed = overrides.wordQuotaUsed ?? base.wordQuotaUsed;
  const wordQuotaLimit = effectivePlan === 'free' ? (overrides.wordQuotaLimit ?? 200) : null;
  const wordQuotaRemaining =
    wordQuotaLimit === null ? null : Math.max(0, wordQuotaLimit - wordQuotaUsed);

  const milestoneState = {
    streak: studyStreak,
    words: wordQuotaUsed,
    minStreak: 3,
    minWords: 50,
    maxWordsAtClaim: 120,
    streakMet: studyStreak >= 3,
    wordsMet: wordQuotaUsed >= 50,
    enrolled: true,
    enrolledAt: '2026-06-15T00:00:00.000Z',
    eligible: false,
    alreadyClaimed: false,
    effectivePlan,
    claimedAt: null,
    ...base.milestone,
    ...(overrides.milestoneOverrides || {}),
  };
  milestoneState.streakMet = milestoneState.streak >= milestoneState.minStreak;
  milestoneState.wordsMet =
    milestoneState.words >= milestoneState.minWords &&
    milestoneState.words <= milestoneState.maxWordsAtClaim;

  const readingCompleted = overrides.readingCompleted ?? 3;
  const readingInProgress = overrides.readingInProgress ?? 1;
  const readingTotal = overrides.readingTotal ?? 619;
  const readingItems = [
    ...Array.from({ length: readingCompleted }, (_, idx) => ({
      article_id: `11111111-1111-1111-1111-${String(idx + 1).padStart(12, '0')}`,
      status: 'completed',
      is_bookmarked: false,
      mcq_score: 4,
      mcq_total: 5,
      cloze_score: 4,
      cloze_total: 5,
      last_read_at: vn.minusDaysIso(0),
    })),
    ...Array.from({ length: readingInProgress }, (_, idx) => ({
      article_id: `22222222-2222-2222-2222-${String(idx + 1).padStart(12, '0')}`,
      status: 'in_progress',
      is_bookmarked: false,
      mcq_score: 2,
      mcq_total: 5,
      cloze_score: 0,
      cloze_total: 5,
      last_read_at: vn.minusDaysIso(1),
    })),
  ];

  const challengeMode = overrides.challengeMode ?? 'none';
  let challengeWidget = { success: true };
  if (challengeMode === 'active') {
    challengeWidget = {
      success: true,
      activeParticipation: {
        challenge: {
          id: 'c-active-1',
          name: 'Thử thách 14 ngày',
          slug: '14-days',
          duration_days: 14,
        },
        progress: {
          currentDay: 3,
          totalDays: 14,
          todayCompleted: false,
          currentStreak: 3,
          totalActiveDays: 3,
        },
      },
    };
  } else if (challengeMode === 'promoted') {
    challengeWidget = {
      success: true,
      promotedChallenge: {
        challenge: {
          id: 'c-promo-1',
          name: 'TOEIC Sprint 14 ngày',
          slug: 'toeic-sprint',
          description: 'Luyện từ vựng mỗi ngày giữ chuỗi học',
          duration_days: 14,
          deposit_amount: 100000,
        },
      },
    };
  }

  const todayNewWords = overrides.todayNewWords ?? base.todayNewWords;
  const todayReviewWords = overrides.todayReviewWords ?? base.todayReviewWords;
  const todayWords = overrides.todayWords ?? todayNewWords + todayReviewWords;

  const computedSummary = computeWordSummary(words, null);
  const customSummary = {
    totalWords: overrides.totalWordsOverride ?? computedSummary.totalWords,
    newCount: overrides.newCountOverride ?? computedSummary.newCount,
    reviewDueCount: overrides.reviewDueCountOverride ?? computedSummary.reviewDueCount,
    dueCount:
      overrides.dueCountOverride ??
      (overrides.newCountOverride ?? computedSummary.newCount) +
        (overrides.reviewDueCountOverride ?? computedSummary.reviewDueCount),
    levelCounts: overrides.levelCountsOverride ?? computedSummary.levelCounts,
  };

  return {
    preset,
    unauthenticated: Boolean(overrides.unauthenticated),
    anchorDate,
    vn,
    userId,
    profile,
    entitlement: {
      rawPlan: profile.plan,
      effectivePlan,
      expiresAt: profile.plan_expires_at,
      remainingDays: overrides.remainingDays !== undefined ? overrides.remainingDays : base.remainingDays,
      wordQuota: {
        used: wordQuotaUsed,
        lifetime: wordQuotaUsed,
        limit: wordQuotaLimit,
        remaining: wordQuotaRemaining,
      },
    },
    gamification: {
      user_id: userId,
      total_xp: overrides.totalXp ?? base.totalXp,
      current_streak: rawStreak,
      longest_streak: Math.max(rawStreak, studyStreak, 7),
      last_active_date: studyStreak > 0 ? (includeTodayInStreak ? vn.todayVN : vn.yesterdayVN) : null,
      daily_goal: overrides.gamificationDailyGoal ?? 30,
      today_xp: overrides.todayXp ?? base.todayXp,
      today_date: vn.todayVN,
    },
    stats: {
      studyStreak,
      dailyActivity,
      todayWords,
      todayNewWords,
      todayReviewWords,
      todayKey: vn.todayVN,
      avgAccuracy: overrides.avgAccuracy ?? 86,
      bestScore: overrides.bestScore ?? 95,
      quizHistory: [{ accuracy: 86, score: 17, total: 20, created_at: vn.minusDaysIso(1) }],
      weakWords: words.slice(0, 2).map((w) => ({
        word_id: w.id,
        word: w.word,
        translation: w.translation,
        stability: 1.2,
        difficulty: 7.4,
        review_count: 2,
        next_review_date: vn.todayVN,
        level: 1,
      })),
    },
    words,
    customSummary,
    classrooms,
    vocabPacks,
    reading: {
      items: readingItems,
      completedCount: readingCompleted,
      inProgressCount: readingInProgress,
      totalReadCount: readingCompleted + readingInProgress,
      totalArticles: readingTotal,
    },
    challengeWidget,
    milestone: milestoneState,
    pushConfig: {
      count: 1,
      staleDays: 0,
      forceGen: 4,
      ...(overrides.pushConfig || {}),
    },
    roadmap: (() => {
      const unitsDone = overrides.roadmapUnitsDone ?? 0;
      const levelsDone = overrides.roadmapLevelsDone ?? [];
      const enrolled = Boolean(unitsDone > 0 || levelsDone.length > 0);
      return {
        enrolled,
        enrollments: enrolled
          ? [{ track: 'cefr', levelId: 'A0', startedAt: '2026-06-15T00:00:00.000Z' }]
          : [],
        unitsDone,
        levelsDone,
        tree: enrolled ? buildRoadmapTree({ unitsDone, levelsDone }) : [],
      };
    })(),
    statusCodeOverrides: overrides.statusCodeOverrides || {},
  };
}

/**
 * Installs evaluateOnNewDocument browser instrumentation:
 * - window.__cspViolations tracking
 * - onboarding & install-prompt suppression
 * - optional notification/push storage pre-seeding
 * - optional upsell dismissal pre-seeding
 * - optional Notification & serviceWorker mocks
 * - optional Date clock stubbing (e.g. COHORT_PROMO_ACTIVE_ISO)
 */
export async function installBrowserInstrumentations(
  page,
  {
    suppressOnboarding = true,
    suppressInstallPrompt = true,
    suppressPushBanner = true,
    pushDeviceRegistered = false,
    pushForceGen = undefined,
    dismissNearLimitDay = null,
    dismissPlanExpiredDay = null,
    notificationPermission = null,
    stubServiceWorker = false,
    anchorIso = null,
    seedSwrCache = null,
    saveData = false,
  } = {},
) {
  await page.evaluateOnNewDocument((opts) => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      const entry = `${event.effectiveDirective}:${event.blockedURI}`;
      window.__cspViolations.push(entry);
      if (typeof window.__onCspViolation === 'function') {
        window.__onCspViolation(entry);
      }
    });

    if (opts.anchorIso) {
      const targetNow = new Date(opts.anchorIso).getTime();
      const RealDate = Date;
      const realStart = RealDate.now();
      const currentNow = () => targetNow + (RealDate.now() - realStart);

      function MockDate(...args) {
        if (!(this instanceof MockDate)) {
          return new RealDate(currentNow()).toString();
        }
        if (args.length === 0) {
          return new RealDate(currentNow());
        }
        return new RealDate(...args);
      }
      MockDate.now = currentNow;
      MockDate.UTC = RealDate.UTC;
      MockDate.parse = RealDate.parse;
      MockDate.prototype = RealDate.prototype;
      Object.setPrototypeOf(MockDate, RealDate);
      window.Date = MockDate;
    }

    if (opts.notificationPermission) {
      const perm = opts.notificationPermission;
      const MockNotification = function MockNotification() {};
      MockNotification.permission = perm;
      MockNotification.requestPermission = async () => perm;
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    }

    if (opts.stubServiceWorker && navigator.serviceWorker) {
      try {
        const swProto =
          typeof window.ServiceWorkerRegistration === 'function'
            ? window.ServiceWorkerRegistration.prototype
            : Object.prototype;
        const mockReg = Object.create(swProto);
        Object.defineProperties(mockReg, {
          active: {
            configurable: true,
            value: { state: 'activated', scriptURL: `${window.location.origin}/firebase-messaging-sw` },
          },
          installing: { configurable: true, value: null },
          waiting: { configurable: true, value: null },
          scope: { configurable: true, value: `${window.location.origin}/` },
          pushManager: {
            configurable: true,
            value: {
              getSubscription: async () => null,
              subscribe: async () => {
                throw new window.DOMException('Push service disabled in offline E2E', 'AbortError');
              },
            },
          },
          update: { configurable: true, value: async () => {} },
          unregister: { configurable: true, value: async () => true },
          addEventListener: { configurable: true, value: () => {} },
          removeEventListener: { configurable: true, value: () => {} },
        });
        Object.defineProperty(navigator.serviceWorker, 'register', {
          configurable: true,
          value: async () => mockReg,
        });
      } catch {
        // ignore non-configurable serviceWorker in restricted mode
      }
    }

    if (opts.saveData && navigator.connection) {
      try {
        Object.defineProperty(navigator.connection, 'saveData', {
          configurable: true,
          get: () => true,
        });
      } catch {
        // ignore
      }
    }

    if (opts.suppressOnboarding) {
      localStorage.setItem('lingopro_onboarding_v6-20260805-mandatory', 'v6-20260805-mandatory');
      localStorage.setItem('lingopro_onboarding_completed', 'true');
    }
    if (opts.suppressInstallPrompt) {
      localStorage.setItem('install_prompt_dismissed_at', String(Date.now()));
    }
    if (opts.suppressPushBanner) {
      localStorage.setItem('lingopro_push_prompt_dismissed', '1');
      localStorage.setItem('lingopro_push_prompt_dismissed_at', String(Date.now()));
    } else {
      localStorage.removeItem('lingopro_push_prompt_dismissed');
      localStorage.removeItem('lingopro_push_prompt_dismissed_at');
    }
    if (opts.pushDeviceRegistered) {
      localStorage.setItem('lingopro_push_device_registered_v2', '1');
      const gen = opts.pushForceGen === undefined ? 4 : opts.pushForceGen;
      if (gen !== null) {
        localStorage.setItem('lingopro_push_force_gen', String(gen));
      } else {
        localStorage.removeItem('lingopro_push_force_gen');
      }
    }
    if (opts.dismissNearLimitDay) {
      localStorage.setItem(`lp:upsell:dismiss:word_near_limit:${opts.dismissNearLimitDay}`, '1');
    }
    if (opts.dismissPlanExpiredDay) {
      localStorage.setItem(`lp:upsell:dismiss:plan_expired:${opts.dismissPlanExpiredDay}`, '1');
    }
    if (opts.seedSwrCache && typeof opts.seedSwrCache === 'object') {
      for (const [storageKind, entries] of Object.entries(opts.seedSwrCache)) {
        const store = storageKind === 'local' ? localStorage : sessionStorage;
        for (const [k, v] of Object.entries(entries || {})) {
          store.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
    }
  }, {
    suppressOnboarding,
    suppressInstallPrompt,
    suppressPushBanner,
    pushDeviceRegistered,
    pushForceGen,
    dismissNearLimitDay,
    dismissPlanExpiredDay,
    notificationPermission,
    stubServiceWorker,
    anchorIso,
    seedSwrCache,
    saveData,
  });
}

/**
 * Attaches Puppeteer request interception for /api/auth/*, /api/*, and external aborting.
 * Returns { counts, requests, getCount(key) }.
 */
export async function attachStudentFixtureInterceptor(page, origin, scenario) {
  const counts = new Map();
  const requests = [];

  const record = (key, method, urlObj, headers, postData) => {
    counts.set(key, (counts.get(key) || 0) + 1);
    requests.push({
      key,
      method,
      path: urlObj.pathname,
      search: urlObj.search,
      fullUrl: urlObj.toString(),
      accept: headers.accept || '',
      body: postData || null,
      ts: Date.now(),
    });
  };

  const json = (request, status, payload) =>
    request.respond({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const urlStr = request.url();
    if (!urlStr.startsWith(`${origin}/`)) {
      if (urlStr.startsWith('data:') || urlStr.startsWith('blob:')) {
        void request.continue();
      } else {
        void request.abort();
      }
      return;
    }

    const urlObj = new URL(urlStr);
    const pathname = urlObj.pathname;
    const method = request.method();
    const headers = request.headers();
    const postData = request.postData();

    if (!pathname.startsWith('/api/')) {
      void request.continue();
      return;
    }

    const overrideKey = `${method} ${pathname}`;
    const overrideStatus =
      scenario.statusCodeOverrides[overrideKey] ?? scenario.statusCodeOverrides[pathname];

    if (pathname === '/api/auth/session') {
      record('GET /api/auth/session', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { session: null, error: 'Session error' });
        return;
      }
      if (scenario.unauthenticated) {
        void json(request, 401, { session: null });
        return;
      }
      void json(request, 200, {
        session: {
          user: {
            id: scenario.userId,
            email: scenario.profile.email,
            user_metadata: {
              full_name: scenario.profile.full_name,
              role: scenario.profile.role,
              lingopro_onboarding_completed: true,
              lingopro_onboarding_version: 'v6-20260805-mandatory',
            },
          },
          expires_at: Math.floor(Date.now() / 1000) + 7200,
        },
      });
      return;
    }

    if (pathname.startsWith('/api/auth/data/')) {
      const table = pathname.replace('/api/auth/data/', '');
      const wantsObject = String(headers.accept || '').includes('application/vnd.pgrst.object+json');
      record(`${method} /api/auth/data/${table}`, method, urlObj, headers, postData);

      if (table === 'profiles') {
        void json(request, 200, wantsObject ? scenario.profile : [scenario.profile]);
        return;
      }
      if (table === 'user_gamification') {
        void json(request, 200, wantsObject ? scenario.gamification : [scenario.gamification]);
        return;
      }
      if (table === 'classrooms') {
        const rows = scenario.profile.role === 'teacher' ? [{ id: 'cls-teacher-1' }] : [];
        void json(request, 200, wantsObject ? rows[0] || null : rows);
        return;
      }
      if (table === 'words') {
        const idEq = urlObj.searchParams.get('id') || '';
        const wordId = idEq.startsWith('eq.') ? idEq.slice(3) : '';
        const found = wordId
          ? (scenario.words.find((w) => w.id === wordId) ?? null)
          : (scenario.words[0] ?? null);
        if (!found) {
          void json(request, wantsObject ? 406 : 200, wantsObject ? { message: 'Not found' } : []);
          return;
        }
        void json(request, 200, wantsObject ? found : [found]);
        return;
      }
      if (table === 'srs_progress') {
        const wordIdEq = urlObj.searchParams.get('word_id') || '';
        const wordId = wordIdEq.startsWith('eq.') ? wordIdEq.slice(3) : '';
        const found = scenario.words.find((w) => w.id === wordId);
        const srsRow = found?.srs ? [found.srs] : [];
        void json(request, 200, wantsObject ? srsRow[0] || null : srsRow);
        return;
      }
      void json(request, 200, wantsObject ? {} : []);
      return;
    }

    if (pathname === '/api/profile') {
      record(`${method} /api/profile`, method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Profile server error' });
        return;
      }
      if (method === 'PUT') {
        let body = {};
        try {
          body = postData ? JSON.parse(postData) : {};
        } catch {
          body = {};
        }
        if (body.full_name !== undefined) scenario.profile.full_name = String(body.full_name);
        if (body.daily_goal !== undefined) {
          const parsedGoal = Number(body.daily_goal);
          const clamped = Number.isFinite(parsedGoal)
            ? Math.max(5, Math.min(50, Math.round(parsedGoal)))
            : 10;
          scenario.profile.daily_goal = clamped;
        }
        if (body.notification_hour !== undefined) {
          scenario.profile.notification_hour = Number(body.notification_hour);
        }
        if (body.province !== undefined) {
          scenario.profile.province = body.province;
        }
        void json(request, 200, { success: true, data: scenario.profile });
        return;
      }
      void json(request, 200, {
        success: true,
        data: scenario.profile,
        entitlement: scenario.entitlement,
        meta: { displayNameMin: 2, displayNameMax: 50 },
      });
      return;
    }

    if (pathname === '/api/words') {
      if (method === 'DELETE') {
        record('DELETE /api/words', method, urlObj, headers, postData);
        if (overrideStatus) {
          void json(request, overrideStatus, { success: false, error: 'Không xóa được từ' });
          return;
        }
        let body = {};
        try {
          body = postData ? JSON.parse(postData) : {};
        } catch {
          body = {};
        }
        const beforeLen = scenario.words.length;
        scenario.words = scenario.words.filter((w) => w.id !== body.wordId);
        if (scenario.words.length !== beforeLen && typeof scenario.customSummary?.totalWords === 'number') {
          scenario.customSummary.totalWords = Math.max(0, scenario.customSummary.totalWords - 1);
        }
        void json(request, 200, { success: true });
        return;
      }

      const isSummary = urlObj.searchParams.get('summary') === '1';
      const limitParam = urlObj.searchParams.get('limit');
      const filterParam = urlObj.searchParams.get('filter');
      record('GET /api/words', method, urlObj, headers, postData);
      if (isSummary) {
        record('GET /api/words?summary', method, urlObj, headers, postData);
      } else if (filterParam) {
        record(`GET /api/words?filter=${filterParam}`, method, urlObj, headers, postData);
      } else if (limitParam === '20') {
        record('GET /api/words?limit=20', method, urlObj, headers, postData);
      }

      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại.' });
        return;
      }

      if (isSummary) {
        const clsId = urlObj.searchParams.get('classroomId') || null;
        if (clsId && clsId !== '__personal__') {
          const summary = computeWordSummary(scenario.words, clsId);
          void json(request, 200, { success: true, ...summary });
        } else {
          const baseSummary = computeWordSummary(scenario.words, null);
          const merged = {
            ...baseSummary,
            ...scenario.customSummary,
            total: scenario.customSummary.totalWords,
          };
          void json(request, 200, { success: true, ...merged });
        }
        return;
      }

      if (filterParam === 'review' || filterParam === 'new') {
        const res = queryWordsDataset(scenario.words, urlObj.searchParams);
        void json(request, 200, res);
        return;
      }

      const payload = queryWordsDataset(scenario.words, urlObj.searchParams);
      void json(request, 200, payload);
      return;
    }

    if (pathname === '/api/student/stats') {
      const isLite = urlObj.searchParams.get('lite') === '1';
      record(isLite ? 'GET /api/student/stats?lite=1' : 'GET /api/student/stats', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Stats unavailable' });
        return;
      }
      if (isLite) {
        void json(request, 200, {
          success: true,
          data: {
            dailyActivity: scenario.stats.dailyActivity,
            studyStreak: scenario.stats.studyStreak,
            todayWords: scenario.stats.todayWords,
            todayNewWords: scenario.stats.todayNewWords,
            todayReviewWords: scenario.stats.todayReviewWords,
            todayKey: scenario.stats.todayKey,
          },
        });
        return;
      }
      const sum = computeWordSummary(scenario.words, null);
      const effectiveSummary = {
        total: scenario.customSummary?.totalWords ?? sum.totalWords,
        levelCounts: scenario.customSummary?.levelCounts ?? sum.levelCounts,
        wordsDue: scenario.customSummary?.reviewDueCount ?? sum.reviewDueCount,
      };
      void json(request, 200, {
        success: true,
        data: {
          wordStats: {
            total: effectiveSummary.total,
            levelCounts: effectiveSummary.levelCounts,
            avgStability: 12,
            wordsDue: effectiveSummary.wordsDue,
          },
          dailyActivity: scenario.stats.dailyActivity,
          quizHistory: scenario.stats.quizHistory,
          studyStreak: scenario.stats.studyStreak,
          avgAccuracy: scenario.stats.avgAccuracy,
          bestScore: scenario.stats.bestScore,
          weakWords: scenario.stats.weakWords,
          gamification: {
            totalXp: scenario.gamification.total_xp,
            streak: scenario.stats.studyStreak,
            todayXp: scenario.gamification.today_xp,
          },
        },
      });
      return;
    }

    if (pathname === '/api/student/dashboard') {
      record('GET /api/student/dashboard', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Service temporarily unavailable' });
        return;
      }
      void json(request, 200, {
        success: true,
        stats: {
          dailyActivity: scenario.stats.dailyActivity,
          studyStreak: scenario.stats.studyStreak,
          todayWords: scenario.stats.todayWords,
          todayNewWords: scenario.stats.todayNewWords,
          todayReviewWords: scenario.stats.todayReviewWords,
          todayKey: scenario.stats.todayKey,
        },
        readingProgress: {
          completedCount: scenario.reading.completedCount,
          inProgressCount: scenario.reading.inProgressCount,
          totalReadCount: scenario.reading.totalReadCount,
          totalArticles: scenario.reading.totalArticles,
        },
        vocabPacks: scenario.vocabPacks,
        classrooms: scenario.classrooms,
        challengeWidget:
          scenario.challengeWidget.activeParticipation || scenario.challengeWidget.promotedChallenge
            ? scenario.challengeWidget
            : null,
      });
      return;
    }

    if (pathname === '/api/reading/progress') {
      record('GET /api/reading/progress', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { authenticated: true, items: [], bookmarks: [] });
        return;
      }
      void json(request, 200, {
        authenticated: true,
        items: scenario.reading.items,
        bookmarks: [],
      });
      return;
    }

    if (pathname === '/api/practice/daily-reading') {
      record('GET /api/practice/daily-reading', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, {
        success: true,
        exercises: [],
        hasNew: false,
        hasUncompleted: false,
        uncompletedExerciseId: null,
        canGenerateToday: true,
        date: scenario.vn.todayVN,
        todayVN: scenario.vn.todayVN,
      });
      return;
    }

    if (pathname === '/api/vocab/packs') {
      record('GET /api/vocab/packs', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, { success: true, packs: scenario.vocabPacks });
      return;
    }

    if (pathname === '/api/student/classrooms') {
      record('GET /api/student/classrooms', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, { success: true, classrooms: scenario.classrooms });
      return;
    }

    if (pathname === '/api/challenges/widget') {
      record('GET /api/challenges/widget', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, scenario.challengeWidget);
      return;
    }

    if (pathname === '/api/billing/pro-milestone') {
      record(`${method} /api/billing/pro-milestone`, method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, {
          success: false,
          error: overrideStatus === 403 ? 'Không đủ điều kiện nhận quà' : 'Milestone unavailable',
        });
        return;
      }
      if (method === 'POST') {
        const m = scenario.milestone;
        const canClaim =
          m.eligible &&
          !m.alreadyClaimed &&
          m.effectivePlan === 'free' &&
          m.enrolled &&
          m.streak >= m.minStreak &&
          m.words >= m.minWords &&
          m.words <= m.maxWordsAtClaim;
        if (!canClaim) {
          void json(request, 403, { success: false, error: 'Chưa đủ điều kiện nhận quà' });
          return;
        }
        scenario.milestone.alreadyClaimed = true;
        scenario.milestone.eligible = false;
        scenario.milestone.effectivePlan = 'pro';
        scenario.milestone.claimedAt = scenario.vn.now.toISOString();
        scenario.profile.plan = 'pro';
        scenario.profile.plan_expires_at = scenario.vn.plusDaysIso(7);
        scenario.entitlement = {
          rawPlan: 'pro',
          effectivePlan: 'pro',
          expiresAt: scenario.profile.plan_expires_at,
          remainingDays: 7,
          wordQuota: { used: scenario.entitlement.wordQuota.used, lifetime: scenario.entitlement.wordQuota.used, limit: null, remaining: null },
        };
        void json(request, 200, {
          success: true,
          gift: true,
          milestone: scenario.milestone,
          reward: { plan: 'pro', days: 7, label: '1 tuần', coupon: 'NEWBIE1W' },
        });
        return;
      }
      void json(request, 200, {
        success: true,
        milestone: scenario.milestone,
        reward: { plan: 'pro', days: 7, label: '1 tuần', coupon: 'NEWBIE1W' },
      });
      return;
    }

    if (pathname === '/api/push/fcm-register') {
      record(`${method} /api/push/fcm-register`, method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      if (method === 'POST') {
        void json(request, 200, { success: true, forceGen: scenario.pushConfig.forceGen });
        return;
      }
      void json(request, 200, {
        success: true,
        count: scenario.pushConfig.count,
        staleDays: scenario.pushConfig.staleDays,
        forceGen: scenario.pushConfig.forceGen,
      });
      return;
    }

    if (pathname === '/api/grammar/progress') {
      record('GET /api/grammar/progress', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, { success: true, data: [], dueCount: 2 });
      return;
    }

    if (pathname === '/api/referral/evaluate-activation') {
      record('POST /api/referral/evaluate-activation', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, {
        success: true,
        eligible: false,
        message: 'Tài khoản chưa tham gia chương trình giới thiệu',
      });
      return;
    }

    if (pathname === '/api/import/packages') {
      record('GET /api/import/packages', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, { success: true, routes: [], microPackSize: 7, catalogVersion: 'v3' });
      return;
    }

    if (pathname === '/api/roadmap') {
      record('GET /api/roadmap', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      const r = scenario.roadmap;
      void json(request, 200, {
        success: true,
        data: {
          enrolled: r.enrolled,
          enrollments: r.enrollments,
          needsPlacement: !r.enrolled,
          roadmapVersion: 'roadmap-v1',
          track: 'cefr',
          levelId: 'A0',
          currentStepId: null,
          creditedFromLibrary: 0,
          ...(r.enrolled ? { tree: r.tree } : {}),
        },
      });
      return;
    }

    if (pathname === '/api/dictionary/lookup') {
      record('GET /api/dictionary/lookup', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, {
        word: urlObj.searchParams.get('word') || '',
        results: [],
        familyWords: [],
      });
      return;
    }

    if (pathname === '/api/classrooms/join') {
      record('POST /api/classrooms/join', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, {
          success: false,
          error: overrideStatus === 409 ? 'Bạn đã tham gia lớp này rồi.' : 'Không tìm thấy lớp học với mã mời này.',
        });
        return;
      }
      let body = {};
      try {
        body = postData ? JSON.parse(postData) : {};
      } catch {
        body = {};
      }
      const code = String(body.inviteCode || body.code || '').trim().toUpperCase();
      if (!code || code === 'BAD1' || code === 'INVALID') {
        void json(request, 404, { success: false, error: 'Không tìm thấy lớp học với mã mời này.' });
        return;
      }
      const joined = {
        id: 'cls-joined-1',
        name: `Lớp ${code}`,
        teacher_id: 'teacher-1',
        enrollment_count: 10,
      };
      scenario.classrooms.push({
        ...joined,
        description: 'Lớp vừa tham gia',
        invite_code: code,
        joined_at: scenario.vn.now.toISOString(),
        teacher: { id: 'teacher-1', name: 'Cô Minh Anh', email: 'teacher1@example.com' },
      });
      void json(request, 200, { success: true, data: joined });
      return;
    }

    if (pathname === '/api/extension-token') {
      record('POST /api/extension-token', method, urlObj, headers, postData);
      if (overrideStatus) {
        void json(request, overrideStatus, { success: false, error: 'Override error' });
        return;
      }
      void json(request, 200, { success: true, token: 'lpext_fixture_token' });
      return;
    }

    record(`${method} ${pathname}`, method, urlObj, headers, postData);
    if (overrideStatus) {
      void json(request, overrideStatus, { success: false, error: 'Override error' });
      return;
    }
    void json(request, 200, { success: true });
  });

  return {
    counts,
    requests,
    getCount: (key) => counts.get(key) || 0,
  };
}

/**
 * Starts Next.js production server on an ephemeral 127.0.0.1 port after verifying .next/BUILD_ID.
 */
export async function startProductionServer(cwd = process.cwd()) {
  const buildIdPath = path.join(cwd, '.next', 'BUILD_ID');
  assert(
    fs.existsSync(buildIdPath),
    `Missing ${buildIdPath}. Run "npm run build" before executing E2E suite.`,
  );

  const socket = net.createServer();
  socket.listen(0, 'localhost');
  await once(socket, 'listening');
  const address = socket.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  await new Promise((resolve) => socket.close(resolve));

  const origin = `http://localhost:${port}`;
  const server = spawn(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', 'localhost', '--port', String(port)],
    {
      cwd,
      env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
      stdio: 'ignore',
      windowsHide: true,
    },
  );
  server.on('error', () => {
    // Handled via exitCode polling and stopProductionServer cleanup
  });

  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) {
        throw new Error(`[E2E] Next server exited early with code ${server.exitCode}`);
      }
      try {
        const res = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1000) });
        if (res.ok && (await res.json()).status === 'ok') {
          ready = true;
          break;
        }
      } catch {
        // Wait for local production server readiness
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    assert(ready, `[E2E] Local production server failed healthcheck at ${origin}/api/health`);
    return { origin, port, server };
  } catch (err) {
    await stopProductionServer(server);
    throw err;
  }
}

/**
 * Stops the Next.js server deterministically, with Windows taskkill /T /F fallback.
 */
export async function stopProductionServer(server) {
  if (!server || server.exitCode !== null) return;
  const exited = once(server, 'exit').catch(() => 'error');
  server.kill();
  const outcome = await Promise.race([
    exited.then(() => 'exited'),
    new Promise((resolve) => setTimeout(() => resolve('timeout'), 3000)),
  ]);
  if (outcome === 'timeout' && server.exitCode === null) {
    if (process.platform === 'win32' && server.pid) {
      try {
        execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
      } catch {
        // ignore already terminated process
      }
    } else {
      server.kill('SIGKILL');
    }
    await Promise.race([
      exited,
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }
}
