/**
 * Listening Recommendation & Watch State Engine.
 *
 * Implements:
 * 1. Video Watch Progress & Completion State with Sticky Completion Invariant (>=90% or ENDED or Attempt).
 * 2. Safe LocalStorage persistence with SSR fallback.
 * 3. Smart Queue Reordering (Unwatched -> In-Progress -> Completed moved to end of shelf, stable tie-breaking).
 * 4. Deterministic 3-Video Daily Recommendation Engine (Mulberry32 PRNG seeded by YYYY-MM-DD date,
 *    3 distinct topics, diverse CEFR levels, unwatched priority, resilient fallback).
 */

import type {
  ListeningVideoIndexItem,
  CEFRLevel,
  ListeningTopic,
  VideoWatchProgress,
  VideoWatchStatus,
  WatchStatus,
  SaveWatchProgressInput,
  RecommendationOptions,
  ReorderShelfOptions,
  ListeningAttempt,
} from '@/types/listening';

export type {
  VideoWatchProgress,
  VideoWatchStatus,
  WatchStatus,
  SaveWatchProgressInput,
  RecommendationOptions,
  ReorderShelfOptions,
};

// ──────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────

export const COMPLETION_THRESHOLD_PERCENT = 90;
export const IN_PROGRESS_MIN_PERCENT = 5;
export const WATCH_STORAGE_PREFIX = 'lingo_listening_watch_';
export const LEGACY_PROGRESS_PREFIX = 'lingo_listening_progress_';
export const ATTEMPT_STORAGE_PREFIX = 'lingo_listening_attempt_';

export const CORE_TOPICS: ListeningTopic[] = [
  'daily_life',
  'social_conversations',
  'workplace',
  'travel',
  'food_shopping',
  'science_tech_health',
  'culture',
];

// ──────────────────────────────────────────────────────────────────────────
// Deterministic PRNG & Math Helpers (Mulberry32)
// ──────────────────────────────────────────────────────────────────────────

/**
 * 32-bit integer hash from a date string (e.g. "2026-09-08").
 * Deterministic across all platforms and runtime environments.
 */
export function hashDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic 32-bit seed for a given date string YYYY-MM-DD.
 * Defaults to current UTC date if omitted.
 */
export function getDailySeed(dateStr?: string): number {
  const d = dateStr || new Date().toISOString().slice(0, 10);
  return hashDateString(d);
}

/**
 * Mulberry32 32-bit PRNG generator.
 * Produces pseudo-random numbers in [0, 1) with uniform distribution.
 */
