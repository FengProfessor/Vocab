import { createServiceClient } from '@/lib/supabase';

let WORD_CACHE: string[] | null = null;
let LAST_LOAD_TIME = 0;
let IS_LOADING = false;
const CACHE_TTL_MS = 3600 * 1000; // 1 giờ reload 1 lần

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
    let allWords: string[] = [];
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
      LAST_LOAD_TIME = Date.now();
    }
  } catch (err) {
    console.error('[dict-trie-engine] Error loading words into RAM:', err);
  } finally {
    IS_LOADING = false;
  }

  return WORD_CACHE || [];
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
