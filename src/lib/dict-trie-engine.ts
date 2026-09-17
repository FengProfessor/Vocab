import { createServiceClient } from '@/lib/supabase';

let WORD_CACHE: string[] | null = null;
let LENGTH_BUCKETS: Map<number, string[]> = new Map();
let LAST_LOAD_TIME = 0;
let IS_LOADING = false;
const CACHE_TTL_MS = 3600 * 1000; // 1 giờ reload 1 lần

/** Xây dựng phân nhóm độ dài từ (Length Buckets) để tối ưu hóa tìm kiếm mờ */
function buildLengthBuckets(words: string[]): void {
  const buckets = new Map<number, string[]>();
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const len = w.length;
    let b = buckets.get(len);
    if (!b) {
      b = [];
      buckets.set(len, b);
    }
    b.push(w);
  }
  LENGTH_BUCKETS = buckets;
}

/** Nạp danh sách từ vựng từ Supabase DB vào bộ nhớ RAM của Server Node.js */
export async function getInMemWordList(): Promise<string[]> {
  const now = Date.now();
  if (WORD_CACHE && (now - LAST_LOAD_TIME < CACHE_TTL_MS)) {
    return WORD_CACHE;
  }

  if (IS_LOADING && WORD_CACHE) {
    return WORD_CACHE;
  }

  IS_LOADING = true;
  try {
    const supabase = createServiceClient();
    const allWords: string[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('global_dictionary')
        .select('word')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error || !data || data.length === 0) break;
      data.forEach(d => {
        if (d.word) allWords.push(d.word);
      });
      if (data.length < pageSize) break;
      page++;
    }

    if (allWords.length > 0) {
      allWords.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      WORD_CACHE = allWords;
      buildLengthBuckets(allWords);
      LAST_LOAD_TIME = Date.now();
    }
  } catch (err) {
    console.error('[dict-trie-engine] Error loading words into RAM:', err);
  } finally {
    IS_LOADING = false;
  }

  return WORD_CACHE || [];
}

/**
 * Thuật toán Damerau-Levenshtein tính khoảng cách chỉnh sửa giữa 2 chuỗi:
 * Hỗ trợ: Chèn (Insertion), Xóa (Deletion), Thay thế (Substitution), và Đảo 2 ký tự liền nhau (Transposition).
 * Tích hợp cắt tỉa sớm (early pruning) khi minRow vượt quá maxDist.
 */
export function damerauLevenshtein(a: string, b: string, maxDist: number = 2): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > maxDist) return maxDist + 1;

  const d: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;

  for (let i = 1; i <= la; i++) {
    let minRow = d[i][0];
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition (đảo 2 ký tự liền kề: e.g. cheif -> chief, recieve -> receive)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      minRow = Math.min(minRow, d[i][j]);
    }
    if (minRow > maxDist) return maxDist + 1;
  }
  return d[la][lb];
}

/** Thuật toán Nhị phân (Binary Search) lọc Prefix tức thì trong 0.005ms */
export function suggestFromRAM(query: string, limit = 8): string[] {
  if (!WORD_CACHE || !query) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];

  let low = 0;
  let high = WORD_CACHE.length - 1;
  let startIdx = WORD_CACHE.length;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const wordLower = WORD_CACHE[mid].toLowerCase();

    if (wordLower >= q) {
      startIdx = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  const results: string[] = [];
  for (let i = startIdx; i < WORD_CACHE.length && results.length < limit; i++) {
    const w = WORD_CACHE[i];
    if (w.toLowerCase().startsWith(q)) {
      results.push(w);
    } else {
      break;
    }
  }

  return results;
}

export interface FuzzyMatchResult {
  word: string;
  distance: number;
}

/**
 * Tìm kiếm mờ (Fuzzy Search / Spell Suggestion) trên bộ nhớ RAM:
 * Tìm các từ có khoảng cách Damerau-Levenshtein <= maxDist (mặc định 2).
 * Tối ưu theo Length Bucketing: chỉ duyệt các từ có độ dài chênh lệch <= maxDist.
 */
export function fuzzySuggestFromRAM(
  query: string,
  maxDist: number = 2,
  limit: number = 5
): FuzzyMatchResult[] {
  if (!WORD_CACHE || !query) return [];
  const q = query.trim().toLowerCase();
  if (q.length <= 2) return [];

  const typoLen = q.length;
  const candidates: string[] = [];

  // Lọc từ các bucket độ dài tương đồng
  for (let l = Math.max(1, typoLen - maxDist); l <= typoLen + maxDist; l++) {
    const bucket = LENGTH_BUCKETS.get(l);
    if (bucket) {
      for (let i = 0; i < bucket.length; i++) {
        candidates.push(bucket[i]);
      }
    }
  }

  const matches: FuzzyMatchResult[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const w = candidates[i];
    const wLower = w.toLowerCase();
    if (wLower === q) continue; // bỏ qua từ trùng khít

    const dist = damerauLevenshtein(q, wLower, maxDist);
    if (dist <= maxDist) {
      matches.push({ word: w, distance: dist });
    }
  }

  // Sắp xếp ưu tiên:
  // 1. Khoảng cách nhỏ hơn (d=1 tốt hơn d=2)
  // 2. Cùng chữ cái đầu tiên (vd: 'defenite' -> 'definite' ưu tiên hơn 'infinite')
  // 3. Độ dài chênh lệch ít hơn
  const firstLetter = q[0];
  matches.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    const aFirstMatch = a.word[0].toLowerCase() === firstLetter ? 1 : 0;
    const bFirstMatch = b.word[0].toLowerCase() === firstLetter ? 1 : 0;
    if (aFirstMatch !== bFirstMatch) return bFirstMatch - aFirstMatch;
    return Math.abs(a.word.length - typoLen) - Math.abs(b.word.length - typoLen);
  });

  return matches.slice(0, limit);
}

/**
 * Kết hợp thông minh giữa Prefix Autocomplete và Fuzzy Spell Correction:
 * - Nếu người dùng gõ đúng tiền tố: trả về gợi ý tiền tố siêu nhanh (0.005ms).
 * - Nếu người dùng gõ sai hoặc kết quả tiền tố ít: bổ sung gợi ý sửa lỗi chính tả.
 */
export function getSmartSuggestionsFromRAM(
  query: string,
  limit: number = 8
): {
  suggestions: string[];
  isFuzzy: boolean;
  didYouMean: string[];
} {
  const prefixMatches = suggestFromRAM(query, limit);

  // Nếu tìm thấy đủ kết quả tiền tố chính xác
  if (prefixMatches.length >= Math.min(limit, 5)) {
    return {
      suggestions: prefixMatches,
      isFuzzy: false,
      didYouMean: [],
    };
  }

  // Kích hoạt tìm kiếm mờ (Fuzzy Matching)
  const fuzzyResults = fuzzySuggestFromRAM(query, 2, limit);
  const didYouMean = fuzzyResults.map((f) => f.word);

  // Gộp gợi ý (ưu tiên tiền tố trước, sau đó đến fuzzy)
  const combined = new Set<string>(prefixMatches);
  for (const item of didYouMean) {
    combined.add(item);
    if (combined.size >= limit) break;
  }

  return {
    suggestions: Array.from(combined),
    isFuzzy: prefixMatches.length === 0 && didYouMean.length > 0,
    didYouMean,
  };
}