export function createMulberry32(seed: number): () => number {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates array shuffle using the provided PRNG.
 * Pure function: does not mutate the input array.
 */
export function shuffleArray<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ──────────────────────────────────────────────────────────────────────────
// Video Watch Progress & Completion State Management
// ──────────────────────────────────────────────────────────────────────────

/**
 * Safely retrieve a video watch progress record from localStorage.
 * Handles SSR gracefully (returns null if window/localStorage is unavailable).
 * Standardized completion: returns completed = true if percent >= 90 or attempt isCompleted === true.
 */
export function getVideoWatchProgress(videoId: string): VideoWatchProgress | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;

  try {
    const rawWatch =
      localStorage.getItem(`${WATCH_STORAGE_PREFIX}${videoId}`) ||
      localStorage.getItem(`${LEGACY_PROGRESS_PREFIX}${videoId}`);

    // Check historical exercise attempt for backward compatibility
    let hasCompletedAttempt = false;
    try {
      const rawAttempt = localStorage.getItem(`${ATTEMPT_STORAGE_PREFIX}${videoId}`);
      if (rawAttempt) {
        const attempt = JSON.parse(rawAttempt) as Partial<ListeningAttempt>;
        if (attempt.isCompleted === true || (typeof attempt.percentScore === 'number' && attempt.percentScore >= 80)) {
          hasCompletedAttempt = true;
        }
      }
    } catch {
      // Ignore attempt parsing errors
    }

    if (!rawWatch) {
      if (hasCompletedAttempt) {
        const now = new Date().toISOString();
        return {
          videoId,
          percent: 100,
          currentTime: 0,
          duration: 0,
          completed: true,
          completedAt: now,
          updatedAt: now,
        };
      }
      return null;
    }

    // Parse rawWatch: could be a raw number (legacy) or full JSON object
    const num = Number(rawWatch);
    if (!isNaN(num) && rawWatch.trim() !== '') {
      const pct = Math.min(100, Math.max(0, Math.round(num)));
      const isCompleted = hasCompletedAttempt || pct >= COMPLETION_THRESHOLD_PERCENT;
      const now = new Date().toISOString();
      return {
        videoId,
        percent: pct,
        currentTime: 0,
        duration: 0,
        completed: isCompleted,
        completedAt: isCompleted ? now : undefined,
        updatedAt: now,
      };
    }

    const parsed = JSON.parse(rawWatch);
    if (typeof parsed === 'number') {
      const pct = Math.min(100, Math.max(0, Math.round(parsed)));
      const isCompleted = hasCompletedAttempt || pct >= COMPLETION_THRESHOLD_PERCENT;
      const now = new Date().toISOString();
      return {
        videoId,
        percent: pct,
        currentTime: 0,
        duration: 0,
        completed: isCompleted,
        completedAt: isCompleted ? now : undefined,
        updatedAt: now,
      };
    }

    if (parsed && typeof parsed === 'object') {
      let pct = 0;
      if (typeof parsed.percent === 'number') {
        pct = parsed.percent;
      } else if (typeof parsed.percentWatched === 'number') {
        pct = parsed.percentWatched;
      } else if (typeof parsed.progress === 'number') {
        pct = parsed.progress;
      } else if (typeof parsed.currentTime === 'number' && typeof parsed.duration === 'number' && parsed.duration > 0) {
        pct = Math.round((parsed.currentTime / parsed.duration) * 100);
      }
      pct = Math.min(100, Math.max(0, Math.round(pct)));

      const isCompleted =
        hasCompletedAttempt ||
        parsed.completed === true ||
        pct >= COMPLETION_THRESHOLD_PERCENT;

      return {
        videoId,
        percent: pct,
        currentTime: typeof parsed.currentTime === 'number' ? Math.round(parsed.currentTime * 10) / 10 : 0,
        duration: typeof parsed.duration === 'number' ? Math.round(parsed.duration * 10) / 10 : 0,
        completed: isCompleted,
        completedAt: isCompleted ? (parsed.completedAt || new Date().toISOString()) : undefined,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch {
    // Return null on JSON corruption or storage exceptions
  }

  return null;
}

/**
 * Save user video watch progress to localStorage with Sticky Completion Invariant:
 * Once marked completed, rewinding (e.g. seeking back to 0:00) will NEVER unmark completion.
 * Dispatches 'lingo_listening_watch_updated' custom DOM event in browser.
 */
export function saveVideoWatchProgress(input: SaveWatchProgressInput): VideoWatchProgress {
  const now = new Date().toISOString();

  // Compute percentage
  let percent = 0;
  if (typeof input.percent === 'number') {
    percent = Math.min(100, Math.max(0, Math.round(input.percent)));
  } else if (input.duration > 0) {
    percent = Math.min(100, Math.max(0, Math.round((input.currentTime / input.duration) * 100)));
  }

  // Safe SSR check
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    const isCompleted = input.completed === true || input.playerState === 0 || percent >= COMPLETION_THRESHOLD_PERCENT;
    return {
      videoId: input.videoId,
      percent,
      currentTime: Math.round(input.currentTime * 10) / 10,
      duration: Math.round(input.duration * 10) / 10,
      completed: isCompleted,
      completedAt: isCompleted ? now : undefined,
      updatedAt: now,
    };
  }

  // Check existing record for Sticky Completion Invariant
  const existing = getVideoWatchProgress(input.videoId);
  const wasCompleted = existing?.completed === true;
  const isNewlyCompleted =
    input.completed === true ||
    input.playerState === 0 || // YouTube ENDED
    percent >= COMPLETION_THRESHOLD_PERCENT;

  const completed = wasCompleted || isNewlyCompleted;
  const completedAt = completed ? (existing?.completedAt || now) : undefined;

  const progress: VideoWatchProgress = {
    videoId: input.videoId,
    percent,
    currentTime: Math.round(input.currentTime * 10) / 10,
    duration: Math.round(input.duration * 10) / 10,
    completed,
    completedAt,
    updatedAt: now,
  };

  try {
    localStorage.setItem(`${WATCH_STORAGE_PREFIX}${input.videoId}`, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save watch progress to localStorage:', err);
  }

  if (typeof window !== 'undefined' && typeof (window as any).dispatchEvent === 'function') {
    try {
      const event =
        typeof CustomEvent === 'function'
          ? new CustomEvent('lingo_listening_watch_updated', {
              detail: {
                videoId: input.videoId,
                percent,
                completed,
                progress,
              },
            })
          : ({
              type: 'lingo_listening_watch_updated',
              detail: {
                videoId: input.videoId,
                percent,
                completed,
                progress,
              },
            } as any);

      (window as any).dispatchEvent(event);
    } catch {
      // Ignore event dispatch errors
    }
  }

  return progress;
}

/**
 * Retrieve all stored video watch progress records as a dictionary map.
 */
export function getAllVideoWatchProgress(): Record<string, VideoWatchProgress> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};

  const map: Record<string, VideoWatchProgress> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(WATCH_STORAGE_PREFIX)) {
        const videoId = key.slice(WATCH_STORAGE_PREFIX.length);
        const progress = getVideoWatchProgress(videoId);
        if (progress) {
          map[videoId] = progress;
        }
      }
    }
  } catch {
    // Return whatever was collected
  }

  return map;
}

