/**
 * Unified Client Dictionary Cache
 * Multi-tier caching: Bounded L1 LRU Map (0ms) + Lazy L2 sessionStorage (<2ms) + Lemma Expansion + Coalescing
 */

import type { DictionaryData } from '@/lib/supabase';

export interface CachedDictEntry {
  word: string;
  data: DictionaryData;
  source: string;
  imageUrl?: string;
  ts: number;
  ttlMs?: number;
  /** Optional in-memory parsed exam payload (omitted from L2 JSON to save sessionStorage quota) */
  examResult?: unknown;
}

export interface SetCachedDictOptions {
  ttlMs?: number;
  aliases?: string[];
  examResult?: unknown;
}

export const MAX_L1_ENTRIES = 250;
export const MAX_L2_ENTRIES = 200;
export const DEFAULT_DICT_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const FALLBACK_DICT_TTL_MS = 30 * 1000; // 30 seconds for fallback/negative stubs

export type DictionarySourceBadge =
  | 'Kho từ điển'
  | 'Wiktionary'
  | 'AI'
  | 'Cụm · kho'
  | 'Cụm · AI'
  | 'Câu · giáo án'
  | 'Câu · AI'
  | 'Câu · ước lượng';

const VALID_DICTIONARY_SOURCE_BADGES = new Set<string>([
  'Kho từ điển',
  'Wiktionary',
  'AI',
  'Cụm · kho',
  'Cụm · AI',
  'Câu · giáo án',
  'Câu · AI',
  'Câu · ước lượng',
]);

/**
 * Normalize internal lookup source identifiers into user-facing Vietnamese SourceBadge labels.
 */
export function normalizeDictSourceBadge(
  rawSource: string | undefined | null,
  isPhrase = false,
): DictionarySourceBadge {
  const s = (rawSource || '').trim();
  if (VALID_DICTIONARY_SOURCE_BADGES.has(s)) {
    return s as DictionarySourceBadge;
  }
  if (s === 'external') {
    return 'Wiktionary';
  }
  if (
    s === 'toeic_collocation_index' ||
    s === 'global_dictionary' ||
    s === 'static_curriculum_fallback' ||
    s === 'exam_cache'
  ) {
    return isPhrase ? 'Cụm · kho' : 'Kho từ điển';
  }
  return isPhrase ? 'Cụm · kho' : 'Kho từ điển';
}

const GARBAGE_IPA_PATTERN = /word not found|not found|unknown|placeholder|gibberish|n\/a/i;
const GARBAGE_DEF_PATTERN = /không có trong từ điển|not a real word|word not found|không tồn tại/i;

function hasNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Filter out Exam-specific fallback/translate stubs, garbage payloads, and incomplete/empty-meaning
 * results before /dictionary page renders.
 */
export function isUsableDictionaryPageCacheEntry(
  entry: CachedDictEntry | null | undefined,
): entry is CachedDictEntry {
  if (!entry || !entry.data) return false;
  if (entry.source === 'fallback' || entry.source === 'translate') return false;

  const data = entry.data as DictionaryData & { ipa?: unknown };

  if (typeof data.ipa === 'string' && GARBAGE_IPA_PATTERN.test(data.ipa)) {
    return false;
  }
  if (
    Array.isArray(data.pronunciations) &&
    data.pronunciations.some((p) => typeof p?.ipa === 'string' && GARBAGE_IPA_PATTERN.test(p.ipa))
  ) {
    return false;
  }

  if (typeof data.definition === 'string' && GARBAGE_DEF_PATTERN.test(data.definition)) {
    return false;
  }

  const results = Array.isArray(data.results) ? data.results : [];
  const coreSenses = Array.isArray(data.core_senses) ? data.core_senses : [];

  for (const r of results) {
    if (!Array.isArray(r?.meanings)) continue;
    for (const rawMeaning of r.meanings) {
      const m = rawMeaning as (typeof rawMeaning & { meaning?: unknown; meaning_vi?: unknown }) | null | undefined;
      if (!m) continue;
      const fields = [m.definition, m.meaning, m.meaning_vi, m.definition_en, m.label_vi];
      if (fields.some((f) => typeof f === 'string' && GARBAGE_DEF_PATTERN.test(f))) {
        return false;
      }
    }
  }

  for (const cs of coreSenses) {
    if (!cs) continue;
    const fields = [cs.definition_vi, cs.label_vi, cs.definition_en];
    if (fields.some((f) => typeof f === 'string' && GARBAGE_DEF_PATTERN.test(f))) {
      return false;
    }
  }

  const hasResultMeaning = results.some(
    (r) =>
      Array.isArray(r?.meanings) &&
      r.meanings.some((rawMeaning) => {
        const m = rawMeaning as (typeof rawMeaning & { meaning?: unknown; meaning_vi?: unknown }) | null | undefined;
        return Boolean(
          m && (hasNonEmptyText(m.definition) || hasNonEmptyText(m.meaning) || hasNonEmptyText(m.meaning_vi)),
        );
      }),
  );

  const hasCoreSense = coreSenses.some((cs) =>
    Boolean(
      cs && (hasNonEmptyText(cs.definition_vi) || hasNonEmptyText(cs.label_vi) || hasNonEmptyText(cs.definition_en)),
    ),
  );

  return hasResultMeaning || hasCoreSense;
}

