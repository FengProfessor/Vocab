export interface ExamDictResult {
  word: string;
  cleanWord: string;
  ipa: string;
  pos: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  didYouMean?: string[];
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
 * Sinh danh sách các biến thể từ gốc (lemmas) cho một từ đơn lẻ.
 */
export function getSingleWordCandidateLemmas(clean: string): string[] {
  const candidates = new Set<string>();
  if (!clean || clean.length <= 2) {
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

/**
 * Sinh danh sách các biến thể từ gốc (lemmas) cho từ đơn hoặc cụm từ (phrases).
 * Hỗ trợ chuẩn hóa động từ đầu cụm: ví dụ "taking into consideration" -> "take into consideration",
 * "looked forward to" -> "look forward to".
 */
export function getCandidateLemmas(clean: string): string[] {
  if (!clean) return [];
  if (clean.includes(' ')) {
    const candidates = new Set<string>();
    candidates.add(clean);
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
  return getSingleWordCandidateLemmas(clean);
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
    const json = await res.json();
    if (res.ok) {
      if (json && (json.results?.length > 0 || json.translation || json.definition)) {
        return json;
      }
    } else if (json && Array.isArray(json.didYouMean) && json.didYouMean.length > 0) {
      return { isFuzzyOnly: true, didYouMean: json.didYouMean };
    }
  } catch {
    // Network / timeout / 404
  }
  return null;
}

/**
 * Gọi API dịch câu/cụm từ (/api/translate) cho các cụm từ ngữ cảnh (collocations/phrases)
 * không có trong từ điển từ đơn.
 */
async function queryTranslateEndpoint(text: string, timeoutMs: number): Promise<string | null> {
  try {
    const signal =
      typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
        ? AbortSignal.timeout(timeoutMs)
        : undefined;

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang: 'en',
        targetLang: 'vi',
      }),
      signal,
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && typeof json.translatedText === 'string' && json.translatedText.trim()) {
        return json.translatedText.trim();
      }
    }
  } catch {
    // Translation fallback
  }
  return null;
}

const SESSION_CACHE_KEY = 'lingo_exam_dict_cache_v2';

function hydrateFromSession(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const [k, v] of parsed) {
          if (k && v) memoryCache.set(k, v);
        }
      }
    }
  } catch {
    // Ignore storage parse error
  }
}

function persistToSession(key: string, val: ExamDictResult): void {
  memoryCache.set(key, val);
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(memoryCache.entries()).slice(-150);
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota error
  }
}

// Hydrate ngay khi module được load
hydrateFromSession();

