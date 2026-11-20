import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import {
  notifyWordSaveRollback,
  notifyWordSavedOptimistic,
} from '@/lib/word-summary-cache';
import {
  isFreeWordLimitError,
  requestUpsell,
  upsellFromWordLimitError,
  WORD_NEAR_LIMIT_USED,
  type UpsellPayload,
} from '@/lib/upsell';
import {
  cleanDictLookupKey,
  coalesceDictRequest,
  FALLBACK_DICT_TTL_MS,
  getCachedDictionaryEntry,
  getCandidateLemmas,
  getSingleWordCandidateLemmas,
  setCachedDictionaryEntry,
} from '@/lib/dict-cache';

function sanitizeClientMediaUrl(rawUrl: unknown): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return trimmed;
  }
  return undefined;
}

export interface ExamDictPhrase {
  phrase: string;
  meaning: string;
  imageUrl?: string;
}

export interface ExamDictSense {
  definition: string;
  pos?: string;
  example?: string;
  exampleVi?: string;
  cefr?: string;
}

export interface ExamDictResult {
  word: string;
  cleanWord: string;
  ipa: string;
  pos: string;
  definition: string;
  meanings?: ExamDictSense[];
  synonyms: string[];
  antonyms: string[];
  didYouMean?: string[];
  imageUrl?: string;
  phrases?: ExamDictPhrase[];
  example?: string;
  exampleVi?: string;
  toeicTip?: string;
  wordFamily?: string[];
  audioUs?: string;
  audioUk?: string;
}

export type ExamWordDictResult = ExamDictResult;

export interface FetchExamWordDictOptions {
  signal?: AbortSignal;
  contextSentence?: string;
  coreEntry?: Partial<ExamDictResult> & { definition: string };
}

export { getSingleWordCandidateLemmas, getCandidateLemmas };

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

interface RawDictCoreSense {
  definition_vi?: string;
  label_vi?: string;
  definition_en?: string;
  pos?: string;
  example?: string;
  example_vi?: string;
  cefr?: string;
}

interface RawDictMeaning {
  isPrimary?: boolean;
  definition?: string;
  meaning_vi?: string;
  meaning?: string;
  pos?: string;
  part_of_speech?: string;
  ipa?: string;
  example?: string;
  example_vi?: string;
  exampleVi?: string;
  toeic_tip?: string;
  toeicTip?: string;
  cefr?: string;
  synonyms?: string[];
  antonyms?: string[];
  familyWords?: string[];
  word_family?: string[];
  wordFamily?: string[];
  image_url?: string;
  imageUrl?: string;
}

interface RawDictPhrase {
  phrase?: string;
  text?: string;
  meaning?: string;
  meaning_vi?: string;
  image_url?: string;
  imageUrl?: string;
}

interface RawDictPayload {
  word?: string;
  cleanWord?: string;
  source?: string;
  translatedText?: string;
  core_senses?: RawDictCoreSense[];
  results?: Array<{
    meanings?: RawDictMeaning[];
    pronunciations?: Array<{ ipa?: string }>;
    definition?: string;
  }>;
  meanings?: RawDictMeaning[];
  translation?: string;
  definition?: string;
  pronunciations?: Array<{ ipa?: string }>;
  ipa?: string;
  pos?: string;
  synonyms?: string[];
  antonyms?: string[];
  example?: string;
  example_vi?: string;
  exampleVi?: string;
  toeic_tip?: string;
  toeicTip?: string;
  familyWords?: string[];
  word_family?: string[];
  wordFamily?: string[];
  image_url?: string;
  imageUrl?: string;
  audio_us?: string;
  audioUs?: string;
  audio_url?: string;
  audioUrl?: string;
  audio_uk?: string;
  audioUk?: string;
  phrases?: RawDictPhrase[];
  isFuzzyOnly?: boolean;
  didYouMean?: string[];
}

