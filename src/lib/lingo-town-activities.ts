/**
 * Cầu nối LingoTown / Library → app học LingoPro thật.
 *
 * Mô hình:
 *   Zone/quest trong hub  →  mở route product  →  học xong  →  return hub (+ XP demo)
 *
 * `href` trỏ app production trong web-app (cần đăng nhập nếu route yêu cầu).
 */

export type ActivityKind =
  | 'flashcard'
  | 'review'
  | 'quiz'
  | 'writing'
  | 'dictionary'
  | 'grammar'
  | 'journey'
  | 'pronunciation'
  | 'library'
  | 'pack-reading'
  | 'mindmap'
  | 'speaking-scenario';

export interface LingoActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  titleVi: string;
  /** Route trong app (relative) */
  path: string;
  /** Query thêm (không gồm from/return — helper gắn) */
  query?: Record<string, string>;
  emoji: string;
  minutes: string;
  /** Zone hub gợi ý */
  zones: Array<'fountain' | 'grove' | 'pier' | 'arena' | 'hall' | 'desk' | 'library' | 'shop' | 'board'>;
  /** XP demo khi “quay lại hub” (chưa verify server) */
  xpReward: number;
  blurb: string;
  /** Cần auth? */
  needsAuth?: boolean;
}

/** Catalog — map 1-1 với product LingoPro */
export const LINGO_ACTIVITIES: LingoActivity[] = [
  {
    id: 'act-flash-learn',
    kind: 'flashcard',
    title: 'Flashcard learn',
    titleVi: 'Học thẻ từ',
    path: '/flashcard',
    emoji: '🃏',
    minutes: '5–10p',
    zones: ['grove', 'library', 'hall'],
    xpReward: 40,
    blurb: 'Học / ôn pack từ vựng (SRS)',
    needsAuth: true,
  },
  {
    id: 'act-review',
    kind: 'review',
    title: 'Due review',
    titleVi: 'Ôn đến hạn',
    path: '/review',
    emoji: '🔥',
    minutes: '5–15p',
    zones: ['grove', 'library', 'fountain'],
    xpReward: 50,
    blurb: 'Pipeline FSRS: nhận diện · cloze · nghe · gõ',
    needsAuth: true,
  },
  {
    id: 'act-quiz',
    kind: 'quiz',
    title: 'Quiz',
    titleVi: 'Kiểm tra nhanh',
    path: '/quiz',
    emoji: '✅',
    minutes: '5p',
    zones: ['arena', 'library', 'hall'],
    xpReward: 35,
    blurb: 'Quiz từ đã học — đua rank lớp',
    needsAuth: true,
  },
  {
    id: 'act-writing',
    kind: 'writing',
    title: 'Writing',
    titleVi: 'Gõ từ / writing',
    path: '/writing',
    emoji: '✍️',
    minutes: '5–10p',
    zones: ['desk', 'library'],
    xpReward: 35,
    blurb: 'Gõ lại từ đến hạn, chấm gần đúng',
    needsAuth: true,
  },
  {
    id: 'act-dict',
    kind: 'dictionary',
    title: 'Dictionary',
    titleVi: 'Từ điển AI',
    path: '/dictionary',
    emoji: '📖',
    minutes: '2–5p',
    zones: ['pier', 'library', 'desk'],
    xpReward: 15,
    blurb: 'Tra từ, câu ví dụ, IPA, sense',
    needsAuth: false,
  },
  {
    id: 'act-grammar',
    kind: 'grammar',
    title: 'Grammar',
    titleVi: 'Ngữ pháp',
    path: '/grammar',
    emoji: '📐',
    minutes: '10p',
    zones: ['hall', 'library', 'desk'],
    xpReward: 40,
    blurb: 'Bài ngữ pháp + quiz grammar',
    needsAuth: true,
  },
  {
    id: 'act-grammar-learn',
    kind: 'grammar',
    title: 'Grammar learn',
    titleVi: 'Học ngữ pháp',
    path: '/grammar/learn',
    emoji: '📘',
    minutes: '10–15p',
    zones: ['library', 'hall'],
    xpReward: 45,
    blurb: 'Luồng học grammar chi tiết',
    needsAuth: true,
  },
  {
    id: 'act-journey',
    kind: 'journey',
    title: 'Journey',
    titleVi: 'Lộ trình unit',
    path: '/journey',
    emoji: '🗺️',
    minutes: '15p+',
    zones: ['hall', 'board'],
    xpReward: 30,
    blurb: 'Unit SGK / CEFR + checkpoint',
    needsAuth: true,
  },
  {
    id: 'act-dict-speak',
    kind: 'dictionary',
    title: 'AI speaking',
    titleVi: 'Nói / tra từ AI',
    path: '/dictionary',
    emoji: '🗣️',
    minutes: '5–10p',
    zones: ['arena', 'library'],
    xpReward: 25,
    blurb: 'Từ điển + AI speaking (trong game)',
    needsAuth: false,
  },
  {
    id: 'act-word-library',
    kind: 'library',
    title: 'Word library',
    titleVi: 'Thư viện từ',
    path: '/library',
    emoji: '📚',
    minutes: '5p',
    zones: ['pier', 'library'],
    xpReward: 20,
    blurb: 'Sổ từ / bộ sưu tập trong product',
    needsAuth: true,
  },
  {
    id: 'act-pack-reading',
    kind: 'pack-reading',
    title: 'Pack reading',
    titleVi: 'Đọc đoạn pack (AI)',
    path: '/demo/pack-practice',
    emoji: '📰',
    minutes: '5–10p',
    zones: ['pier', 'library', 'grove'],
    xpReward: 40,
    blurb: 'Sinh đoạn văn + cloze từ list từ unit',
    needsAuth: false,
  },
  {
    id: 'act-scenario',
    kind: 'speaking-scenario',
    title: 'Pair scenario',
    titleVi: 'Kịch bản pair (hub)',
    path: '/demo/lingo-library',
    query: { phase: 'pair' },
    emoji: '💬',
    minutes: '8–12p',
    zones: ['library'],
    xpReward: 45,
    blurb: 'Bắt cặp + hội thoại role A/B trong Library Hall',
    needsAuth: false,
  },
];

