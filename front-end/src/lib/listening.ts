import videosData from '@/data/listening/videos.json';
import videosIndexData from '@/data/listening/videos-index.json';
import type {
  ListeningVideo,
  ListeningVideoIndexItem,
  TranscriptCue,
  VideoFilterState,
  ListeningTopic,
  CEFRLevel,
  ListeningAttempt,
} from '@/types/listening';

/**
 * Normalized video catalog with defensive structural guarantees.
 */
const rawVideos = videosData as unknown as ListeningVideo[];
const rawIndex = videosIndexData as unknown as ListeningVideoIndexItem[];

export const listeningVideos: ListeningVideo[] = rawVideos.map((video) => ({
  ...video,
  exercises: video.exercises || {
    clozeItems: video.clozeItems || [],
    comprehensionQuestions: video.comprehensionQuestions || [],
  },
}));

/**
 * Get all available listening videos (full dataset).
 */
export function getAllListeningVideos(): ListeningVideo[] {
  return listeningVideos;
}

/**
 * Get the lightweight index of all listening videos for high-performance catalog browsing.
 */
export function getListeningVideosIndex(): ListeningVideoIndexItem[] {
  return rawIndex;
}

/**
 * Retrieve a specific listening video synchronously by its unique ID or YouTube ID.
 */
export function getListeningVideoById(id: string): ListeningVideo | undefined {
  if (!id) return undefined;
  const normalizedId = id.trim().toLowerCase();
  return listeningVideos.find(
    (v) => v.id.toLowerCase() === normalizedId || v.youtubeId.toLowerCase() === normalizedId
  );
}

/**
 * Asynchronously load the full detail of a video by ID or YouTube ID.
 * Employs two-tier loading: attempts dynamic import of single video details file,
 * falling back gracefully to the synchronous getListeningVideoById lookup.
 */
export async function loadListeningVideoById(id: string): Promise<ListeningVideo | null> {
  if (!id) return null;
  const normalizedId = id.trim().toLowerCase();

  // First try direct lookup by ID in details folder
  try {
    const detail = await import(`@/data/listening/details/${normalizedId}.json`);
    if (detail && detail.default) {
      const v = detail.default as ListeningVideo;
      return {
        ...v,
        exercises: v.exercises || {
          clozeItems: v.clozeItems || [],
          comprehensionQuestions: v.comprehensionQuestions || [],
        },
      };
    }
  } catch {
    // Dynamic import failed (e.g. YouTube ID lookup or detail not found), proceed to fallback
  }

  // Fallback to in-memory catalog
  return getListeningVideoById(normalizedId) || null;
}

/**
 * Flexible filtering function supporting both (filters) and (videos, filters) signatures.
 */
export function filterListeningVideos(
  videosOrFilters?: ListeningVideo[] | Partial<VideoFilterState>,
  maybeFilters?: Partial<VideoFilterState>
): ListeningVideo[] {
  let sourceVideos: ListeningVideo[];
  let filters: Partial<VideoFilterState>;

  if (Array.isArray(videosOrFilters)) {
    sourceVideos = videosOrFilters;
    filters = maybeFilters || {};
  } else {
    sourceVideos = getAllListeningVideos();
    filters = (videosOrFilters as Partial<VideoFilterState>) || {};
  }

  return sourceVideos.filter((video) => {
    // Duration filter
    if (filters.duration && filters.duration !== 'all') {
      if (video.durationCategory !== filters.duration) {
        return false;
      }
    }

    // Topic filter
    if (filters.topic && filters.topic !== 'all') {
      if (video.topic !== filters.topic) {
        return false;
      }
    }

    // CEFR Level filter
    if (filters.level && filters.level !== 'all') {
      if (video.cefrLevel !== filters.level) {
        return false;
      }
    }

    // Search query
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchTitle = video.title.toLowerCase().includes(q);
      const matchChannel = video.channel.toLowerCase().includes(q);
      const matchDesc = video.description.toLowerCase().includes(q);
      const matchTopic = video.topicDisplay.toLowerCase().includes(q);
      const matchVocab = video.coreVocabulary.some((v) =>
        v.word.toLowerCase().includes(q) || v.viDefinition.toLowerCase().includes(q)
      );

      if (!matchTitle && !matchChannel && !matchDesc && !matchTopic && !matchVocab) {
        return false;
      }
    }

    return true;
  });
}

