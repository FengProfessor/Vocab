/**
 * Unified Client Dictionary Cache
 * Multi-tier caching: In-Memory Map (0ms) + sessionStorage (<2ms) + Lemma Expansion
 */

export interface CachedDictEntry {
  word: string;
  data: any;
  source: string;
  imageUrl?: string;
  ts: number;
}

const MEMORY_CACHE = new Map<string, CachedDictEntry>();
const SESSION_PREFIX = 'lp:dict:';

/**
 * Expand inflections to candidate base lemmas (e.g. "running" -> "run", "studies" -> "study")
 */
export function getCandidateLemmas(word: string): string[] {
  const clean = word.trim().toLowerCase();
  const candidates: string[] = [clean];

  if (clean.endsWith('ing')) {
    const stem = clean.slice(0, -3);
    candidates.push(stem);
    if (/(.)\1$/.test(stem)) candidates.push(stem.slice(0, -1)); // running -> run
    candidates.push(stem + 'e'); // caring -> care
  } else if (clean.endsWith('ed')) {
    const stem = clean.slice(0, -2);
    candidates.push(stem);
    if (/(.)\1$/.test(stem)) candidates.push(stem.slice(0, -1)); // stopped -> stop
    candidates.push(stem + 'e'); // loved -> love
  } else if (clean.endsWith('ies')) {
    candidates.push(clean.slice(0, -3) + 'y'); // studies -> study
  } else if (clean.endsWith('es')) {
    candidates.push(clean.slice(0, -2)); // watches -> watch
    candidates.push(clean.slice(0, -1));
  } else if (clean.endsWith('s') && !clean.endsWith('ss')) {
    candidates.push(clean.slice(0, -1)); // cats -> cat
  }

  return Array.from(new Set(candidates));
}

/**
 * Retrieve cached dictionary lookup result via memory or sessionStorage with lemma expansion.
 */
export function getCachedDictionaryEntry(word: string): CachedDictEntry | null {
  if (!word) return null;
  const clean = word.trim().toLowerCase();

  // Tier 1: In-Memory Map (0ms)
  for (const lemma of getCandidateLemmas(clean)) {
    const hit = MEMORY_CACHE.get(lemma);
    if (hit) return hit;
  }

  // Tier 2: SessionStorage (<2ms)
  if (typeof window !== 'undefined') {
    try {
      for (const lemma of getCandidateLemmas(clean)) {
        const raw = sessionStorage.getItem(SESSION_PREFIX + lemma);
        if (raw) {
          const parsed = JSON.parse(raw) as CachedDictEntry;
          if (parsed && parsed.data) {
            MEMORY_CACHE.set(lemma, parsed); // promote to Tier 1
            return parsed;
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
 * Cache dictionary lookup result in both memory and sessionStorage.
 */
export function setCachedDictionaryEntry(
  word: string,
  data: any,
  source: string,
  imageUrl?: string,
): void {
  if (!word || !data) return;
  const clean = word.trim().toLowerCase();
  const entry: CachedDictEntry = {
    word: clean,
    data,
    source,
    imageUrl,
    ts: Date.now(),
  };

  MEMORY_CACHE.set(clean, entry);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(SESSION_PREFIX + clean, JSON.stringify(entry));
    } catch {
      // ignore quota error
    }
  }
}
