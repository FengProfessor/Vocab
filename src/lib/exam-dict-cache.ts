export interface ExamDictResult {
  word: string;
  cleanWord: string;
  ipa: string;
  pos: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
}

const memoryCache = new Map<string, ExamDictResult>();
const inFlightRequests = new Map<string, Promise<ExamDictResult>>();

const POS_MAP: Record<string, string> = {
  noun: 'danh từ',
  verb: 'động từ',
  adjective: 'tính từ',
  adj: 'tính từ',
  adverb: 'trạng từ',
  adv: 'trạng từ',
  preposition: 'giới từ',
  prep: 'giới từ',
  conjunction: 'liên từ',
  conj: 'liên từ',
  pronoun: 'đại từ',
  pron: 'đại từ',
  interjection: 'thán từ',
};

/**
 * Sinh danh sách các biến thể từ gốc (lemmas) cho các dạng số nhiều hoặc chia thì.
 * Ví dụ: passengers -> passenger, observed -> observe, walking -> walk.
 */
export function getCandidateLemmas(clean: string): string[] {
  const candidates = new Set<string>();
  if (!clean || clean.includes(' ') || clean.length <= 2) {
    return [clean];
  }

  candidates.add(clean);

  // Plural / 3rd person singular: -ies -> -y (berries -> berry)
  if (clean.endsWith('ies') && clean.length > 4) {
    candidates.add(clean.slice(0, -3) + 'y');
  }
  // -es (boxes -> box, watches -> watch, passes -> pass)
  if (clean.endsWith('es') && clean.length > 3) {
    candidates.add(clean.slice(0, -2));
    candidates.add(clean.slice(0, -1)); // likes -> like
  } else if (clean.endsWith('s') && clean.length > 3) {
    candidates.add(clean.slice(0, -1));
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
  // -ing (walking -> walk, taking -> take, sitting -> sit)
  if (clean.endsWith('ing') && clean.length > 4) {
    candidates.add(clean.slice(0, -3));
    candidates.add(clean.slice(0, -3) + 'e');
    if (clean.length > 5 && clean[clean.length - 4] === clean[clean.length - 5]) {
      candidates.add(clean.slice(0, -4));
    }
  }

  return Array.from(candidates);
}

function parseDictPayload(data: any, cleanWord: string, rawWord: string): ExamDictResult | null {
  if (!data) return null;
  const meanings = data?.results?.[0]?.meanings || [];
  const primaryMeaning = meanings[0];

  const definition =
    primaryMeaning?.definition ||
    primaryMeaning?.meaning_vi ||
    data?.translation ||
    data?.results?.[0]?.definition ||
    data?.definition ||
    '';

  if (!definition || definition.trim().length === 0) {
    return null;
  }

  const rawIpa =
    data?.pronunciations?.[0]?.ipa ||
    data?.ipa ||
    data?.results?.[0]?.pronunciations?.[0]?.ipa ||
    '';
  const ipa = rawIpa ? `/${rawIpa.replace(/^\/|\/$/g, '')}/` : '';

  const rawPos = (primaryMeaning?.pos || data?.pos || '').toLowerCase();
  const pos = POS_MAP[rawPos] || rawPos;

  const synonyms = Array.isArray(data?.synonyms) ? data.synonyms.slice(0, 4) : [];
  const antonyms = Array.isArray(data?.antonyms) ? data.antonyms.slice(0, 4) : [];

  return {
    word: rawWord,
    cleanWord,
    ipa,
    pos,
    definition,
    synonyms,
    antonyms,
  };
}

async function queryDictEndpoint(url: string, timeoutMs: number): Promise<any | null> {
  try {
    const signal =
      typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
        ? AbortSignal.timeout(timeoutMs)
        : undefined;

    const res = await fetch(url, { signal });
    if (res.ok) {
      const json = await res.json();
      if (json && (json.results?.length > 0 || json.translation || json.definition)) {
        return json;
      }
    }
  } catch {
    // Network / timeout / 404
  }
  return null;
}

/**
 * Tra cứu nghĩa từ vựng từ từ điển hệ thống với cơ chế caching đa tầng:
 * - Tier 1: Kho từ điển nội bộ trong Supabase (global_dictionary)
 * - Lemma Fallback: Tự động tra từ nguyên thể cho từ số nhiều/chia thì nếu từ gốc chưa có
 * - Tier 2: Wiktionary API proxy (/api/dictionary/external) tự động cache ngược vào kho
 * Trả về giải nghĩa, từ loại, phiên âm IPA trong 0ms nếu đã có trong cache.
 */
export async function fetchExamWordDict(rawWord: string): Promise<ExamDictResult> {
  const clean = rawWord.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^[^\w]+|[^\w]+$/g, '');
  if (!clean) {
    return {
      word: rawWord,
      cleanWord: clean,
      ipa: '',
      pos: '',
      definition: 'Từ không hợp lệ.',
      synonyms: [],
      antonyms: [],
    };
  }

  // 1. Check memory cache
  const cached = memoryCache.get(clean);
  if (cached) {
    return { ...cached, word: rawWord };
  }

  // 2. Coalesce concurrent requests for the exact same word
  const inFlight = inFlightRequests.get(clean);
  if (inFlight) {
    const res = await inFlight;
    return { ...res, word: rawWord };
  }

  const fetchPromise = (async (): Promise<ExamDictResult> => {
    const candidates = getCandidateLemmas(clean);

    // ── Tier 1: Tra kho từ điển nội bộ (global_dictionary) ──
    for (const wordVariant of candidates) {
      const data = await queryDictEndpoint(
        `/api/dictionary/lookup?word=${encodeURIComponent(wordVariant)}`,
        4000
      );
      if (data) {
        const parsed = parseDictPayload(data, clean, rawWord);
        if (parsed) {
          memoryCache.set(clean, parsed);
          return parsed;
        }
      }
    }

    // ── Tier 2: Tra Wiktionary proxy (/api/dictionary/external, tự động cache ngược vào kho) ──
    for (const wordVariant of candidates) {
      const data = await queryDictEndpoint(
        `/api/dictionary/external?word=${encodeURIComponent(wordVariant)}`,
        6000
      );
      if (data) {
        const parsed = parseDictPayload(data, clean, rawWord);
        if (parsed) {
          memoryCache.set(clean, parsed);
          return parsed;
        }
      }
    }

    // ── Fallback an toàn nếu cả 2 nguồn đều không có hoặc thiết bị offline ──
    const isPhrase = clean.includes(' ');
    const fallback: ExamDictResult = {
      word: rawWord,
      cleanWord: clean,
      ipa: '',
      pos: isPhrase ? 'cụm từ' : '',
      definition: isPhrase
        ? 'Cụm từ tiếng Anh. Bấm "Lưu vào Sổ từ" để hệ thống tự động đồng bộ và phân tích.'
        : 'Từ vựng tiếng Anh. Bấm "Lưu vào Sổ từ" để hệ thống tự động đồng bộ và phân tích.',
      synonyms: [],
      antonyms: [],
    };
    memoryCache.set(clean, fallback);
    return fallback;
  })();

  inFlightRequests.set(clean, fetchPromise);
  try {
    const result = await fetchPromise;
    return result;
  } finally {
    inFlightRequests.delete(clean);
  }
}

