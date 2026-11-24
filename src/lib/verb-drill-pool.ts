import { GRADE_11_TEACHER_PACKS } from '@/data/teacher-packs/grade11-global-success';
import { parseIpa } from '@/lib/study';
import {
  cleanBareIpaString,
  extractCleanBareIpa,
  getLookupCandidateKeys,
  resolveStaticVocabFallback,
  type GlobalDictRowInput,
} from '@/lib/vocab-entry-resolver';
import { classifyWord } from '@/lib/word-classifier';

export interface VerbDrillRawWord {
  id: string;
  word: string;
  translation: string | null;
  pos: string | null;
  ipa: string | null;
  example: string | null;
  image_url: string | null;
  image_source: string | null;
  image_confidence: number | null;
}

export interface VerbDrillPoolItem {
  id: string;
  lemma: string;
  vi: string;
  pos: string;
  ipa: string;
  example: string;
  imageUrl?: string;
}

const MIN_VERIFIED_CONFIDENCE = 65;
const MIN_GENERATIVE_CONFIDENCE = 80;
const UNVERIFIED_SCRAPER_SOURCES = new Set(['duckduckgo', 'openverse']);

let cachedPresetIpaMap: Map<string, string> | null = null;

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Returns bare IPA from curated Grade 11 teacher vocabulary presets if present.
 */
export function getTeacherPresetIpa(rawWord: string): string {
  if (!cachedPresetIpaMap) {
    const map = new Map<string, string>();
    for (const pack of GRADE_11_TEACHER_PACKS) {
      for (const item of pack.items) {
        const key = normalizeKey(item.word);
        const cleaned = cleanBareIpaString(item.ipa, item.word);
        if (key && cleaned && !map.has(key)) {
          map.set(key, cleaned);
        }
      }
    }
    cachedPresetIpaMap = map;
  }

  for (const key of getLookupCandidateKeys(rawWord)) {
    const hit = cachedPresetIpaMap.get(normalizeKey(key));
    if (hit) return hit;
  }
  return '';
}

/**
 * Resolves a valid, cleaned bare IPA from word row, static curriculum packs, presets, or global_dictionary.
 */
export function resolveBestBareIpa(
  rawIpa: string | null | undefined,
  rawWord: string,
  gdMap?: Map<string, GlobalDictRowInput>,
): string {
  const fromRow = cleanBareIpaString(rawIpa, rawWord) || parseIpa(rawIpa ?? undefined).replace(/^\/+|\/+$/g, '');
  if (fromRow) return fromRow;

  const fromStatic = cleanBareIpaString(resolveStaticVocabFallback(rawWord)?.ipa, rawWord);
  if (fromStatic) return fromStatic;

  const fromPreset = getTeacherPresetIpa(rawWord);
  if (fromPreset) return fromPreset;

  if (gdMap && gdMap.size > 0) {
    for (const key of getLookupCandidateKeys(rawWord)) {
      const row = gdMap.get(key);
      if (!row) continue;
      const fromGd = extractCleanBareIpa(row.data, rawWord);
      if (fromGd) return fromGd;
    }
  }

  return '';
}

/**
 * Clamps Pexels/Unsplash query dimensions to fast mobile-friendly thumbnails (~480px)
 * while leaving signed URLs (Pixabay, Supabase, etc.) untouched.
 */
export function optimizeQuizImageUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    if (host === 'images.pexels.com') {
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      u.searchParams.set('w', '480');
      u.searchParams.set('dpr', '1');
      u.searchParams.delete('h');
      return u.toString();
    }
    if (host === 'images.unsplash.com') {
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', '480');
      u.searchParams.set('q', '75');
      return u.toString();
    }
  } catch {
    // ignore malformed URL; caller handles validation
  }
  return rawUrl;
}

/**
 * Filters out slow generative images, low-confidence Vision mismatches, and unverified web scrapes
 * so the quick-pick quiz only displays crisp, meaning-accurate visuals.
 */
export function selectReliableQuizImageUrl(input: {
  word: string;
  pos?: string | null;
  translation?: string | null;
  imageUrl?: string | null;
  imageSource?: string | null;
  imageConfidence?: number | null;
}): string | undefined {
  const url = (input.imageUrl || '').trim();
  const isHttp = /^https?:\/\//i.test(url);
  const isRelative = url.startsWith('/') && !url.startsWith('//');
  if (!url || (!isHttp && !isRelative)) return undefined;

  const wordClass = classifyWord(input.word, input.pos || '', input.translation || '');
  if (wordClass === 'function') return undefined;

  const src = (input.imageSource || '').trim().toLowerCase();
  const conf = typeof input.imageConfidence === 'number' ? input.imageConfidence : null;

  if (src === 'none' || src === 'skip-function' || src.endsWith('-low')) {
    return undefined;
  }
  if (conf !== null && conf < MIN_VERIFIED_CONFIDENCE) {
    return undefined;
  }

  const isPollinationsHost = url.toLowerCase().includes('pollinations.ai');
  if (src === 'pollinations' || isPollinationsHost) {
    // Pollinations is slow on mobile and unreliable unless Vision scored it very high
    if (conf === null || conf < MIN_GENERATIVE_CONFIDENCE) {
      return undefined;
    }
  }

  if (UNVERIFIED_SCRAPER_SOURCES.has(src) && conf === null) {
    return undefined;
  }

  if (src === 'wikipedia' && wordClass === 'abstract' && conf === null) {
    return undefined;
  }

  return optimizeQuizImageUrl(url);
}