const MEMORY_CACHE = new Map<string, CachedDictEntry>();
const IN_FLIGHT_REQUESTS = new Map<string, Promise<unknown>>();
const SESSION_PREFIX = 'lp:dict:';
const SESSION_INDEX_KEY = 'lp:dict:__lru__';
const LEGACY_EXAM_SESSION_KEY = 'lingo_exam_dict_cache_v2';

/**
 * Normalize a word/phrase into a clean lookup key (strips zero-width watermarks & outer punctuation).
 */
export function cleanDictLookupKey(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/^[^\w]+|[^\w]+$/g, '');
}

/**
 * Expand inflections to candidate base lemmas for a single word.
 */
export function getSingleWordCandidateLemmas(clean: string): string[] {
  if (!clean) return [];
  if (clean.length <= 2) return [clean];

  const candidates = new Set<string>([clean]);

  // Plural / 3rd person singular: -ies -> -y (berries -> berry, studies -> study)
  if (clean.endsWith('ies') && clean.length > 4) {
    candidates.add(clean.slice(0, -3) + 'y');
  }
  // -es (boxes -> box, watches -> watch, passes -> pass)
  if (clean.endsWith('es') && clean.length > 3) {
    candidates.add(clean.slice(0, -2));
    candidates.add(clean.slice(0, -1)); // likes -> like
  } else if (clean.endsWith('s') && !clean.endsWith('ss') && !clean.endsWith('us') && !clean.endsWith('is') && clean.length > 3) {
    candidates.add(clean.slice(0, -1)); // cats -> cat, passengers -> passenger
  }

  // Past tense / past participle: -ied -> -y (worried -> worry)
  if (clean.endsWith('ied') && clean.length > 4) {
    candidates.add(clean.slice(0, -3) + 'y');
  }
  // -ed (walked -> walk, liked -> like, stopped -> stop)
  if (clean.endsWith('ed') && clean.length > 3) {
    candidates.add(clean.slice(0, -2));
    candidates.add(clean.slice(0, -1));
    if (clean.length > 4 && clean[clean.length - 3] === clean[clean.length - 4]) {
      candidates.add(clean.slice(0, -3));
    }
  }

  // Gerund / continuous: -ying -> -ie (tying -> tie)
  if (clean.endsWith('ying') && clean.length >= 5) {
    candidates.add(clean.slice(0, -4) + 'ie');
  }
  // -ing (walking -> walk, taking -> take, sitting -> sit, running -> run)
  if (clean.endsWith('ing') && clean.length > 4) {
    candidates.add(clean.slice(0, -3));
    candidates.add(clean.slice(0, -3) + 'e');
    if (clean.length > 5 && clean[clean.length - 4] === clean[clean.length - 5]) {
      candidates.add(clean.slice(0, -4));
    }
  }

  return Array.from(candidates);
}

/**
 * Expand inflections to candidate base lemmas for single words or phrases
 * (e.g. "running" -> "run", "studies" -> "study", "taking into consideration" -> "take into consideration").
 */