/**
 * High-performance filtering function specifically for lightweight index items.
 */
export function filterListeningVideosIndex(
  itemsOrFilters?: ListeningVideoIndexItem[] | Partial<VideoFilterState>,
  maybeFilters?: Partial<VideoFilterState>
): ListeningVideoIndexItem[] {
  let sourceItems: ListeningVideoIndexItem[];
  let filters: Partial<VideoFilterState>;

  if (Array.isArray(itemsOrFilters)) {
    sourceItems = itemsOrFilters;
    filters = maybeFilters || {};
  } else {
    sourceItems = getListeningVideosIndex();
    filters = (itemsOrFilters as Partial<VideoFilterState>) || {};
  }

  return sourceItems.filter((item) => {
    // Duration filter
    if (filters.duration && filters.duration !== 'all') {
      if (item.durationCategory !== filters.duration) return false;
    }

    // Topic filter
    if (filters.topic && filters.topic !== 'all') {
      if (item.topic !== filters.topic) return false;
    }

    // CEFR Level filter
    if (filters.level && filters.level !== 'all') {
      if (item.cefrLevel !== filters.level) return false;
    }

    // Search query
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchChannel = item.channel.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTopic = item.topicDisplay.toLowerCase().includes(q);
      const matchVocab = item.coreVocabularyPreview.some((w) => w.toLowerCase().includes(q));

      if (!matchTitle && !matchChannel && !matchDesc && !matchTopic && !matchVocab) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Binary search to find the active cue index in O(log N) time.
 * Incorporates a 1.2-second silence tolerance to prevent UI flickering between sentences.
 */
export function findActiveCueIndex(cues: TranscriptCue[], currentTime: number): number {
  if (!cues || cues.length === 0 || currentTime < cues[0].start) {
    return -1;
  }

  let low = 0;
  let high = cues.length - 1;
  let candidate = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const cue = cues[mid];

    if (currentTime >= cue.start && currentTime <= cue.end) {
      return mid;
    }

    if (currentTime < cue.start) {
      high = mid - 1;
    } else {
      candidate = mid;
      low = mid + 1;
    }
  }

  // Inter-sentence speech pause hysteresis buffer (1.2 seconds)
  if (candidate !== -1) {
    const cue = cues[candidate];
    const nextCue = cues[candidate + 1];
    const maxGap = nextCue ? Math.min(cue.end + 1.2, nextCue.start) : cue.end + 1.2;

    if (currentTime <= maxGap) {
      return candidate;
    }
  }

  return -1;
}

/**
 * Find the active TranscriptCue object at a given playback time.
 */
export function findActiveCue(cues: TranscriptCue[], currentTime: number): TranscriptCue | undefined {
  const index = findActiveCueIndex(cues, currentTime);
  return index >= 0 ? cues[index] : undefined;
}

/**
 * Formats a duration in seconds into mm:ss or hh:mm:ss.
 * Example: 65 -> "01:05", 745 -> "12:25", 3665 -> "1:01:05"
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSecs}`;
  }

  return `${paddedMinutes}:${paddedSecs}`;
}

/**
 * Localized Vietnamese display labels for topics (7 core life topics + legacy alias).
 */
export function getTopicDisplayName(topic: ListeningTopic): string {
  switch (topic) {
    case 'daily_life':
      return 'Đời sống hàng ngày';
    case 'social_conversations':
      return 'Giao tiếp & Đời sống xã hội';
    case 'workplace':
      return 'Công việc & Sự nghiệp';
    case 'travel':
      return 'Du lịch & Khám phá';
    case 'food_shopping':
      return 'Ẩm thực, Mua sắm & Dịch vụ';
    case 'science_tech_health':
      return 'Khoa học, Công nghệ & Sức khỏe';
    case 'culture':
      return 'Văn hóa, TED & Câu chuyện';
    case 'social_stories':
      return 'Câu chuyện truyền cảm hứng';
    default:
      return topic;
  }
}

/**
 * Topic badge styling helper for UI components.
 */
export function getTopicBadgeColor(topic: ListeningTopic): { bg: string; text: string; border: string } {
  switch (topic) {
    case 'daily_life':
      return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'social_conversations':
      return { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' };
    case 'workplace':
      return { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' };
    case 'travel':
      return { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' };
    case 'food_shopping':
      return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' };
    case 'science_tech_health':
      return { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' };
    case 'culture':
      return { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' };
    case 'social_stories':
      return { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' };
    default:
      return { bg: 'bg-slate-50 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' };
  }
}

/**
 * Return Lucide icon name for each listening topic.
 */
export function getTopicIconName(topic: ListeningTopic): string {
  switch (topic) {
    case 'daily_life':
      return 'Sun';
    case 'social_conversations':
      return 'MessageSquare';
    case 'workplace':
      return 'Briefcase';
    case 'travel':
      return 'Compass';
    case 'food_shopping':
      return 'ShoppingBag';
    case 'science_tech_health':
      return 'Activity';
    case 'culture':
      return 'Globe';
    case 'social_stories':
      return 'BookOpen';
    default:
      return 'Headphones';
  }
}

/**
 * CEFR level badge styling helper.
 */
export function getCefrBadgeStyle(level: CEFRLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'A2':
      return { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-300', border: 'border-green-300 dark:border-green-700' };
    case 'B1':
      return { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' };
    case 'B2':
      return { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' };
    default:
      return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' };
  }
}

/**
 * Compute Levenshtein edit distance between two strings using 2-row dynamic programming.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[n];
}

/**
 * Validate a user's cloze listening attempt against the target word.
 * Normalized for casing, leading/trailing whitespace, and basic punctuation (including square brackets).
 * Accepts exact matches, and 1-typo edits (insert, delete, substitute) for words of length >= 4.
 */
export function validateClozeAnswer(userInput: string, targetWord: string): boolean {
  if (!userInput || !targetWord) return false;

  const punctuationRegex = /[.,/#!$%^&*;:{}=\-_`~()?'"[\]]/g;

  const cleanInput = userInput
    .trim()
    .toLowerCase()
    .replace(punctuationRegex, '');
  const cleanTarget = targetWord
    .trim()
    .toLowerCase()
    .replace(punctuationRegex, '');

  if (!cleanInput || !cleanTarget) return false;

  // Exact match
  if (cleanInput === cleanTarget) return true;

  // 1-typo fuzzy match for words of length >= 4
  if (cleanTarget.length >= 4 && levenshteinDistance(cleanInput, cleanTarget) <= 1) {
    return true;
  }

  // Distance >= 2 or completely wrong word
  return false;
}


/**
 * Tokenize a transcript sentence into clickable words and punctuation.
 */
export interface WordToken {
  id: string;
  raw: string;
  clean: string;
  isWord: boolean;
}

const TOKEN_SPLIT_REGEX = /([a-zA-Z0-9]+(?:['’][a-zA-Z0-9]+)*(?:-[a-zA-Z0-9]+)*)|([^a-zA-Z0-9\s]+)|(\s+)/g;

export function tokenizeSentence(sentence: string): WordToken[] {
  if (!sentence) return [];
  const tokens: WordToken[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  // Reset regex state
  TOKEN_SPLIT_REGEX.lastIndex = 0;

  while ((match = TOKEN_SPLIT_REGEX.exec(sentence)) !== null) {
    const [, wordMatch, punctMatch, spaceMatch] = match;

    if (wordMatch) {
      const clean = wordMatch.replace(/[’]/g, "'").toLowerCase();
      tokens.push({
        id: `w-${idx++}-${clean}`,
        raw: wordMatch,
        clean,
        isWord: true,
      });
    } else if (punctMatch) {
      tokens.push({
        id: `p-${idx++}`,
        raw: punctMatch,
        clean: '',
        isWord: false,
      });
    } else if (spaceMatch) {
      tokens.push({
        id: `s-${idx++}`,
        raw: spaceMatch,
        clean: '',
        isWord: false,
      });
    }
  }

  return tokens;
}

/**
 * Save user exercise attempt score to localStorage.
 */
export function saveListeningAttempt(attempt: ListeningAttempt): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `lingo_listening_attempt_${attempt.videoId}`;
    localStorage.setItem(key, JSON.stringify(attempt));
  } catch (err) {
    console.error('Failed to save listening attempt to localStorage:', err);
  }
}

/**
 * Get user exercise attempt from localStorage if present.
 */
export function getListeningAttempt(videoId: string): ListeningAttempt | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `lingo_listening_attempt_${videoId}`;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ListeningAttempt) : null;
  } catch (err) {
    console.error('Failed to read listening attempt from localStorage:', err);
    return null;
  }
}
