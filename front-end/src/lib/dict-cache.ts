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