export function getCandidateLemmas(word: string): string[] {
  if (!word || typeof word !== 'string') return [];
  const clean = word.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  if (!clean) return [];

  if (clean.includes(' ')) {
    const candidates = new Set<string>([clean]);
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      const firstWordLemmas = getSingleWordCandidateLemmas(parts[0]);
      for (const fl of firstWordLemmas) {
        if (fl !== parts[0]) {
          candidates.add([fl, ...parts.slice(1)].join(' '));
        }
      }
    }
    return Array.from(candidates);
  }

  if (clean.includes('-')) {
    const candidates = new Set<string>(getSingleWordCandidateLemmas(clean));
    const hyphenParts = clean.split('-').filter(Boolean);
    if (hyphenParts.length >= 2) {
      for (const fl of getSingleWordCandidateLemmas(hyphenParts[0])) {
        if (fl !== hyphenParts[0]) {
          candidates.add([fl, ...hyphenParts.slice(1)].join('-'));
        }
      }
    }
    for (const c of Array.from(candidates)) {
      if (c.includes('-')) {
        candidates.add(c.replace(/-/g, ' '));
      }
    }
    return Array.from(candidates);
  }

  return getSingleWordCandidateLemmas(clean);
}

/**
 * Expand words with standard English derivational affixes to candidate base root stems
 * (e.g. "helpless" -> "help", "happiness" -> "happy", "creative" -> "create", "contractor" -> "contract")
 */
export function getDerivationalStems(word: string): string[] {
  const w = word.toLowerCase().trim();
  if (w.length < 4) return [w];
  const stems = new Set<string>();

  // Prefixes
  for (const pre of ['un', 'dis', 'in', 'im', 'ir', 'il', 're', 'mis', 'non']) {
    if (w.startsWith(pre) && w.length > pre.length + 3) {
      stems.add(w.slice(pre.length));
    }
  }

  // Suffixes
  const suffixRules: Array<{ suf: string; replace: string[] }> = [
    { suf: 'lessly', replace: [''] },
    { suf: 'lessly', replace: ['e'] },
    { suf: 'lessness', replace: [''] },
    { suf: 'ful', replace: ['', 'e'] },
    { suf: 'fully', replace: ['', 'e'] },
    { suf: 'fulness', replace: ['', 'e'] },
    { suf: 'less', replace: ['', 'e'] },
    { suf: 'ness', replace: ['', 'e'] },
    { suf: 'ment', replace: ['', 'e'] },
    { suf: 'able', replace: ['', 'e'] },
    { suf: 'ably', replace: ['', 'e'] },
    { suf: 'ibility', replace: ['e', ''] },
    { suf: 'ability', replace: ['e', ''] },
    { suf: 'ible', replace: ['e', ''] },
    { suf: 'ity', replace: ['e', '', 'ous'] },
    { suf: 'ty', replace: [''] },
    { suf: 'tion', replace: ['te', 't', 'e', ''] },
    { suf: 'ation', replace: ['e', 'ate', ''] },
    { suf: 'sion', replace: ['de', 'd', 'se', ''] },
    { suf: 'er', replace: ['', 'e'] },
    { suf: 'or', replace: ['', 'e'] },
    { suf: 'ist', replace: ['', 'e', 'y'] },
    { suf: 'ism', replace: ['', 'e'] },
    { suf: 'ive', replace: ['', 'e', 'ate'] },
    { suf: 'ous', replace: ['', 'e'] },
    { suf: 'ly', replace: ['', 'e', 'ic'] },
    { suf: 'al', replace: ['', 'e'] },
    { suf: 'ic', replace: ['y', 'e', ''] },
    { suf: 'ical', replace: ['y', 'e', ''] },
    { suf: 'ize', replace: ['', 'e', 'y'] },
    { suf: 'ise', replace: ['', 'e', 'y'] },
    { suf: 'en', replace: [''] },
  ];

  for (const { suf, replace } of suffixRules) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const base = w.slice(0, -suf.length);
      for (const r of replace) {
        const candidate = base + r;
        if (candidate.length >= 3 && candidate !== w) {
          stems.add(candidate);
        }
      }
      if (base.endsWith('i') && base.length >= 3) {
        stems.add(base.slice(0, -1) + 'y');
      }
      if (/(.)\1$/.test(base)) {
        stems.add(base.slice(0, -1));
      }
    }
  }

  for (const l of getCandidateLemmas(w)) {
    if (l !== w && l.length >= 3) stems.add(l);
  }

  return Array.from(stems);
}

