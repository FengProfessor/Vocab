import { createServiceClient } from '@/lib/supabase-server';

let WORD_CACHE: string[] | null = null;
let LENGTH_BUCKETS: Map<number, string[]> = new Map();
let LAST_LOAD_TIME = 0;
let LOAD_PROMISE: Promise<string[]> | null = null;
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

/**
 * Nạp trực tiếp danh sách từ vào RAM (hữu ích cho kiểm thử hoặc nạp trước).
 */
export function setInMemWordList(words: string[]): void {
  const cleaned = Array.from(
    new Set(
      words
        .filter((w) => typeof w === 'string')
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  WORD_CACHE = cleaned;
  buildLengthBuckets(cleaned);
  LAST_LOAD_TIME = Date.now();
}

/**
 * Nạp danh sách từ vựng ngoại tuyến (Offline Fallback) khi không có cấu hình Supabase hoặc khi chạy kiểm thử.
 * Kết hợp từ vựng TOEIC cốt lõi và dữ liệu từ điển collocation cục bộ.
 */
export function loadOfflineWordList(): string[] {
  if (WORD_CACHE && WORD_CACHE.length > 0) {
    return WORD_CACHE;
  }

  const wordsSet = new Set<string>();

  // Danh mục từ vựng kiểm thử và TOEIC cốt lõi
  const CORE_OFFLINE_WORDS = [
    'accommodate', 'accommodation', 'applicant', 'application', 'apply', 'applied', 'appliance', 'applicable',
    'applaud', 'applause', 'apple', 'occasion', 'occasional', 'occasionally', 'committee', 'definite',
    'definitely', 'definition', 'separate', 'separation', 'separately', 'strategy', 'strategic', 'strategically',
    'convenient', 'convenience', 'conveniently', 'chief', 'experience', 'experienced', 'experiencing', 'embarrass',
    'embarrassing', 'embarrassed', 'embarrassment', 'recommend', 'recommendation', 'receive', 'receipt', 'achieve',
    'achievement', 'acquire', 'acquisition', 'adequate', 'adjacent', 'administration', 'administrative',
    'advantage', 'advertise', 'advertisement', 'advertising', 'advice', 'advise', 'afford', 'affordable',
    'agenda', 'agree', 'agreement', 'allocate', 'allocation', 'allowance', 'alternative', 'amend', 'amendment',
    'analyze', 'analysis', 'analyst', 'annual', 'annually', 'anticipate', 'apparent', 'appoint', 'appointment',
    'appreciate', 'appreciation', 'approach', 'appropriate', 'approve', 'approval', 'approximate', 'approximately',
    'arrange', 'arrangement', 'assess', 'assessment', 'assign', 'assignment', 'assist', 'assistance', 'assistant',
    'associate', 'assume', 'assure', 'assurance', 'attach', 'attachment', 'attain', 'attend', 'attendance',
    'attention', 'attract', 'attraction', 'attractive', 'audit', 'auditor', 'authority', 'authorize', 'authorization',
    'automatic', 'available', 'availability', 'benefit', 'beneficial', 'board', 'bonus', 'branch', 'brand',
    'budget', 'business', 'calculate', 'campaign', 'candidate', 'capacity', 'career', 'category', 'caution',
    'certificate', 'certify', 'challenge', 'charge', 'circumstance', 'claim', 'clarify', 'clause', 'client',
    'collaborate', 'collaboration', 'colleague', 'collect', 'collection', 'combine', 'commence', 'commerce',
    'commercial', 'commission', 'commit', 'commitment', 'communicate', 'communication', 'community', 'company',
    'comparable', 'compare', 'comparison', 'compensate', 'compensation', 'compete', 'competition', 'competitive',
    'competitor', 'complain', 'complaint', 'complete', 'completion', 'complex', 'comply', 'compliance',
    'component', 'comprehensive', 'compromise', 'concentrate', 'concentration', 'concern', 'conclude', 'conclusion',
    'condition', 'conduct', 'conference', 'confidence', 'confident', 'confidential', 'confirm', 'confirmation',
    'connect', 'connection', 'consequence', 'consider', 'considerable', 'consideration', 'consistent', 'consistently',
    'constant', 'construct', 'construction', 'consult', 'consultant', 'consume', 'consumer', 'contact', 'contain',
    'continue', 'contract', 'contribute', 'contribution', 'control', 'convenience', 'conversation', 'convert',
    'convince', 'cooperate', 'cooperation', 'coordinate', 'corporate', 'corporation', 'correspond', 'cost',
    'counsel', 'courteous', 'coverage', 'create', 'creative', 'credit', 'critical', 'criticize', 'crucial',
    'currency', 'current', 'currently', 'custom', 'customer', 'damage', 'deadline', 'deal', 'debate', 'debt',
    'decade', 'decide', 'decision', 'declare', 'declaration', 'decline', 'decrease', 'dedicate', 'deduct',
    'default', 'defect', 'defective', 'defend', 'defense', 'define', 'delay', 'delegate', 'delegation',
    'deliver', 'delivery', 'demand', 'demonstrate', 'demonstration', 'department', 'depend', 'dependable',
    'deposit', 'design', 'designate', 'destination', 'detail', 'detailed', 'determine', 'determination',
    'develop', 'development', 'device', 'differ', 'difference', 'different', 'direct', 'direction', 'director',
    'discount', 'discuss', 'discussion', 'display', 'dispute', 'distribute', 'distribution', 'district',
    'diverse', 'division', 'document', 'documentation', 'domestic', 'draft', 'duplicate', 'durable', 'duration',
    'duty', 'earnings', 'economic', 'economy', 'effective', 'effectively', 'efficiency', 'efficient',
    'eliminate', 'emerge', 'emergency', 'emphasize', 'emphasis', 'employ', 'employee', 'employer', 'employment',
    'enable', 'enclose', 'encourage', 'endorse', 'energy', 'enforce', 'engage', 'engineer', 'enhance', 'ensure',
    'enterprise', 'entertain', 'enthusiasm', 'entire', 'entirely', 'entitle', 'entry', 'environment', 'equal',
    'equip', 'equipment', 'equity', 'equivalent', 'error', 'essential', 'establish', 'establishment', 'estate',
    'estimate', 'estimation', 'evaluate', 'evaluation', 'event', 'eventually', 'evidence', 'evident', 'exact',
    'examine', 'examination', 'exceed', 'excel', 'excellent', 'except', 'exception', 'excess', 'exchange',
    'exclude', 'exclusive', 'execute', 'executive', 'exempt', 'exercise', 'exhibit', 'exhibition', 'exist',
    'expand', 'expansion', 'expect', 'expectation', 'expense', 'expensive', 'experiment', 'expert', 'expertise',
    'expire', 'explain', 'explanation', 'explicit', 'export', 'expose', 'express', 'extend', 'extension',
    'extensive', 'extent', 'external', 'extra', 'facility', 'factor', 'factory', 'fail', 'failure', 'fair',
    'familiar', 'fare', 'feasible', 'feature', 'feedback', 'figure', 'file', 'finalize', 'finance', 'financial',
    'firm', 'fiscal', 'fit', 'flexible', 'flexibility', 'fluctuate', 'focus', 'forecast', 'foreign', 'format',
    'fortune', 'forward', 'foundation', 'founder', 'framework', 'free', 'frequent', 'frequently', 'fulfill',
    'function', 'fund', 'fundamental', 'furniture', 'future', 'gain', 'gather', 'general', 'generally',
    'generate', 'generation', 'generous', 'genuine', 'global', 'goal', 'goods', 'govern', 'government',
    'gradual', 'graduate', 'grant', 'grateful', 'gross', 'ground', 'group', 'growth', 'guarantee', 'guidance',
    'guide', 'guideline', 'handle', 'handling', 'hazard', 'hazardous', 'headquarters', 'health', 'healthy',
    'highlight', 'hire', 'historic', 'history', 'hold', 'holiday', 'honor', 'hope', 'hospitality', 'host',
    'hotel', 'housing', 'human', 'ideal', 'identical', 'identify', 'identity', 'ignore', 'illegal', 'image',
    'immediate', 'immediately', 'impact', 'implement', 'implementation', 'implication', 'imply', 'import',
    'importance', 'important', 'impose', 'impossible', 'impress', 'impression', 'impressive', 'improve',
    'improvement', 'incentive', 'incident', 'include', 'income', 'incorporate', 'increase', 'increasingly',
    'independent', 'index', 'indicate', 'indication', 'individual', 'industry', 'inexpensive', 'inflation',
    'influence', 'inform', 'information', 'infrastructure', 'initial', 'initially', 'initiate', 'initiative',
    'innovate', 'innovation', 'innovative', 'input', 'inquire', 'inquiry', 'insert', 'inside', 'insight',
    'inspect', 'inspection', 'inspector', 'inspire', 'inspiration', 'install', 'installation', 'instance',
    'instant', 'institute', 'institution', 'instruct', 'instruction', 'instructor', 'instrument', 'insurance',
    'insure', 'integrate', 'integration', 'integrity', 'intellectual', 'intelligence', 'intend', 'intense',
    'intent', 'intention', 'interact', 'interaction', 'interactive', 'interest', 'interested', 'interesting',
    'interface', 'interior', 'internal', 'international', 'interpret', 'interrupt', 'interval', 'intervene',
    'interview', 'introduce', 'introduction', 'invent', 'invention', 'inventory', 'invest', 'investigate',
    'investigation', 'investment', 'investor', 'invite', 'invitation', 'invoice', 'involve', 'isolate',
    'issue', 'item', 'itinerary', 'job', 'join', 'joint', 'journal', 'journey', 'judge', 'judgment', 'justice',
    'justify', 'keep', 'keynote', 'knowledge', 'label', 'labor', 'laboratory', 'lack', 'landlord', 'landmark',
    'landscape', 'language', 'large', 'launch', 'lawyer', 'layout', 'lead', 'leader', 'leadership', 'leading',
    'lease', 'lecture', 'legal', 'legislation', 'legitimate', 'leisure', 'lender', 'length', 'lessen', 'lesson',
    'liability', 'liable', 'license', 'limit', 'limitation', 'limited', 'liquid', 'listen', 'literature',
    'living', 'load', 'loan', 'lobby', 'local', 'locate', 'location', 'logistics', 'loss', 'loyal', 'loyalty',
    'lucrative', 'luggage', 'luxury', 'machine', 'machinery', 'magazine', 'maintain', 'maintenance', 'major',
    'majority', 'manage', 'management', 'manager', 'mandate', 'mandatory', 'manifest', 'manual', 'manually',
    'manufacture', 'manufacturer', 'manufacturing', 'margin', 'market', 'marketer', 'marketing', 'material',
    'mature', 'maximize', 'maximum', 'measure', 'measurement', 'mechanic', 'mechanism', 'media', 'medical',
    'medicine', 'medium', 'meet', 'meeting', 'membership', 'memo', 'memory', 'mention', 'mentor', 'merchandise',
    'merchant', 'merger', 'merit', 'message', 'method', 'methodology', 'middle', 'milestone', 'military',
    'minimize', 'minimum', 'minor', 'minority', 'minute', 'mission', 'mistake', 'mitigate', 'mode', 'model',
    'moderate', 'modern', 'modest', 'modify', 'module', 'moment', 'monetary', 'money', 'monitor', 'month',
    'monthly', 'monument', 'morale', 'mortgage', 'motion', 'motivate', 'motivation', 'motive', 'mount',
    'movement', 'multiple', 'municipal', 'museum', 'mutual'
  ];

  for (const w of CORE_OFFLINE_WORDS) {
    wordsSet.add(w.toLowerCase());
  }

  // Cố gắng bổ sung từ vựng từ collocation-vocab-index.json nếu chạy trên Node.js
  try {
    const req = typeof globalThis !== 'undefined' ? (globalThis as any).require : undefined;
    if (typeof req === 'function') {
      const path = req('path');
      const fs = req('fs');
      const cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.';
      const indexPath = path.resolve(cwd, 'src/data/toeic/collocation-vocab-index.json');
      if (fs.existsSync(indexPath)) {
        const raw = fs.readFileSync(indexPath, 'utf8');
        const data = JSON.parse(raw);
        for (const key of Object.keys(data)) {
          const entry = data[key];
          if (entry?.cleanWord && /^[a-z]+$/i.test(entry.cleanWord)) {
            wordsSet.add(entry.cleanWord.toLowerCase());
          }
        }
      }
    }
  } catch {
    // Non-fatal: CORE_OFFLINE_WORDS đã đảm bảo đầy đủ các từ ngữ cốt lõi
  }

  const sorted = Array.from(wordsSet).sort((a, b) => a.localeCompare(b));
  WORD_CACHE = sorted;
  buildLengthBuckets(sorted);
  LAST_LOAD_TIME = Date.now();
  return sorted;
}

/**
 * Kích hoạt nạp danh sách từ vựng từ Supabase DB vào RAM (Singleton Promise).
 * Nếu thiếu thông tin xác thực Supabase hoặc gặp lỗi môi trường kiểm thử,
 * tự động chuyển sang nạp từ vựng ngoại tuyến (loadOfflineWordList).
 */
export async function triggerWordListLoad(): Promise<string[]> {
  const now = Date.now();
  if (WORD_CACHE && WORD_CACHE.length > 0 && now - LAST_LOAD_TIME < CACHE_TTL_MS) {
    return WORD_CACHE;
  }

  if (LOAD_PROMISE) {
    return LOAD_PROMISE;
  }

  LOAD_PROMISE = (async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      const isServerEnv = typeof window === 'undefined';

      // Chỉ gọi Supabase nếu đang ở môi trường server Node thuần túy và có đủ thông tin xác thực
      if (isServerEnv && supabaseUrl && serviceKey) {
        const supabase = createServiceClient();
        const pageSize = 1000;
        const totalPages = 42; // Ước lượng cho ~40.860 từ
        const allWords = new Set<string>();

        // Tải song song theo batch 6 trang một lượt
        const batchSize = 6;
        for (let b = 0; b < totalPages; b += batchSize) {
          const batchPromises = [];
          for (let p = b; p < Math.min(b + batchSize, totalPages); p++) {
            batchPromises.push(
              supabase
                .from('global_dictionary')
                .select('word')
                .range(p * pageSize, (p + 1) * pageSize - 1)
            );
          }
          const results = await Promise.all(batchPromises);
          let hasData = false;
          for (const res of results) {
            if (res.data && res.data.length > 0) {
              hasData = true;
              for (let i = 0; i < res.data.length; i++) {
                const w = res.data[i].word;
                if (w && typeof w === 'string') {
                  allWords.add(w.trim().toLowerCase());
                }
              }
            }
          }
          if (!hasData && b > 0) break;
        }

        if (allWords.size > 0) {
          const sorted = Array.from(allWords).sort((a, b) => a.localeCompare(b));
          WORD_CACHE = sorted;
          buildLengthBuckets(sorted);
          LAST_LOAD_TIME = Date.now();
          return WORD_CACHE;
        }
      }
    } catch (err) {
      console.warn('[dict-trie-engine] Supabase load failed, falling back to offline dictionary:', (err as Error)?.message || err);
    } finally {
      LOAD_PROMISE = null;
    }

    // Ngoại tuyến / kiểm thử fallback khi không có dữ liệu từ DB
    if (!WORD_CACHE || WORD_CACHE.length === 0) {
      loadOfflineWordList();
    }

    return WORD_CACHE || [];
  })();

  return LOAD_PROMISE;
}

