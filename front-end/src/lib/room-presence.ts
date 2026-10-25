/**
 * Hub presence — ai trong phòng, đang học gì.
 * Heartbeat REST thưa (~40s), không multiplayer position.
 */

export type PresenceActivityKey =
  | 'idle'
  | 'hub'
  | 'vocab'
  | 'review'
  | 'flashcard'
  | 'writing'
  | 'codemix'
  | 'grammar'
  | 'quiz'
  | 'dictionary'
  | 'journey'
  | 'speaking'
  | 'pack_reading'
  | 'other';

export interface RoomPresenceMember {
  userId: string;
  displayName: string;
  activityKey: PresenceActivityKey | string;
  activityLabel: string;
  lastSeenAt: string;
  /** true nếu last_seen trong ONLINE_MS */
  online: boolean;
  isYou?: boolean;
}

/** Coi online nếu heartbeat < 3 phút (nới để giảm poll/heartbeat) */
export const PRESENCE_ONLINE_MS = 180_000;
/** Client gửi heartbeat — thưa để giảm Function Invocations Vercel */
export const PRESENCE_HEARTBEAT_MS = 90_000;
/** Client poll danh sách */
export const PRESENCE_POLL_MS = 60_000;

export const ACTIVITY_META: Record<
  PresenceActivityKey,
  { label: string; emoji: string; color: string }
> = {
  idle: { label: 'Đang rảnh', emoji: '💤', color: 'text-slate-400' },
  hub: { label: 'Ở hub lớp', emoji: '🏠', color: 'text-amber-400' },
  vocab: { label: 'Học từ vựng', emoji: '📗', color: 'text-emerald-400' },
  review: { label: 'Ôn thẻ đến hạn', emoji: '🔥', color: 'text-orange-400' },
  flashcard: { label: 'Học flashcard', emoji: '🃏', color: 'text-green-400' },
  writing: { label: 'Luyện gõ từ', emoji: '✍️', color: 'text-sky-400' },
  codemix: { label: 'Sử dụng từ / Đặt câu', emoji: '✨', color: 'text-fuchsia-400' },
  grammar: { label: 'Học ngữ pháp', emoji: '📐', color: 'text-violet-400' },
  quiz: { label: 'Làm quiz', emoji: '✅', color: 'text-rose-400' },
  dictionary: { label: 'Tra từ điển', emoji: '📖', color: 'text-blue-400' },
  journey: { label: 'Lộ trình unit', emoji: '🗺️', color: 'text-teal-400' },
  speaking: { label: 'Luyện nói', emoji: '🗣️', color: 'text-pink-400' },
  pack_reading: { label: 'Đọc đoạn pack', emoji: '📰', color: 'text-yellow-400' },
  other: { label: 'Đang học', emoji: '📚', color: 'text-slate-300' },
};

/** Map pathname app → activity */
export function activityFromPathname(pathname: string): {
  key: PresenceActivityKey;
  label: string;
} {
  const p = pathname.replace(/\/$/, '') || '/';

  if (p.startsWith('/hub') || p.startsWith('/demo/lingo')) {
    return { key: 'hub', label: ACTIVITY_META.hub.label };
  }
  if (p.startsWith('/flashcard')) {
    return { key: 'flashcard', label: ACTIVITY_META.flashcard.label };
  }
  if (p.startsWith('/review')) {
    return { key: 'review', label: ACTIVITY_META.review.label };
  }
  if (p.startsWith('/writing')) {
    return { key: 'writing', label: ACTIVITY_META.writing.label };
  }
  if (p.startsWith('/practice/codemix') || p.startsWith('/demo/vocab-drill')) {
    return { key: 'codemix', label: ACTIVITY_META.codemix.label };
  }
  if (p.startsWith('/grammar')) {
    return { key: 'grammar', label: ACTIVITY_META.grammar.label };
  }
  if (p.startsWith('/quiz')) {
    return { key: 'quiz', label: ACTIVITY_META.quiz.label };
  }
  if (p.startsWith('/dictionary')) {
    return { key: 'dictionary', label: ACTIVITY_META.dictionary.label };
  }
  if (p.startsWith('/journey') || p.startsWith('/thpt')) {
    return { key: 'journey', label: ACTIVITY_META.journey.label };
  }
  if (p.startsWith('/pronunciation')) {
    return { key: 'speaking', label: ACTIVITY_META.speaking.label };
  }
  if (p.startsWith('/demo/pack-practice')) {
    return { key: 'pack_reading', label: ACTIVITY_META.pack_reading.label };
  }
  if (p.startsWith('/library')) {
    return { key: 'vocab', label: ACTIVITY_META.vocab.label };
  }

  return { key: 'other', label: ACTIVITY_META.other.label };
}

export function metaForActivity(key: string): {
  label: string;
  emoji: string;
  color: string;
} {
  if (key in ACTIVITY_META) {
    return ACTIVITY_META[key as PresenceActivityKey];
  }
  return ACTIVITY_META.other;
}