/**
 * Tra cứu nghĩa từ vựng từ từ điển hệ thống với cơ chế caching đa tầng siêu tốc:
 * - SessionStorage + RAM Memory Cache: Trả về kết quả trong 0ms nếu đã từng tra.
 * - Parallel Phrase Lookup: Đối với cụm từ, tra song song Kho từ điển + Dịch máy ngữ cảnh (<250ms).
 * - Parallel Lemma Fallback: Đối với từ chia thì, tra đồng thời các biến thể nguyên mẫu.
 * - Fast Timeout: Giới hạn 2000-2500ms, không bao giờ để giao diện chờ đợi lâu.
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

  // 1. Kiểm tra bộ nhớ đệm (RAM / Session Cache): 0ms
  const cached = memoryCache.get(clean);
  if (cached) {
    return { ...cached, word: rawWord };
  }

  // 2. Gộp các request đồng thời cho cùng 1 từ (Coalescing in-flight)
  const inFlight = inFlightRequests.get(clean);
  if (inFlight) {
    const res = await inFlight;
    return { ...res, word: rawWord };
  }

  const fetchPromise = (async (): Promise<ExamDictResult> => {
    const candidates = getCandidateLemmas(clean);
    const isPhrase = clean.includes(' ');
    let lastDidYouMean: string[] | undefined;

    // ── XỬ LÝ SIÊU TỐC CHO CỤM TỪ (PHRASES / COLLOCATIONS) ──
    if (isPhrase) {
      // Chạy song song: Tra Kho từ điển chuẩn (Tier 1) & Dịch máy ngữ cảnh (Tier 3)
      // Giúp phản hồi ngay trong 150-250ms thay vì đợi 3-5 giây qua các tầng tuần tự!
      const [tier1Res, translateRes] = await Promise.all([
        queryDictEndpoint(`/api/dictionary/lookup?word=${encodeURIComponent(clean)}`, 2500),
        queryTranslateEndpoint(clean, 2500),
      ]);

      if (tier1Res) {
        if (tier1Res.isFuzzyOnly && tier1Res.didYouMean) {
          lastDidYouMean = tier1Res.didYouMean;
        } else {
          const parsed = parseDictPayload(tier1Res, clean, rawWord);
          if (parsed) {
            persistToSession(clean, parsed);
            return parsed;
          }
        }
      }

      // Nếu cụm có biến thể động từ chia thì (looked forward to -> look forward to)
      const phraseVariants = candidates.filter((c) => c !== clean);
      if (phraseVariants.length > 0) {
        const variantData = await queryDictEndpoint(
          `/api/dictionary/lookup?word=${encodeURIComponent(phraseVariants[0])}`,
          1800
        );
        if (variantData && !variantData.isFuzzyOnly) {
          const parsed = parseDictPayload(variantData, clean, rawWord);
          if (parsed) {
            persistToSession(clean, parsed);
            return parsed;
          }
        }
      }

      // Dùng ngay kết quả dịch máy đã nạp song song (Tier 3)
      if (translateRes) {
        const phraseResult: ExamDictResult = {
          word: rawWord,
          cleanWord: clean,
          ipa: '',
          pos: 'cụm từ',
          definition: translateRes,
          synonyms: [],
          antonyms: [],
          didYouMean: lastDidYouMean,
        };
        persistToSession(clean, phraseResult);
        return phraseResult;
      }
    }

    // ── XỬ LÝ TỪ ĐƠN: TIER 1 KHO NỘI BỘ (GLOBAL_DICTIONARY) ──
    // 1. Thử từ chính xác `clean` trước (chiếm >95% các lần tra cứu)
    const exactData = await queryDictEndpoint(
      `/api/dictionary/lookup?word=${encodeURIComponent(clean)}`,
      2500
    );
    if (exactData) {
      if (exactData.isFuzzyOnly && exactData.didYouMean) {
        lastDidYouMean = exactData.didYouMean;
      } else {
        const parsed = parseDictPayload(exactData, clean, rawWord);
        if (parsed) {
          persistToSession(clean, parsed);
          return parsed;
        }
      }
    }

    // 2. Nếu từ chia thì/số nhiều (passengers, stopping), tra SONG SONG các biến thể nguyên mẫu
    const otherCandidates = candidates.filter((c) => c !== clean);
    if (otherCandidates.length > 0) {
      const lemmaResults = await Promise.all(
        otherCandidates.map((c) =>
          queryDictEndpoint(`/api/dictionary/lookup?word=${encodeURIComponent(c)}`, 2000)
        )
      );
      for (const d of lemmaResults) {
        if (d) {
          if (d.isFuzzyOnly && d.didYouMean) {
            lastDidYouMean = lastDidYouMean || d.didYouMean;
          } else {
            const parsed = parseDictPayload(d, clean, rawWord);
            if (parsed) {
              persistToSession(clean, parsed);
              return parsed;
            }
          }
        }
      }
    }

    // ── TIER 2: WIKTIONARY PROXY (/api/dictionary/external) ──
    const extData = await queryDictEndpoint(
      `/api/dictionary/external?word=${encodeURIComponent(clean)}`,
      2500
    );
    if (extData && !extData.isFuzzyOnly) {
      const parsed = parseDictPayload(extData, clean, rawWord);
      if (parsed) {
        persistToSession(clean, parsed);
        return parsed;
      }
    }

    // Thử các biến thể trên Tier 2 song song
    if (otherCandidates.length > 0) {
      const extLemmaResults = await Promise.all(
        otherCandidates.map((c) =>
          queryDictEndpoint(`/api/dictionary/external?word=${encodeURIComponent(c)}`, 2000)
        )
      );
      for (const d of extLemmaResults) {
        if (d && !d.isFuzzyOnly) {
          const parsed = parseDictPayload(d, clean, rawWord);
          if (parsed) {
            persistToSession(clean, parsed);
            return parsed;
          }
        }
      }
    }

    // ── Fallback an toàn nếu không tìm thấy ──
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
      didYouMean: lastDidYouMean,
    };
    persistToSession(clean, fallback);
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
