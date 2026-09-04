/**
 * Resolve IPA + nghĩa + gợi ý hình cho list từ.
 * IPA: CHỈ từ điển / input — mặc định TẮT LLM (tránh sai phiên âm in lớp).
 */
import { createServiceClient, type DictionaryData } from '@/lib/supabase';
import { getRouter } from '@/lib/ai-router';
import { sanitizeForPrompt } from '@/lib/api-security';
import type { MindMapWordInput } from '@/lib/mindmap';

/** Sweet spot 1 infographic / 1 chủ đề */
export const INFOGRAPHIC_MIN_WORDS = 35;
export const INFOGRAPHIC_MAX_WORDS = 45;

export type IpaSource = 'input' | 'global_dictionary' | 'free_dict' | 'external' | 'llm' | 'none';

export interface IpaResolvedWord extends MindMapWordInput {
  ipa?: string;
  ipaSource?: IpaSource;
  /** Gợi ý hình cụ thể — để NLM vẽ đúng nghĩa từ */
  visualCue?: string;
}

export interface IpaResolveStats {
  total: number;
  withIpa: number;
  verifiedIpa: number;
  bySource: Record<IpaSource, number>;
  missing: string[];
  dropped: string[];
}

export interface ResolveIpaOptions {
  /** Mặc định false — LLM IPA dễ sai khi in học sinh */
  useLlmFallback?: boolean;
  /** Chỉ giữ từ có IPA verified (dict/input), bỏ từ thiếu IPA */
  verifiedOnly?: boolean;
  /** Ưu tiên region IPA */
  preferRegion?: 'US' | 'UK';
}

const IPA_PHONETIC_MARKERS = /[ˈˌːˑəæɑɒɔɜɛɪʊʌɨʉɵɤɯʏøœɐɶᵻᵿθðʃʒŋɹɾɟɡβɸçʝɣχʁħʕʋɰɬɮɺɥʍʔ]/;

