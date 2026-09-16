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

/**
 * Tra cứu nghĩa từ vựng từ từ điển hệ thống với cơ chế caching đa tầng.
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
    try {
      const res = await fetch(`/api/dictionary/lookup?word=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        const meanings = data?.results?.[0]?.meanings || [];
        const primaryMeaning = meanings[0];
        
        // Extract definition with fallback chain
        const definition =
          primaryMeaning?.definition ||
          primaryMeaning?.meaning_vi ||
          data?.translation ||
          data?.results?.[0]?.definition ||
          'Chưa có giải nghĩa chi tiết.';

        // Extract IPA
        const rawIpa = data?.pronunciations?.[0]?.ipa || data?.ipa || '';
        const ipa = rawIpa ? `/${rawIpa.replace(/^\/|\/$/g, '')}/` : '';

        // Extract Part of Speech
        const rawPos = primaryMeaning?.pos || data?.pos || '';
        const posMap: Record<string, string> = {
          noun: 'danh từ',
          verb: 'động từ',
          adjective: 'tính từ',
          adverb: 'trạng từ',
          preposition: 'giới từ',
          conjunction: 'liên từ',
          pronoun: 'đại từ',
          interjection: 'thán từ',
        };
        const pos = posMap[rawPos.toLowerCase()] || rawPos;

        const synonyms = Array.isArray(data?.synonyms) ? data.synonyms.slice(0, 4) : [];
        const antonyms = Array.isArray(data?.antonyms) ? data.antonyms.slice(0, 4) : [];

        const result: ExamDictResult = {
          word: rawWord,
          cleanWord: clean,
          ipa,
          pos,
          definition,
          synonyms,
          antonyms,
        };

        memoryCache.set(clean, result);
        return result;
      }
    } catch (err) {
      console.warn('[ExamDictCache] Lookup failed for:', clean, err instanceof Error ? err.message : err);
    }

    // Graceful fallback (differentiates between single words and phrases)
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