export function activitiesForZone(zone: string): LingoActivity[] {
  return LINGO_ACTIVITIES.filter((a) => a.zones.includes(zone as LingoActivity['zones'][number]));
}

export function getActivity(id: string): LingoActivity | undefined {
  return LINGO_ACTIVITIES.find((a) => a.id === id);
}

/**
 * URL mở app LingoPro, kèm return về hub.
 * @param returnPath vd `/demo/lingo-library` hoặc `/demo/lingo-town`
 */
export function buildActivityHref(
  activity: LingoActivity,
  opts: { returnPath: string; source?: string }
): string {
  const params = new URLSearchParams({
    ...(activity.query ?? {}),
    from: opts.source ?? 'lingotown',
    return: opts.returnPath,
    act: activity.id,
  });
  const q = params.toString();
  return q ? `${activity.path}?${q}` : activity.path;
}

/** Quest ngày hub → activity product */
export const HUB_QUEST_TO_ACTIVITY: Record<string, string> = {
  'q-checkin': 'act-review', // sau điểm danh → ôn due
  'q-flash': 'act-flash-learn',
  'q-race': 'act-quiz',
  'q-pair': 'act-scenario',
  'q-study': 'act-review',
  'q-grammar': 'act-grammar',
  'q-reading': 'act-pack-reading',
};

export interface PendingReturn {
  actId: string;
  startedAt: number;
  returnPath: string;
}

const PENDING_KEY = 'lingotown-pending-activity';

export function markActivityStart(actId: string, returnPath: string): void {
  if (typeof window === 'undefined') return;
  const payload: PendingReturn = { actId, startedAt: Date.now(), returnPath };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
}

export function consumeActivityReturn(): PendingReturn | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as PendingReturn;
  } catch {
    return null;
  }
}