function cleanIpa(raw: string | undefined | null, headword?: string): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();
  // Decode URL-encoded IPA if present (e.g. %CB%88...)
  if (/%[0-9A-Fa-f]{2}/.test(s)) {
    try { s = decodeURIComponent(s); } catch {}
  }
  // Bỏ slash bao ngoài + nhãn vùng
  s = s.replace(/^\/+|\/+$/g, '').trim();
  s = s.replace(/^(US|UK|AmE|BrE|GA|RP)\s*[:：]?\s*/i, '').trim();
  s = s.replace(/^\/+|\/+$/g, '').trim();
  if (!s || s.length > 100) return undefined;
  // URL / path không phải IPA
  if (/^https?:/i.test(s) || s.includes('://') || s.includes('.com')) return undefined;

  // Garbage / placeholder strings
  if (/^(n\/a|unknown|placeholder|none|null|\.|\-|\?+|gibberish|not found|undefined)$/i.test(s)) {
    return undefined;
  }

  // Reject fake word-as-IPA (e.g. /aback/ for "aback", /a bad penny/ for "a bad penny")
  if (headword) {
    const normHead = headword.toLowerCase().replace(/[\/\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    const normIpa = s.toLowerCase().replace(/[\/\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normHead === normIpa && !IPA_PHONETIC_MARKERS.test(s)) {
      return undefined;
    }
  }

  if (s.includes(' ') && !IPA_PHONETIC_MARKERS.test(s)) {
    return undefined;
  }

  if (s.length >= 4 && !IPA_PHONETIC_MARKERS.test(s) && /^[a-zA-Z\s\-_]+$/.test(s)) {
    return undefined;
  }

  // Chỉ cần có ký tự IPA-ish hoặc chữ Latin
  if (!/[a-zæɑɒɔəɜɛɪʊʌθðʃʒŋɹɾɟɡɨʉɵɤɯʏøœɐɶæʏβɸçʝɣχʁħʕʋɰɬɮɺɥʍʔˈˌːˑᵻᵿ]/i.test(s)) return undefined;
  return s;
}

function isVerifiedSource(src: IpaSource | undefined): boolean {
  return src === 'input' || src === 'global_dictionary' || src === 'free_dict' || src === 'external';
}

/** Lấy IPA từ DictionaryData / payload free dict. */
export function extractIpaFromDictionaryData(
  data: unknown,
  preferRegion: 'US' | 'UK' = 'US',
  headword?: string
): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as DictionaryData & {
    phonetic?: string;
    phonetics?: Array<{ text?: string; audio?: string }>;
  };

  const prons = d.pronunciations as
    | Array<{ ipa?: string; text?: string; phonetic?: string; region?: string | null }>
    | undefined;
  if (Array.isArray(prons) && prons.length) {
    const preferred = prons.find((p) => p.region === preferRegion && (p.ipa || p.text || p.phonetic));
    if (preferred) {
      const ipa = cleanIpa(preferred.ipa || preferred.text || preferred.phonetic, headword);
      if (ipa) return ipa;
    }
    const other = preferRegion === 'US' ? 'UK' : 'US';
    const alt = prons.find((p) => p.region === other && (p.ipa || p.text || p.phonetic));
    if (alt) {
      const ipa = cleanIpa(alt.ipa || alt.text || alt.phonetic, headword);
      if (ipa) return ipa;
    }
    for (const p of prons) {
      const ipa = cleanIpa(p.ipa || p.text || p.phonetic, headword);
      if (ipa) return ipa;
    }
  }

  if (typeof d.phonetic === 'string') {
    const ipa = cleanIpa(d.phonetic, headword);
    if (ipa) return ipa;
  }
  if (Array.isArray(d.phonetics)) {
    for (const p of d.phonetics) {
      const ipa = cleanIpa(p?.text || (p as { ipa?: string })?.ipa, headword);
      if (ipa) return ipa;
    }
  }

  // openVocab / nested
  const ov = (d as { openVocab?: { ipaUs?: string; ipaUk?: string; ipa?: string; phonetic?: string } }).openVocab;
  if (ov) {
    for (const key of preferRegion === 'US'
      ? (['ipaUs', 'ipa', 'ipaUk', 'phonetic'] as const)
      : (['ipaUk', 'ipa', 'ipaUs', 'phonetic'] as const)) {
      const ipa = cleanIpa(ov[key], headword);
      if (ipa) return ipa;
    }
  }

  return undefined;
}

function extractViMeaning(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const d = data as DictionaryData & {
    results?: Array<{ meanings?: Array<{ definition?: string; meaning?: string }> }>;
  };
  const meanings = d.results?.[0]?.meanings;
  if (!Array.isArray(meanings)) return undefined;
  for (const m of meanings) {
    const def = m.definition || (m as { meaning?: string }).meaning;
    if (typeof def === 'string' && def.trim()) {
      return sanitizeForPrompt(def.trim(), 120);
    }
  }
  return undefined;
}

function extractVisualCue(data: unknown, word: string, translation?: string): string {
  if (data && typeof data === 'object') {
    const d = data as DictionaryData & { image_search_query?: string };
    if (typeof d.image_search_query === 'string' && d.image_search_query.trim()) {
      return sanitizeForPrompt(d.image_search_query.trim(), 80);
    }
  }
  // Cue literal: tránh metaphor mơ hồ
  if (translation) {
    return sanitizeForPrompt(`literal photo of ${word} (${translation})`, 80);
  }
  return sanitizeForPrompt(`literal clear photo of ${word}, single subject`, 80);
}

export function peelInlineIpa(text: string): { text: string; ipa?: string } {
  const m = text.match(/\/([^/\n]{1,60})\//);
  if (!m) return { text };
  const ipa = cleanIpa(m[1]);
  const rest = text.replace(m[0], ' ').replace(/\s+/g, ' ').trim();
  return { text: rest, ipa };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  }
  const n = Math.min(concurrency, Math.max(items.length, 1));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

async function fetchFreeDictIpa(
  word: string,
  preferRegion: 'US' | 'UK'
): Promise<{ ipa?: string; visualCue?: string }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (!res.ok) return {};
    const json = (await res.json()) as unknown;
    if (!Array.isArray(json) || !json[0]) return {};
    return {
      ipa: extractIpaFromDictionaryData(json[0], preferRegion, word),
      visualCue: extractVisualCue(json[0], word),
    };
  } catch {
    return {};
  }
}

async function fetchExternalDict(
  word: string,
  preferRegion: 'US' | 'UK'
): Promise<{ ipa?: string; translation?: string; visualCue?: string }> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://dict.minhqnd.com/api/v1/lookup?word=${encodeURIComponent(word)}&lang=en&def_lang=vi`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (!res.ok) return {};
    const json = (await res.json()) as Record<string, unknown>;
    return {
      ipa: extractIpaFromDictionaryData(json, preferRegion),
      translation: extractViMeaning(json),
      visualCue: extractVisualCue(json, word),
    };
  } catch {
    return {};
  }
}