/**
 * Kiểm tra xem từ vựng đã được lưu trong localStorage chưa (cho cả khách và học viên).
 */
export function isWordSavedLocally(cleanWord: string): boolean {
  if (typeof window === 'undefined' || !cleanWord) return false;
  const target = cleanWord.trim().toLowerCase();
  if (!target) return false;
  try {
    const stored = localStorage.getItem('lingo_saved_words');
    if (!stored) return false;
    const localWords = JSON.parse(stored);
    if (!Array.isArray(localWords)) return false;
    return localWords.some((w) => typeof w === 'string' && w.toLowerCase() === target);
  } catch {
    return false;
  }
}

/**
 * Lưu từ vựng vào localStorage (hỗ trợ Guest & Offline fallback).
 * Tự động phục hồi nếu dữ liệu storage trước đó bị hỏng (corrupted JSON).
 */
export function saveWordLocally(cleanWord: string): void {
  if (typeof window === 'undefined' || !cleanWord) return;
  const target = cleanWord.trim().toLowerCase();
  if (!target) return;

  try {
    let localWords: string[] = [];
    try {
      const stored = localStorage.getItem('lingo_saved_words');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localWords = parsed;
        }
      }
    } catch {
      localWords = [];
    }

    if (!localWords.some((w) => typeof w === 'string' && w.toLowerCase() === target)) {
      localWords.push(target);
      localStorage.setItem('lingo_saved_words', JSON.stringify(localWords));
    }
  } catch {
    // Ignore localStorage quota errors
  }
}