export function parseDictPayload(
  rawData: unknown,
  cleanWord: string,
  rawWord: string,
): ExamDictResult | null {
  if (!rawData || typeof rawData !== 'object') return null;
  const data = rawData as RawDictPayload;
  const coreSenses = Array.isArray(data.core_senses) ? data.core_senses : [];
  const meanings: RawDictMeaning[] = data.results?.[0]?.meanings || data.meanings || [];
  const primaryMeaning: RawDictMeaning | undefined =
    meanings.find((m) => m?.isPrimary) ||
    (coreSenses[0]
      ? {
          definition: coreSenses[0].definition_vi || coreSenses[0].label_vi || coreSenses[0].definition_en,
          pos: coreSenses[0].pos,
          example: coreSenses[0].example,
          example_vi: coreSenses[0].example_vi,
        }
      : undefined) ||
    meanings[0];

  const definition =
    primaryMeaning?.definition ||
    primaryMeaning?.meaning_vi ||
    primaryMeaning?.meaning ||
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
    primaryMeaning?.ipa ||
    '';
  const ipa = rawIpa ? `/${rawIpa.replace(/^\/|\/$/g, '')}/` : '';

  const rawPos = (
    primaryMeaning?.part_of_speech ||
    primaryMeaning?.pos ||
    data?.pos ||
    ''
  ).toLowerCase();
  const pos = POS_MAP[rawPos] || rawPos;

  const synonyms = Array.isArray(data?.synonyms)
    ? data.synonyms.slice(0, 4)
    : Array.isArray(primaryMeaning?.synonyms)
    ? primaryMeaning.synonyms.slice(0, 4)
    : [];

  const antonyms = Array.isArray(data?.antonyms)
    ? data.antonyms.slice(0, 4)
    : Array.isArray(primaryMeaning?.antonyms)
    ? primaryMeaning.antonyms.slice(0, 4)
    : [];

  const example =
    primaryMeaning?.example ||
    data?.example ||
    undefined;

  const exampleVi =
    primaryMeaning?.example_vi ||
    primaryMeaning?.exampleVi ||
    data?.example_vi ||
    data?.exampleVi ||
    undefined;

  const toeicTip =
    primaryMeaning?.toeic_tip ||
    primaryMeaning?.toeicTip ||
    data?.toeic_tip ||
    data?.toeicTip ||
    undefined;

  const rawWordFamily =
    data?.familyWords ||
    primaryMeaning?.familyWords ||
    primaryMeaning?.word_family ||
    primaryMeaning?.wordFamily ||
    data?.word_family ||
    data?.wordFamily;
  const wordFamily =
    Array.isArray(rawWordFamily) && rawWordFamily.length > 0
      ? rawWordFamily
      : undefined;

  const rawImageUrl =
    data?.image_url ||
    data?.imageUrl ||
    primaryMeaning?.image_url ||
    primaryMeaning?.imageUrl;
  const imageUrl = sanitizeClientMediaUrl(rawImageUrl);

  const rawAudioUs =
    data?.audio_us ||
    data?.audioUs ||
    data?.audio_url ||
    data?.audioUrl;
  const audioUs = sanitizeClientMediaUrl(rawAudioUs);

  const rawAudioUk = data?.audio_uk || data?.audioUk;
  const audioUk = sanitizeClientMediaUrl(rawAudioUk);

  const rawPhrases = Array.isArray(data.phrases) ? data.phrases : [];
  const phrases: ExamDictPhrase[] = rawPhrases
    .map((p) => ({
      phrase: p?.phrase || p?.text || '',
      meaning: p?.meaning || p?.meaning_vi || '',
      imageUrl: sanitizeClientMediaUrl(p?.image_url || p?.imageUrl),
    }))
    .filter((p: ExamDictPhrase) => Boolean(p.phrase && p.meaning));

  const extractedSenses: ExamDictSense[] = [];
  const seenDefs = new Set<string>();

  const addSense = (def?: string, sensePos?: string, ex?: string, exVi?: string, cefr?: string) => {
    if (!def || typeof def !== 'string') return;
    const trimmed = def.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seenDefs.has(key)) return;
    seenDefs.add(key);
    extractedSenses.push({
      definition: trimmed,
      pos: sensePos ? POS_MAP[sensePos.toLowerCase()] || sensePos : undefined,
      example: ex,
      exampleVi: exVi,
      cefr,
    });
  };

  for (const cs of coreSenses) {
    addSense(
      cs?.definition_vi || cs?.label_vi || cs?.definition_en,
      cs?.pos,
      cs?.example,
      cs?.example_vi,
      cs?.cefr
    );
  }

  for (const m of meanings) {
    addSense(
      m?.definition || m?.meaning_vi || m?.meaning,
      m?.pos || m?.part_of_speech,
      m?.example,
      m?.example_vi || m?.exampleVi,
      m?.cefr
    );
  }

  if (definition && !seenDefs.has(definition.trim().toLowerCase())) {
    extractedSenses.unshift({
      definition: definition.trim(),
      pos,
      example,
      exampleVi,
    });
  }

  return {
    word: rawWord,
    cleanWord,
    ipa,
    pos,
    definition,
    synonyms,
    antonyms,
    ...(Array.isArray(data.didYouMean) && data.didYouMean.length > 0 ? { didYouMean: data.didYouMean } : {}),
    ...(extractedSenses.length > 0 ? { meanings: extractedSenses } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(phrases.length > 0 ? { phrases } : {}),
    ...(example ? { example } : {}),
    ...(exampleVi ? { exampleVi } : {}),
    ...(toeicTip ? { toeicTip } : {}),
    ...(wordFamily ? { wordFamily } : {}),
    ...(audioUs ? { audioUs } : {}),
    ...(audioUk ? { audioUk } : {}),
  };
}