/** Batch LLM — CHỈ bật khi explicit; không dùng cho in lớp. */
async function llmFillIpas(words: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (words.length === 0) return out;

  const list = words.map((w) => `- ${w}`).join('\n');
  const prompt = `You are a phonetics expert. Provide IPA for each English word (General American).
Return ONLY JSON object: { "word": "ipa_without_slashes", ... }
WORDS:
${list}`;

  try {
    const router = getRouter();
    const raw = await router.generate(prompt, 'normal', true);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return out;
      parsed = JSON.parse(m[0]) as Record<string, unknown>;
    }
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v !== 'string') continue;
      const ipa = cleanIpa(v);
      if (ipa) out.set(k.toLowerCase().trim(), ipa);
    }
  } catch (err) {
    console.warn('[ipa-resolve] LLM fallback failed:', err);
  }
  return out;
}

function emptyStats(): IpaResolveStats {
  return {
    total: 0,
    withIpa: 0,
    verifiedIpa: 0,
    bySource: {
      input: 0,
      global_dictionary: 0,
      free_dict: 0,
      external: 0,
      llm: 0,
      none: 0,
    },
    missing: [],
    dropped: [],
  };
}

/**
 * Resolve IPA + nghĩa + visual cue.
 * Thứ tự IPA: input → global_dictionary → free dict → external → LLM (optional).
 */
export async function resolveWordIpas(
  inputs: MindMapWordInput[],
  opts?: ResolveIpaOptions
): Promise<{ words: IpaResolvedWord[]; stats: IpaResolveStats }> {
  const useLlm = opts?.useLlmFallback === true; // default OFF
  const verifiedOnly = opts?.verifiedOnly === true;
  const preferRegion = opts?.preferRegion ?? 'US';
  const stats = emptyStats();
  stats.total = inputs.length;

  const words: IpaResolvedWord[] = inputs.map((w) => {
    let translation = w.translation;
    let ipa = cleanIpa(w.ipa, w.word);
    let source: IpaSource | undefined = ipa ? 'input' : undefined;

    if (!ipa && translation) {
      const peeled = peelInlineIpa(translation);
      if (peeled.ipa) {
        ipa = cleanIpa(peeled.ipa, w.word);
        translation = peeled.text || undefined;
        source = 'input';
      }
    }

    return {
      ...w,
      translation,
      ipa,
      ipaSource: source,
      visualCue: extractVisualCue(null, w.word, translation),
    };
  });

  // 1) global_dictionary — enrich IPA + nghĩa + visual cho cả list
  try {
    const supabase = createServiceClient();
    const allWords = words.map((w) => w.word);
    for (let i = 0; i < allWords.length; i += 100) {
      const chunk = allWords.slice(i, i + 100);
      const { data, error } = await supabase
        .from('global_dictionary')
        .select('word, data')
        .in('word', chunk);
      if (error) throw error;
      const map = new Map<string, unknown>();
      for (const row of data ?? []) {
        map.set(String(row.word).toLowerCase(), row.data);
      }
      for (const w of words) {
        const data = map.get(w.word);
        if (!data) continue;
        if (!w.ipa) {
          const ipa = extractIpaFromDictionaryData(data, preferRegion, w.word);
          if (ipa) {
            w.ipa = ipa;
            w.ipaSource = 'global_dictionary';
          }
        }
        if (!w.translation) {
          const vi = extractViMeaning(data);
          if (vi) w.translation = vi;
        }
        w.visualCue = extractVisualCue(data, w.word, w.translation);
      }
    }
  } catch (err) {
    console.warn('[ipa-resolve] global_dictionary batch failed:', err);
  }

  // 2) free dictionary API
  const needFree = words.filter((w) => !w.ipa);
  if (needFree.length > 0) {
    await mapPool(needFree, 6, async (w) => {
      const r = await fetchFreeDictIpa(w.word, preferRegion);
      if (r.ipa) {
        w.ipa = r.ipa;
        w.ipaSource = 'free_dict';
      }
      if (r.visualCue) w.visualCue = r.visualCue;
      return w;
    });
  }

  // 3) external minhqnd
  const needExt = words.filter((w) => !w.ipa || !w.translation);
  if (needExt.length > 0) {
    await mapPool(needExt, 4, async (w) => {
      const r = await fetchExternalDict(w.word, preferRegion);
      if (!w.ipa && r.ipa) {
        w.ipa = r.ipa;
        w.ipaSource = 'external';
      }
      if (!w.translation && r.translation) w.translation = r.translation;
      if (r.visualCue) w.visualCue = r.visualCue;
      else w.visualCue = extractVisualCue(null, w.word, w.translation);
      return w;
    });
  }

  // 4) LLM — chỉ khi bật explicit
  if (useLlm) {
    const needLlm = words.filter((w) => !w.ipa).map((w) => w.word);
    if (needLlm.length > 0) {
      const filled = await llmFillIpas(needLlm);
      for (const w of words) {
        if (w.ipa) continue;
        const ipa = filled.get(w.word);
        if (ipa) {
          w.ipa = ipa;
          w.ipaSource = 'llm';
        }
      }
    }
  }

  for (const w of words) {
    if (!w.visualCue) w.visualCue = extractVisualCue(null, w.word, w.translation);
    const src = w.ipaSource ?? (w.ipa ? 'input' : 'none');
    if (!w.ipa) {
      w.ipaSource = 'none';
      stats.bySource.none++;
      stats.missing.push(w.word);
    } else {
      stats.withIpa++;
      stats.bySource[src]++;
      w.ipaSource = src;
      if (isVerifiedSource(src)) stats.verifiedIpa++;
    }
  }

  let result = words;
  if (verifiedOnly) {
    const kept: IpaResolvedWord[] = [];
    for (const w of words) {
      if (w.ipa && isVerifiedSource(w.ipaSource)) {
        kept.push(w);
      } else {
        stats.dropped.push(w.word);
      }
    }
    result = kept;
  }

  console.log(
    `[ipa-resolve] verified=${stats.verifiedIpa}/${stats.total} withIpa=${stats.withIpa} ` +
      `gd=${stats.bySource.global_dictionary} free=${stats.bySource.free_dict} ` +
      `ext=${stats.bySource.external} llm=${stats.bySource.llm} ` +
      `miss=${stats.missing.length} dropped=${stats.dropped.length}`
  );

  return { words: result, stats };
}