/**
 * Check if a specific video is completed.
 * Standardized rule: completed is true if completed === true OR percent >= 90%.
 */
export function isVideoCompleted(
  videoId: string,
  watchMap?: Record<string, Partial<VideoWatchProgress>>
): boolean {
  if (watchMap !== undefined) {
    const record = watchMap[videoId];
    if (!record) return false;
    return Boolean(
      record.completed === true ||
      (typeof record.percent === 'number' && record.percent >= COMPLETION_THRESHOLD_PERCENT)
    );
  }

  const progress = getVideoWatchProgress(videoId);
  return Boolean(progress && progress.completed);
}

/**
 * Classify a video's status into:
 * - 'unwatched': percent < 5% or no record
 * - 'in_progress': 5% <= percent < 90% and not completed
 * - 'completed': percent >= 90% or completed === true
 */
export function getVideoWatchStatus(
  videoId: string,
  watchMap?: Record<string, Partial<VideoWatchProgress>>
): VideoWatchStatus {
  const record = watchMap !== undefined ? watchMap[videoId] : (getVideoWatchProgress(videoId) ?? undefined);
  if (!record) return 'unwatched';

  if (
    record.completed === true ||
    (typeof record.percent === 'number' && record.percent >= COMPLETION_THRESHOLD_PERCENT)
  ) {
    return 'completed';
  }

  if (typeof record.percent === 'number' && record.percent >= IN_PROGRESS_MIN_PERCENT) {
    return 'in_progress';
  }

  return 'unwatched';
}

// ──────────────────────────────────────────────────────────────────────────
// Smart Queue Reordering
// ──────────────────────────────────────────────────────────────────────────

/**
 * Smart Queue Reordering:
 * - Unwatched videos first (tier 0)
 * - In-progress videos (tier 1)
 * - Completed videos moved to the end of the shelf (tier 2)
 * - If options.inProgressFirst is true: in-progress (tier 0) -> unwatched (tier 1) -> completed (tier 2)
 * - Stable tie-breaking using original catalog index to prevent UI jitter on reload
 */
export function reorderShelfVideos(
  shelfVideos: ListeningVideoIndexItem[],
  watchMap: Record<string, Partial<VideoWatchProgress>> = {},
  options?: ReorderShelfOptions
): ListeningVideoIndexItem[] {
  if (!shelfVideos || shelfVideos.length <= 1) {
    return shelfVideos ? [...shelfVideos] : [];
  }

  const originalIndexMap = new Map<string, number>();
  shelfVideos.forEach((v, idx) => originalIndexMap.set(v.id, idx));

  return [...shelfVideos].sort((a, b) => {
    const statusA = getVideoWatchStatus(a.id, watchMap);
    const statusB = getVideoWatchStatus(b.id, watchMap);

    const getTier = (status: VideoWatchStatus): number => {
      if (status === 'completed') return 2;
      if (options?.inProgressFirst) {
        return status === 'in_progress' ? 0 : 1;
      }
      return status === 'unwatched' ? 0 : 1;
    };

    const tierA = getTier(statusA);
    const tierB = getTier(statusB);

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    // Stable tie-breaker: preserve original catalog order
    const origA = originalIndexMap.get(a.id) ?? 0;
    const origB = originalIndexMap.get(b.id) ?? 0;
    return origA - origB;
  });
}

/**
 * Backward-compatible helper for shelf sorting with Set of completedIds and progress map.
 */
export function sortShelfVideos(
  videos: ListeningVideoIndexItem[],
  completedIds: Set<string>,
  watchProgressMap: Record<string, number> = {}
): ListeningVideoIndexItem[] {
  const watchMap: Record<string, Partial<VideoWatchProgress>> = {};
  for (const id of completedIds) {
    watchMap[id] = { completed: true, percent: 100 };
  }
  for (const [id, pct] of Object.entries(watchProgressMap)) {
    if (!watchMap[id]) {
      watchMap[id] = { percent: pct, completed: pct >= COMPLETION_THRESHOLD_PERCENT };
    }
  }
  return reorderShelfVideos(videos, watchMap, { inProgressFirst: true });
}