function getStorageSafe(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function isEntryFresh(entry: CachedDictEntry | null | undefined, now = Date.now()): boolean {
  if (!entry || !entry.data) return false;
  if (typeof entry.ts !== 'number') return true;
  const ttl = typeof entry.ttlMs === 'number' ? entry.ttlMs : DEFAULT_DICT_TTL_MS;
  return now - entry.ts <= ttl;
}

function setL1Entry(key: string, entry: CachedDictEntry): void {
  if (MEMORY_CACHE.has(key)) {
    MEMORY_CACHE.delete(key);
  }
  MEMORY_CACHE.set(key, entry);
  while (MEMORY_CACHE.size > MAX_L1_ENTRIES) {
    const oldest = MEMORY_CACHE.keys().next().value;
    if (oldest !== undefined) {
      MEMORY_CACHE.delete(oldest);
    } else {
      break;
    }
  }
}

function readL2Index(storage: Storage): string[] {
  try {
    const raw = storage.getItem(SESSION_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

function writeL2Index(storage: Storage, keys: string[]): void {
  try {
    storage.setItem(SESSION_INDEX_KEY, JSON.stringify(keys));
  } catch {
    // ignore storage errors
  }
}

function evictOldestL2Entries(storage: Storage, count: number): void {
  try {
    const index = readL2Index(storage);
    if (index.length > 0) {
      const toRemove = index.slice(0, count);
      for (const k of toRemove) {
        storage.removeItem(SESSION_PREFIX + k);
      }
      writeL2Index(storage, index.slice(count));
      return;
    }
    const prefixKeys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(SESSION_PREFIX) && k !== SESSION_INDEX_KEY) {
        prefixKeys.push(k);
        if (prefixKeys.length >= count) break;
      }
    }
    for (const k of prefixKeys) {
      storage.removeItem(k);
    }
  } catch {
    // ignore storage errors
  }
}

function removeL2Entry(key: string): void {
  const storage = getStorageSafe();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_PREFIX + key);
    const index = readL2Index(storage);
    if (index.length > 0) {
      const next = index.filter((k) => k !== key);
      if (next.length !== index.length) {
        writeL2Index(storage, next);
      }
    }
  } catch {
    // ignore
  }
}

function writeL2Entry(key: string, entry: CachedDictEntry): void {
  const storage = getStorageSafe();
  if (!storage) return;

  // Omit examResult from L2 JSON to minimize sessionStorage quota usage
  const compact: CachedDictEntry = {
    word: entry.word,
    data: entry.data,
    source: entry.source,
    ...(entry.imageUrl ? { imageUrl: entry.imageUrl } : {}),
    ts: entry.ts,
    ...(entry.ttlMs !== undefined ? { ttlMs: entry.ttlMs } : {}),
  };
  const serialized = JSON.stringify(compact);

  const attemptWrite = () => {
    storage.setItem(SESSION_PREFIX + key, serialized);
    const index = readL2Index(storage).filter((k) => k !== key);
    index.push(key);
    while (index.length > MAX_L2_ENTRIES) {
      const evicted = index.shift();
      if (evicted) storage.removeItem(SESSION_PREFIX + evicted);
    }
    writeL2Index(storage, index);
  };

  try {
    attemptWrite();
  } catch {
    // QuotaExceededError or private mode: evict oldest 20 entries and retry once
    try {
      evictOldestL2Entries(storage, 20);
      attemptWrite();
    } catch {
      // ignore if still full
    }
  }
}

function buildLookupCandidates(word: string): string[] {
  const rawNorm = word.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  const clean = cleanDictLookupKey(word);
  const set = new Set<string>();
  if (rawNorm) set.add(rawNorm);
  if (clean) {
    for (const lemma of getCandidateLemmas(clean)) {
      set.add(lemma);
    }
  }
  if (rawNorm && rawNorm !== clean) {
    for (const lemma of getCandidateLemmas(rawNorm)) {
      set.add(lemma);
    }
  }
  return Array.from(set).filter(Boolean);
}

/**
 * Retrieve cached dictionary lookup result via bounded L1 memory or lazy L2 sessionStorage with lemma expansion.
 */