/**
 * Chuẩn bị list cho 1 chủ đề infographic:
 * - IPA verified only (không LLM)
 * - clamp 35–45 từ
 */
export async function prepareInfographicWords(
  inputs: MindMapWordInput[],
  opts?: { hardMin?: number; hardMax?: number }
): Promise<{
  words: IpaResolvedWord[];
  stats: IpaResolveStats;
  error?: string;
}> {
  const hardMin = opts?.hardMin ?? INFOGRAPHIC_MIN_WORDS;
  const hardMax = opts?.hardMax ?? INFOGRAPHIC_MAX_WORDS;

  if (inputs.length < hardMin) {
    return {
      words: [],
      stats: emptyStats(),
      error: `Cần ${hardMin}–${hardMax} từ / chủ đề (hiện ${inputs.length}).`,
    };
  }
  if (inputs.length > hardMax) {
    return {
      words: [],
      stats: emptyStats(),
      error: `Tối đa ${hardMax} từ / chủ đề (hiện ${inputs.length}). Cắt list hoặc tách 2 chủ đề.`,
    };
  }

  const { words, stats } = await resolveWordIpas(inputs, {
    useLlmFallback: false,
    verifiedOnly: true,
    preferRegion: 'US',
  });

  if (words.length < hardMin) {
    return {
      words,
      stats,
      error:
        `Sau khi lọc IPA từ điển còn ${words.length}/${inputs.length} từ (cần ≥${hardMin}). ` +
        `Thiếu IPA verified: ${(stats.dropped.length ? stats.dropped : stats.missing).slice(0, 12).join(', ')}` +
        (stats.dropped.length > 12 || stats.missing.length > 12 ? '…' : ''),
    };
  }

  // Nếu vẫn > hardMax sau resolve (hiếm) — cắt
  const clipped = words.slice(0, hardMax);
  if (clipped.length < words.length) {
    stats.dropped.push(...words.slice(hardMax).map((w) => w.word));
  }

  return { words: clipped, stats };
}

/** Format 1 dòng giàu ngữ cảnh cho NLM — hình + IPA + nghĩa. */
export function formatWordLineForNlm(w: IpaResolvedWord, index?: number): string {
  const n = typeof index === 'number' ? `${index + 1}. ` : '';
  const ipa = w.ipa ? `/${w.ipa}/` : '(no-ipa)';
  const vi = w.translation || '?';
  const visual = w.visualCue || `literal photo of ${w.word}`;
  return `${n}${w.word} | IPA: ${ipa} | VI: ${vi} | DRAW: ${visual}`;
}

export function formatWordListForNlm(words: IpaResolvedWord[]): string {
  return words.map((w, i) => formatWordLineForNlm(w, i)).join('\n');
}