// ──────────────────────────────────────────────────────────────────────────
// Daily 3-Video Recommendation Engine
// ──────────────────────────────────────────────────────────────────────────

/**
 * Daily 3-Video Recommendation Engine:
 * - Deterministic PRNG seeded by date YYYY-MM-DD (Mulberry32)
 * - Selects 3 videos across 3 distinct topics
 * - Selects across diverse levels (A2, B1, B2)
 * - Strictly prioritizes unwatched videos
 * - Gracefully falls back to uncompleted videos in other topics, and to completed videos if 100% of catalog is completed.
 */
export function getDailyRecommendedVideos(
  videos: ListeningVideoIndexItem[],
  options: RecommendationOptions = {}
): ListeningVideoIndexItem[] {
  if (!videos || videos.length === 0) return [];
  if (videos.length <= 3) return [...videos];

  const dateStr = options.dateStr || options.seedDate || new Date().toISOString().slice(0, 10);
  const seed = hashDateString(dateStr);
  const rng = createMulberry32(seed);

  // Normalize completed IDs
  const completedIds = new Set<string>();
  if (options.completedIds) {
    if (options.completedIds instanceof Set) {
      for (const id of options.completedIds) completedIds.add(id);
    } else if (Array.isArray(options.completedIds)) {
      for (const id of options.completedIds) completedIds.add(id);
    }
  }
  if (options.watchMap) {
    for (const [id, record] of Object.entries(options.watchMap)) {
      if (
        record.completed === true ||
        (typeof record.percent === 'number' && record.percent >= COMPLETION_THRESHOLD_PERCENT)
      ) {
        completedIds.add(id);
      }
    }
  }

  // Group videos by topic (map legacy alias 'social_stories' to 'culture')
  const topicMap = new Map<string, ListeningVideoIndexItem[]>();
  for (const v of videos) {
    const topic = v.topic === 'social_stories' ? 'culture' : v.topic;
    if (!topicMap.has(topic)) topicMap.set(topic, []);
    topicMap.get(topic)!.push(v);
  }

  const topics = Array.from(topicMap.keys());
  const shuffledTopics = shuffleArray(topics, rng);

  const selected: ListeningVideoIndexItem[] = [];
  const selectedIds = new Set<string>();
  const targetLevels: CEFRLevel[] = ['A2', 'B1', 'B2'];

  // Pass 1: Select 1 unwatched video from distinct topics targeting different CEFR levels
  for (let i = 0; i < shuffledTopics.length && selected.length < 3; i++) {
    const topic = shuffledTopics[i];
    const topicPool = topicMap.get(topic) || [];
    const targetLevel = targetLevels[selected.length % targetLevels.length];

    // Candidates: Unwatched in this topic matching target level
    let candidates = topicPool.filter(
      (v) => !completedIds.has(v.id) && !selectedIds.has(v.id) && v.cefrLevel === targetLevel
    );

    // If none matching target level, take any unwatched in this topic
    if (candidates.length === 0) {
      candidates = topicPool.filter(
        (v) => !completedIds.has(v.id) && !selectedIds.has(v.id)
      );
    }

    if (candidates.length > 0) {
      const chosenIndex = Math.floor(rng() * candidates.length);
      const chosen = candidates[chosenIndex];
      selected.push(chosen);
      selectedIds.add(chosen.id);
    }
  }

  // Pass 2: If < 3 (some topics have no unwatched videos), pick from remaining unwatched across other topics
  if (selected.length < 3) {
    const remainingUnwatched = videos.filter(
      (v) => !completedIds.has(v.id) && !selectedIds.has(v.id)
    );
    const shuffledRemaining = shuffleArray(remainingUnwatched, rng);
    for (const v of shuffledRemaining) {
      if (selected.length >= 3) break;
      selected.push(v);
      selectedIds.add(v.id);
    }
  }

  // Pass 3: If still < 3 (user watched almost all or all 200 videos), fallback to completed pool
  if (selected.length < 3) {
    const completedPool = videos.filter((v) => !selectedIds.has(v.id));
    const shuffledCompleted = shuffleArray(completedPool, rng);
    for (const v of shuffledCompleted) {
      if (selected.length >= 3) break;
      selected.push(v);
      selectedIds.add(v.id);
    }
  }

  return selected.slice(0, 3);
}

/**
 * Convenience alias for getDailyRecommendedVideos.
 */
export const getDailyRecommendations = getDailyRecommendedVideos;