/**
 * Nạp/lấy danh sách từ vựng từ RAM.
 * @param waitForMs Thời gian chờ tối đa (ms). Mặc định -1 (chờ nạp xong hoàn toàn, phù hợp kiểm thử).
 *                  Nếu truyền giá trị dương (ví dụ 250ms), hàm sẽ không bao giờ treo request nếu mạng chậm.
 */
export async function getInMemWordList(waitForMs: number = -1): Promise<string[]> {
  if (WORD_CACHE && WORD_CACHE.length > 0) {
    return WORD_CACHE;
  }

  const loadPromise = triggerWordListLoad();

  if (waitForMs > 0) {
    try {
      await Promise.race([
        loadPromise,
        new Promise((resolve) => setTimeout(resolve, waitForMs)),
      ]);
    } catch {
      // Bỏ qua lỗi timeout, trả về fallback an toàn
    }
  } else if (waitForMs === -1) {
    await loadPromise;
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

// Tự động kích hoạt nạp RAM ngầm ngay khi server khởi động (chỉ chạy trên production/server runtime, không tự kích hoạt trong test runner)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test' && !process.env.TSX_TEST) {
  const timer = setTimeout(() => {
    triggerWordListLoad().catch(() => {});
  }, 1000);
  if (typeof (timer as any)?.unref === 'function') {
    (timer as any).unref();
  }
}