async function queryDictEndpoint(url: string, timeoutMs: number): Promise<RawDictPayload | null> {
  try {
    const signal =
      typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
        ? AbortSignal.timeout(timeoutMs)
        : undefined;

    const res = await fetch(url, { signal });
    const json = await res.json();
    if (res.ok) {
      if (
        json &&
        (json.results?.length > 0 ||
          json.core_senses?.length > 0 ||
          json.translation ||
          json.definition ||
          json.translatedText)
      ) {
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

/**
 * Synchronous 0ms cache peek across unified L1 RAM + L2 sessionStorage.
 */
export function peekExamWordDict(rawWord: string): ExamDictResult | null {
  const clean = cleanDictLookupKey(rawWord);
  if (!clean) return null;
  const cached = getCachedDictionaryEntry(clean);
  if (!cached) return null;

  if (cached.examResult && typeof cached.examResult === 'object') {
    return {
      ...(cached.examResult as ExamDictResult),
      word: rawWord,
      cleanWord: clean,
    };
  }

  if (cached.data) {
    const parsed = parseDictPayload(cached.data, clean, rawWord);
    if (parsed) {
      cached.examResult = parsed;
      return parsed;
    }
  }
  return null;
}

/**
 * Tra cứu nghĩa từ vựng từ từ điển hệ thống với cơ chế caching đa tầng siêu tốc:
 * - Unified L1 RAM + L2 sessionStorage (`lp:dict:`): Trả về kết quả trong 0ms nếu đã từng tra.
 * - Coalescing: Gộp các request đồng thời cho cùng từ (cô lập AbortSignal cho từng caller).
 * - Single HTTP Request on miss: `GET /api/dictionary/lookup?word=<clean>&fallback=external`.
 *   Server tự giải quyết inflectional lemmas và external fallback trong 1 round-trip.
 */
export async function fetchExamWordDict(
  rawWord: string,
  options?: FetchExamWordDictOptions,
): Promise<ExamDictResult> {
  const clean = cleanDictLookupKey(rawWord);
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

  if (options?.coreEntry?.definition) {
    const existing = peekExamWordDict(rawWord);
    return {
      ipa: '',
      pos: '',
      synonyms: [],
      antonyms: [],
      ...(existing ?? {}),
      ...options.coreEntry,
      word: rawWord,
      cleanWord: clean,
    };
  }

  // 1. Kiểm tra bộ nhớ đệm hợp nhất (L1 RAM + lazy L2 sessionStorage): 0ms, 0 HTTP requests
  const syncHit = peekExamWordDict(rawWord);
  if (syncHit) {
    return syncHit;
  }

  // 2. Gộp các request đồng thời cho cùng 1 từ với AbortSignal cô lập
  return coalesceDictRequest(
    clean,
    async (): Promise<ExamDictResult> => {
      const rechecked = peekExamWordDict(rawWord);
      if (rechecked) return rechecked;

      const isPhrase = clean.includes(' ');
      let lastDidYouMean: string[] | undefined;

      if (!isPhrase) {
        // Single-word fast-path: 1 HTTP request handles internal + lemmas + external fallback
        const data = await queryDictEndpoint(
          `/api/dictionary/lookup?word=${encodeURIComponent(clean)}&fallback=external`,
          4500,
        );
        if (data) {
          if (data.isFuzzyOnly && data.didYouMean) {
            lastDidYouMean = data.didYouMean;
          } else {
            const parsed = parseDictPayload(data, clean, rawWord);
            if (parsed) {
              const wordKey = cleanDictLookupKey(String(data.word || ''));
              const cleanWordKey = cleanDictLookupKey(String(data.cleanWord || ''));
              const resolvedKey = cleanWordKey || wordKey || clean;
              const aliasSet = new Set<string>([clean, wordKey, cleanWordKey].filter(Boolean));
              aliasSet.delete(resolvedKey);
              setCachedDictionaryEntry(
                resolvedKey,
                data,
                String(data.source || 'Kho từ điển'),
                data.image_url || data.imageUrl,
                {
                  aliases: aliasSet.size > 0 ? Array.from(aliasSet) : undefined,
                  examResult: parsed,
                },
              );
              return parsed;
            }
          }
        }
      } else {
        // Phrase lookup: 1 request with ?fallback=translate; fallback to POST /api/translate if needed
        const phraseData = await queryDictEndpoint(
          `/api/dictionary/lookup?word=${encodeURIComponent(clean)}&fallback=translate`,
          2500,
        );
        if (phraseData) {
          if (phraseData.isFuzzyOnly && phraseData.didYouMean) {
            lastDidYouMean = phraseData.didYouMean;
          } else if (
            typeof phraseData.translatedText === 'string' &&
            phraseData.translatedText.trim() &&
            !phraseData.results?.length &&
            !phraseData.definition
          ) {
            const phraseResult: ExamDictResult = {
              word: rawWord,
              cleanWord: clean,
              ipa: '',
              pos: 'cụm từ',
              definition: phraseData.translatedText.trim(),
              synonyms: [],
              antonyms: [],
            };
            setCachedDictionaryEntry(clean, phraseResult, 'translate', undefined, {
              examResult: phraseResult,
            });
            return phraseResult;
          } else {
            const parsed = parseDictPayload(phraseData, clean, rawWord);
            if (parsed) {
              const wordKey = cleanDictLookupKey(String(phraseData.word || ''));
              const cleanWordKey = cleanDictLookupKey(String(phraseData.cleanWord || ''));
              const resolvedKey = cleanWordKey || wordKey || clean;
              const aliasSet = new Set<string>([clean, wordKey, cleanWordKey].filter(Boolean));
              aliasSet.delete(resolvedKey);
              setCachedDictionaryEntry(
                resolvedKey,
                phraseData,
                String(phraseData.source || 'Kho từ điển'),
                phraseData.image_url || phraseData.imageUrl,
                {
                  aliases: aliasSet.size > 0 ? Array.from(aliasSet) : undefined,
                  examResult: parsed,
                },
              );
              return parsed;
            }
          }
        }

        if (!lastDidYouMean) {
          const translateRes = await queryTranslateEndpoint(clean, 2500);
          if (translateRes) {
            const phraseResult: ExamDictResult = {
              word: rawWord,
              cleanWord: clean,
              ipa: '',
              pos: 'cụm từ',
              definition: translateRes,
              synonyms: [],
              antonyms: [],
            };
            setCachedDictionaryEntry(clean, phraseResult, 'translate', undefined, {
              examResult: phraseResult,
            });
            return phraseResult;
          }
        }
      }

      // ── Fallback an toàn (TTL ngắn 30s để phục hồi nhanh khi mạng ổn định) ──
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
      setCachedDictionaryEntry(clean, fallback, 'fallback', undefined, {
        ttlMs: FALLBACK_DICT_TTL_MS,
        examResult: fallback,
      });
      return fallback;
    },
    options?.signal,
  );
}

const SAVED_WORDS_KEY = 'lingo_saved_words';
const SAVED_MEANINGS_KEY = 'lingo_saved_meanings';

function normalizeTranslationStorageKey(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,;!?:"'()]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Lấy danh sách các nghĩa đã lưu cục bộ của một từ.
 */
export function getSavedMeaningsLocally(cleanWord: string): string[] {
  if (typeof window === 'undefined' || !cleanWord) return [];
  const target = cleanWord.trim().toLowerCase();
  if (!target) return [];
  try {
    const raw = localStorage.getItem(SAVED_MEANINGS_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw);
    if (typeof map !== 'object' || map === null) return [];
    const list = map[target];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Kiểm tra xem một nghĩa cụ thể của từ đã được lưu cục bộ chưa.
 */
export function isMeaningSavedLocally(cleanWord: string, translation: string): boolean {
  if (typeof window === 'undefined' || !cleanWord || !translation) return false;
  const target = cleanWord.trim().toLowerCase();
  const targetTrans = normalizeTranslationStorageKey(translation);
  if (!target || !targetTrans) return false;

  const savedList = getSavedMeaningsLocally(target);
  return savedList.some((s) => {
    const norm = normalizeTranslationStorageKey(s);
    return norm === targetTrans || (norm.length >= 3 && targetTrans.length >= 3 && (norm.includes(targetTrans) || targetTrans.includes(norm)));
  });
}

function isExactMeaningSavedLocally(cleanWord: string, translation: string): boolean {
  if (typeof window === 'undefined' || !cleanWord || !translation) return false;
  const targetNorm = normalizeTranslationStorageKey(translation);
  if (!targetNorm) return false;
  return getSavedMeaningsLocally(cleanWord).some(
    (s) => normalizeTranslationStorageKey(s) === targetNorm,
  );
}

/**
 * Lưu nghĩa cụ thể của một từ vào localStorage.
 */
export function saveMeaningLocally(cleanWord: string, translation: string): void {
  if (typeof window === 'undefined' || !cleanWord || !translation) return;
  const target = cleanWord.trim().toLowerCase();
  const transTrimmed = translation.trim();
  if (!target || !transTrimmed) return;

  try {
    let map: Record<string, string[]> = {};
    try {
      const raw = localStorage.getItem(SAVED_MEANINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          map = parsed;
        }
      }
    } catch {
      map = {};
    }

    const currentList = Array.isArray(map[target]) ? map[target] : [];
    const normTarget = normalizeTranslationStorageKey(transTrimmed);
    if (!currentList.some((s) => normalizeTranslationStorageKey(s) === normTarget)) {
      currentList.push(transTrimmed);
      map[target] = currentList;
      localStorage.setItem(SAVED_MEANINGS_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore quota errors
  }
}

/**
 * Kiểm tra xem từ vựng (hoặc nghĩa cụ thể của từ) đã được lưu trong localStorage chưa (cho cả khách và học viên).
 */
export function isWordSavedLocally(cleanWord: string, translation?: string): boolean {
  if (typeof window === 'undefined' || !cleanWord) return false;
  const target = cleanWord.trim().toLowerCase();
  if (!target) return false;

  // Nếu có chỉ định nghĩa cụ thể, kiểm tra theo nghĩa
  if (translation && translation.trim()) {
    return isMeaningSavedLocally(target, translation);
  }

  try {
    const stored = localStorage.getItem(SAVED_WORDS_KEY);
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
 * Cho phép kèm nghĩa cụ thể để hỗ trợ từ đa nghĩa (polysemous words).
 * Tự động phục hồi nếu dữ liệu storage trước đó bị hỏng (corrupted JSON).
 */
export function saveWordLocally(cleanWord: string, translation?: string): void {
  if (typeof window === 'undefined' || !cleanWord) return;
  const target = cleanWord.trim().toLowerCase();
  if (!target) return;

  try {
    let localWords: string[] = [];
    try {
      const stored = localStorage.getItem(SAVED_WORDS_KEY);
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
      localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(localWords));
    }

    if (translation && translation.trim()) {
      saveMeaningLocally(target, translation);
    }
  } catch {
    // Ignore localStorage quota errors
  }
}

function dispatchWindowEvent(name: string, detail?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try {
    const event =
      typeof CustomEvent !== 'undefined'
        ? new CustomEvent(name, { detail })
        : ({ type: name, detail } as unknown as Event);
    window.dispatchEvent(event);
  } catch {
    // ignore event dispatch errors in restricted environments
  }
}

/**
 * Xóa một nghĩa cụ thể khỏi localStorage (dùng khi rollback 403 FREE_WORD_LIMIT hoặc lỗi server).
 */
export function removeWordMeaningLocally(cleanWord: string, translation: string): void {
  if (typeof window === 'undefined' || !cleanWord || !translation) return;
  const target = cleanWord.trim().toLowerCase();
  const normTarget = normalizeTranslationStorageKey(translation);
  if (!target || !normTarget) return;

  try {
    const raw = localStorage.getItem(SAVED_MEANINGS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    if (typeof map !== 'object' || map === null || Array.isArray(map)) return;
    const list = map[target];
    if (!Array.isArray(list)) return;

    const filtered = list.filter(
      (s: unknown) => typeof s === 'string' && normalizeTranslationStorageKey(s) !== normTarget,
    );
    if (filtered.length > 0) {
      map[target] = filtered;
    } else {
      delete map[target];
    }
    localStorage.setItem(SAVED_MEANINGS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Xóa từ khỏi lingo_saved_words nếu từ không còn nghĩa nào khác đã lưu.
 */
export function removeWordLocallyIfUnused(cleanWord: string): void {
  if (typeof window === 'undefined' || !cleanWord) return;
  const target = cleanWord.trim().toLowerCase();
  if (!target) return;

  try {
    const remainingMeanings = getSavedMeaningsLocally(target);
    if (remainingMeanings.length > 0) return;

    const stored = localStorage.getItem(SAVED_WORDS_KEY);
    if (!stored) return;
    const localWords = JSON.parse(stored);
    if (!Array.isArray(localWords)) return;

    const filtered = localWords.filter(
      (w: unknown) => typeof w !== 'string' || w.toLowerCase() !== target,
    );
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
}

export interface SaveVocabFromLookupParams {
  word: string;
  translation: string;
  ipa?: string;
  pos?: string;
  example?: string;
  exampleVi?: string;
  imageUrl?: string;
  classroomId?: string;
  sourceUrl?: string;
  skipAI?: boolean;
}

export interface SaveVocabFromLookupResult {
  ok: boolean;
  status:
    | 'saved'
    | 'already_exists'
    | 'guest_saved'
    | 'offline_saved'
    | 'limit_reached'
    | 'rate_limited'
    | 'error';
  word: string;
  translation: string;
  wordId?: string;
  alreadyExists?: boolean;
  upsell?: UpsellPayload;
  wordQuota?: { used: number; limit: number; remaining: number } | null;
  message?: string;
}

/**
 * Unified SRS save flow across all lookup surfaces:
 * 1. Snapshot pre-save polysemy state for surgical rollback.
 * 2. Optimistic localStorage persistence + `notifyWordSavedOptimistic(userId)` + `lingo_word_saved`.
 * 3. Guest-safe early return when `!userId` (0 failed 401 requests).
 * 4. Authenticated `POST /api/words` via `authFetch` with `alreadyExists` reconciliation,
 *    `WORD_NEAR_LIMIT_USED` soft upsell, and surgical `403 FREE_WORD_LIMIT` / error rollback.
 * 5. Offline-first resilience (`GEMINI.md` Rule 4): preserves local save on network errors.
 */
export async function saveVocabFromLookup(
  params: SaveVocabFromLookupParams,
): Promise<SaveVocabFromLookupResult> {
  const targetWord = cleanDictLookupKey(params.word) || (params.word || '').trim().toLowerCase();
  const targetTranslation = (params.translation || '').trim();

  if (!targetWord) {
    return {
      ok: false,
      status: 'error',
      word: '',
      translation: targetTranslation,
      message: 'Từ không hợp lệ.',
    };
  }

  // 1. Pre-save snapshot for surgical polysemy rollback (exact normalized equality matching saveMeaningLocally)
  const wasWordAlreadySaved = isWordSavedLocally(targetWord);
  const wasMeaningAlreadySaved = targetTranslation
    ? isExactMeaningSavedLocally(targetWord, targetTranslation)
    : false;

  // 2. Offline-resilient session resolution (never clears cache on transient network errors)
  let userId: string | null = null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    userId = session?.user?.id ?? null;
  } catch {
    userId = null;
  }

  // 3. Optimistic local persistence + summary badge update
  saveWordLocally(targetWord, targetTranslation || undefined);
  const didIncrementSummary =
    !wasMeaningAlreadySaved && (Boolean(targetTranslation) || !wasWordAlreadySaved);

  if (didIncrementSummary) {
    notifyWordSavedOptimistic(userId);
  }

  dispatchWindowEvent('lingo_word_saved', {
    word: targetWord,
    translation: targetTranslation,
    summaryNotified: true,
  });

  // 4. Guest-safe early return (avoids 401 network errors)
  if (!userId) {
    return {
      ok: true,
      status: 'guest_saved',
      word: targetWord,
      translation: targetTranslation,
    };
  }

  const rollbackOptimisticSave = () => {
    if (!wasMeaningAlreadySaved && targetTranslation) {
      removeWordMeaningLocally(targetWord, targetTranslation);
    }
    if (!wasWordAlreadySaved) {
      removeWordLocallyIfUnused(targetWord);
    }
    if (didIncrementSummary) {
      notifyWordSaveRollback(userId);
    }
    dispatchWindowEvent('lingo_word_save_rollback', {
      word: targetWord,
      translation: targetTranslation,
    });
  };

  // 5. Authenticated SRS sync via POST /api/words
  try {
    const res = await authFetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: targetWord,
        translation: targetTranslation || undefined,
        ipa: params.ipa || '',
        pos: params.pos || '',
        example: params.example || undefined,
        exampleVi: params.exampleVi || undefined,
        imageUrl: params.imageUrl || undefined,
        classroomId: params.classroomId || undefined,
        sourceUrl:
          params.sourceUrl ||
          (typeof window !== 'undefined' ? window.location.pathname : undefined),
        ...(params.skipAI !== undefined ? { skipAI: params.skipAI } : {}),
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      alreadyExists?: boolean;
      wordId?: string;
      error?: string;
      message?: string;
      used?: number;
      limit?: number;
      remaining?: number;
      wordQuota?: { used: number; limit: number; remaining: number } | null;
    };

    // Case A: 403 FREE_WORD_LIMIT -> surgical rollback + upsell modal
    if (res.status === 403 && isFreeWordLimitError(json)) {
      const limitMessage =
        typeof (json as { message?: unknown }).message === 'string'
          ? (json as { message?: string }).message
          : undefined;
      rollbackOptimisticSave();
      const upsell = upsellFromWordLimitError(json);
      requestUpsell(upsell);
      return {
        ok: false,
        status: 'limit_reached',
        word: targetWord,
        translation: targetTranslation,
        upsell,
        message: limitMessage,
      };
    }

    // Case B: Rate limit or non-ok error -> surgical rollback
    if (!res.ok) {
      rollbackOptimisticSave();
      return {
        ok: false,
        status: res.status === 429 ? 'rate_limited' : 'error',
        word: targetWord,
        translation: targetTranslation,
        message: json.message || json.error || 'Không thể lưu từ vựng.',
      };
    }

    // Case C: Already exists in DB -> keep local save, reconcile optimistic summary +1
    if (json.alreadyExists) {
      if (didIncrementSummary) {
        notifyWordSaveRollback(userId);
      }
      return {
        ok: true,
        status: 'already_exists',
        alreadyExists: true,
        wordId: json.wordId,
        word: targetWord,
        translation: targetTranslation,
        message: json.message,
      };
    }

    // Case D: Saved -> check soft near-limit upsell (>= 150)
    let upsell: UpsellPayload | undefined;
    if (
      typeof json.wordQuota?.used === 'number' &&
      typeof json.wordQuota?.limit === 'number' &&
      json.wordQuota.used >= WORD_NEAR_LIMIT_USED
    ) {
      upsell = {
        reason: json.wordQuota.remaining <= 0 ? 'word_limit' : 'word_near_limit',
        used: json.wordQuota.used,
        limit: json.wordQuota.limit,
        remaining: json.wordQuota.remaining ?? 0,
      };
      requestUpsell(upsell);
    }

    return {
      ok: true,
      status: 'saved',
      wordId: json.wordId,
      wordQuota: json.wordQuota ?? null,
      upsell,
      word: targetWord,
      translation: targetTranslation,
      message: json.message,
    };
  } catch {
    // Case E: Offline / network failure -> preserve local save, reconcile server summary count
    if (didIncrementSummary) {
      notifyWordSaveRollback(userId);
    }
    return {
      ok: true,
      status: 'offline_saved',
      word: targetWord,
      translation: targetTranslation,
    };
  }
}