export function getCachedDictionaryEntry(word: string): CachedDictEntry | null {
  if (!word || typeof word !== 'string') return null;
  const candidates = buildLookupCandidates(word);
  if (candidates.length === 0) return null;

  const now = Date.now();

  // Tier 1: In-Memory LRU Map (0ms)
  for (const lemma of candidates) {
    const hit = MEMORY_CACHE.get(lemma);
    if (hit) {
      if (isEntryFresh(hit, now)) {
        // Touch LRU
        MEMORY_CACHE.delete(lemma);
        MEMORY_CACHE.set(lemma, hit);
        return hit;
      }
      MEMORY_CACHE.delete(lemma);
      removeL2Entry(lemma);
    }
  }

  // Tier 2: Lazy SessionStorage (<2ms)
  const storage = getStorageSafe();
  if (storage) {
    try {
      for (const lemma of candidates) {
        const raw = storage.getItem(SESSION_PREFIX + lemma);
        if (raw) {
          const parsed = JSON.parse(raw) as CachedDictEntry;
          if (isEntryFresh(parsed, now)) {
            setL1Entry(lemma, parsed);
            return parsed;
          }
          removeL2Entry(lemma);
        }
      }

      // Read-only backward compatibility for legacy monolithic lingo_exam_dict_cache_v2
      const legacyRaw = storage.getItem(LEGACY_EXAM_SESSION_KEY);
      if (legacyRaw) {
        const parsedLegacy = JSON.parse(legacyRaw);
        if (Array.isArray(parsedLegacy)) {
          const candidateSet = new Set(candidates);
          for (const item of parsedLegacy) {
            if (!Array.isArray(item) || item.length < 2) continue;
            const [k, v] = item;
            if (typeof k === 'string' && candidateSet.has(k.toLowerCase()) && v && typeof v === 'object') {
              const promoted: CachedDictEntry = {
                word: k,
                data: v,
                source: 'exam_cache',
                imageUrl: (v as { imageUrl?: string }).imageUrl,
                ts: now,
                examResult: v,
              };
              setL1Entry(k.toLowerCase(), promoted);
              return promoted;
            }
          }
        }
      }
    } catch {
      // ignore storage error
    }
  }

  return null;
}

/**
 * Cache dictionary lookup result in both bounded L1 memory and lazy L2 sessionStorage.
 */
export function setCachedDictionaryEntry(
  word: string,
  data: DictionaryData | object,
  source: string,
  imageUrl?: string,
  options?: SetCachedDictOptions,
): void {
  if (!word || !data) return;
  const rawNorm = word.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  const clean = cleanDictLookupKey(word) || rawNorm;
  if (!clean) return;

  // Preserve intentional inner punctuation (e.g. "balanced (diet)") when rawNorm is well-formed
  const primaryKey = rawNorm.includes('(') && rawNorm.includes(')') ? rawNorm : clean;

  const entry: CachedDictEntry = {
    word: primaryKey,
    data: data as DictionaryData,
    source,
    imageUrl,
    ts: Date.now(),
    ...(options?.ttlMs !== undefined ? { ttlMs: options.ttlMs } : {}),
    ...(options?.examResult !== undefined ? { examResult: options.examResult } : {}),
  };

  setL1Entry(primaryKey, entry);
  writeL2Entry(primaryKey, entry);

  if (options?.aliases) {
    for (const rawAlias of options.aliases) {
      const alias = cleanDictLookupKey(rawAlias);
      if (alias && alias !== primaryKey) {
        setL1Entry(alias, entry);
        writeL2Entry(alias, entry);
      }
    }
  }
}

/**
 * Coalesce concurrent dictionary requests for the same normalized key while isolating per-caller AbortSignal.
 * Aborting one caller NEVER aborts the shared in-flight network request for other concurrent callers.
 */
export function coalesceDictRequest<T>(
  key: string,
  factory: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  const createAbortError = () =>
    typeof DOMException !== 'undefined'
      ? new DOMException('Aborted', 'AbortError')
      : Object.assign(new Error('Aborted'), { name: 'AbortError' });

  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  let shared = IN_FLIGHT_REQUESTS.get(key) as Promise<T> | undefined;
  if (!shared) {
    shared = Promise.resolve()
      .then(() => factory())
      .finally(() => {
        if (IN_FLIGHT_REQUESTS.get(key) === shared) {
          IN_FLIGHT_REQUESTS.delete(key);
        }
      });
    IN_FLIGHT_REQUESTS.set(key, shared);
  }

  if (!signal) {
    return shared;
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(createAbortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
    shared!.then(
      (val) => {
        signal.removeEventListener('abort', onAbort);
        resolve(val);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}
