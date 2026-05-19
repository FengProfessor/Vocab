/**
 * Image Pipeline — module ảnh thống nhất cho LingoPro.
 *
 * Mọi route/script lấy ảnh từ vựng PHẢI đi qua `resolveWordImage`.
 * Quy trình 4 giai đoạn:
 *   A. buildImageQueries  — sinh query thông minh theo POS + nghĩa (không search `word` trần)
 *   B. đa nguồn ảnh       — DuckDuckGo → Wikipedia → Openverse → Pollinations
 *   C. validateImageUrl   — kiểm ảnh thực sự tồn tại (HTTP, content-type, size)
 *   D. verifyImageMeaning — AI Vision chấm ảnh có khớp nghĩa từ (chỉ cho từ trừu tượng/đa nghĩa)
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { search as searchDuckDuckGo } from './image-sources/duckduckgo';
import { search as searchWikipedia } from './image-sources/wikipedia';
import { search as searchOpenverse } from './image-sources/openverse';
import { search as searchPollinations } from './image-sources/pollinations';

export type ImageSource = 'duckduckgo' | 'wikipedia' | 'openverse' | 'pollinations' | 'none';

export interface ResolveImageInput {
  word: string;
  pos?: string;
  definition?: string;
  exampleSentence?: string;
  /** Query mô tả do Gemini sinh (field `image_search_query` trong ai-enrich.ts) */
  imageSearchQuery?: string;
  /** Số nghĩa của từ — > 1 nghĩa là đa nghĩa, cần AI Vision kiểm chứng */
  meaningCount?: number;
  /** Ép chạy AI Vision dù từ cụ thể đơn nghĩa (dùng khi user yêu cầu đổi/kiểm tra ảnh) */
  forceVision?: boolean;
}

export interface ResolvedImage {
  url: string;
  /** Nguồn ảnh; hậu tố `-low` nghĩa là ảnh chấp nhận tạm dù điểm Vision thấp */
  source: string;
  /** Điểm AI Vision 0-100; null nghĩa là không chấm Vision (từ cụ thể đơn nghĩa) */
  confidence: number | null;
  /** Query thực tế đã dùng — lưu lại để audit */
  query: string;
}

const MIN_IMAGE_BYTES = 3000;
const VISION_THRESHOLD = 70;
const MAX_VISION_CANDIDATES = 3;

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =============================================
// GIAI ĐOẠN A — Query thông minh
// =============================================

const ABSTRACT_POS = ['adjective', 'adverb', 'adj', 'adv', 'preposition', 'conjunction'];
const ABSTRACT_DEF_HINTS = [
  'feeling',
  'emotion',
  'state of',
  'quality of',
  'act of',
  'ability to',
  'idea',
  'concept',
  'belief',
  'process of',
  'condition of',
  'degree of',
  'manner of',
];

/** Phân loại từ là cụ thể (chụp được ảnh thực) hay trừu tượng. */
export function classifyConcreteness(pos = '', definition = ''): 'concrete' | 'abstract' {
  const p = pos.toLowerCase();
  if (ABSTRACT_POS.some((a) => p.includes(a))) return 'abstract';
  const d = definition.toLowerCase();
  if (ABSTRACT_DEF_HINTS.some((h) => d.includes(h))) return 'abstract';
  return 'concrete';
}

/** Lấy cụm mô tả ngắn từ definition (cho từ trừu tượng khi thiếu query Gemini). */
function extractDescriptor(definition: string): string {
  if (!definition) return '';
  return definition
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join(' ');
}

/** Sinh danh sách query theo thứ tự ưu tiên — KHÔNG bao giờ search `word` trần cho từ trừu tượng. */
export function buildImageQueries(input: ResolveImageInput): string[] {
  const { word, pos = '', definition = '', imageSearchQuery } = input;
  const queries: string[] = [];
  const p = pos.toLowerCase();
  const concreteness = classifyConcreteness(pos, definition);

  // 1. Query Gemini sinh — ưu tiên cao nhất (đã bám ngữ cảnh nghĩa cụ thể)
  if (imageSearchQuery && imageSearchQuery.trim()) {
    queries.push(imageSearchQuery.trim());
  }

  // 2. Query phái sinh theo POS
  if (concreteness === 'concrete') {
    queries.push(word);
    queries.push(`${word} photo`);
  } else if (p.includes('verb')) {
    queries.push(`person ${word}`);
    queries.push(`${word} action`);
  } else {
    const descriptor = extractDescriptor(definition);
    if (descriptor) queries.push(descriptor);
    queries.push(`${word} concept illustration`);
  }

  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))];
}

// =============================================
// GIAI ĐOẠN C — Validate HTTP
// =============================================

/** Kiểm ảnh thực sự truy cập được, đúng content-type, không phải ảnh rác 1x1. */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url || !/^https?:\/\//.test(url)) return false;
  try {
    const headers = { ...BROWSER_HEADERS, Referer: new URL(url).origin };

    let res = await fetch(url, { method: 'HEAD', headers, signal: AbortSignal.timeout(5000) });
    // Một số CDN không hỗ trợ HEAD → fallback GET chỉ lấy 1KB đầu
    if (!res.ok || res.status === 405) {
      res = await fetch(url, {
        method: 'GET',
        headers: { ...headers, Range: 'bytes=0-1024' },
        signal: AbortSignal.timeout(8000),
      });
    }
    if (!res.ok && res.status !== 206) return false;

    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return false;

    const len = parseInt(res.headers.get('content-length') || '0', 10);
    if (len > 0 && len < MIN_IMAGE_BYTES) return false;

    return true;
  } catch {
    return false;
  }
}

// =============================================
// GIAI ĐOẠN D — AI Vision kiểm chứng
// =============================================

function pickGeminiKey(): string {
  let key = process.env.GEMINI_API_KEY || '';
  if (key.includes(',')) {
    const keys = key
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    key = keys[Math.floor(Math.random() * keys.length)];
  }
  return key;
}

/**
 * Dùng Gemini multimodal chấm điểm ảnh có khớp nghĩa từ không.
 * Trả score 0-100; score = -1 nghĩa là Vision lỗi (không reject ảnh, chỉ bỏ qua bước chấm).
 */
export async function verifyImageMeaning(
  imageUrl: string,
  ctx: { word: string; pos?: string; definition?: string }
): Promise<{ score: number; reason: string }> {
  try {
    const key = pickGeminiKey();
    if (!key) return { score: -1, reason: 'no api key' };

    const imgRes = await fetch(imageUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!imgRes.ok) return { score: 0, reason: 'image fetch failed' };

    const mimeType = imgRes.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    const base64 = Buffer.from(await imgRes.arrayBuffer()).toString('base64');

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are verifying whether an image correctly illustrates an English vocabulary word on a learner's flashcard.
Word: "${ctx.word}"${ctx.pos ? ` (${ctx.pos})` : ''}
Meaning: "${ctx.definition || ''}"
Look at the image. Does it clearly and unambiguously depict THIS specific meaning?
Return ONLY valid JSON: { "match_score": <integer 0-100>, "reason": "<short explanation>" }`;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: base64 } },
    ]);
    const raw = result.response.text();

    let parsed: { match_score?: number; reason?: string } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }
    if (!parsed) return { score: 0, reason: 'parse failed' };

    const score = Math.max(0, Math.min(100, Number(parsed.match_score) || 0));
    return { score, reason: String(parsed.reason || '') };
  } catch (e) {
    console.error('[ImagePipeline] verifyImageMeaning failed:', (e as Error).message);
    return { score: -1, reason: 'vision error' };
  }
}

// =============================================
// resolveWordImage — điều phối toàn bộ pipeline
// =============================================

export async function resolveWordImage(input: ResolveImageInput): Promise<ResolvedImage> {
  const { word, pos = '', definition = '', imageSearchQuery, meaningCount = 1, forceVision = false } = input;
  const queries = buildImageQueries(input);
  const primaryQuery = queries[0] || word;
  const concreteness = classifyConcreteness(pos, definition);

  // Quyết định có cần AI Vision: ép buộc HOẶC từ trừu tượng HOẶC đa nghĩa
  const needsVision = forceVision || concreteness === 'abstract' || meaningCount > 1;

  // GIAI ĐOẠN B — thu thập ứng viên ảnh theo tier
  const candidates: { url: string; source: ImageSource }[] = [];

  // Tier 1: DuckDuckGo — thử từng query
  for (const q of queries) {
    const urls = await searchDuckDuckGo(q, 4);
    for (const u of urls) candidates.push({ url: u, source: 'duckduckgo' });
    if (candidates.length >= 5) break;
  }
  // Tier 2: Wikipedia — tra theo word gốc
  if (candidates.length < 5) {
    const urls = await searchWikipedia(word);
    for (const u of urls) candidates.push({ url: u, source: 'wikipedia' });
  }
  // Tier 3: Openverse
  if (candidates.length < 3) {
    const urls = await searchOpenverse(primaryQuery, 4);
    for (const u of urls) candidates.push({ url: u, source: 'openverse' });
  }
  // Tier 4: Pollinations — generative, luôn có ứng viên
  const pollinationsQuery = imageSearchQuery || extractDescriptor(definition) || word;
  const pollUrls = await searchPollinations(pollinationsQuery, MAX_VISION_CANDIDATES);
  for (const u of pollUrls) candidates.push({ url: u, source: 'pollinations' });

  // GIAI ĐOẠN C + D — validate rồi (nếu cần) kiểm chứng
  let best: ResolvedImage | null = null;
  let visionCalls = 0;

  for (const cand of candidates) {
    if (!(await validateImageUrl(cand.url))) continue;

    // Pollinations (generative) luôn cần kiểm chứng; ngoài ra theo needsVision
    const mustVerify = needsVision || cand.source === 'pollinations';

    if (!mustVerify) {
      // Danh từ cụ thể đơn nghĩa + ảnh thực hợp lệ → nhận luôn, tiết kiệm quota
      return { url: cand.url, source: cand.source, confidence: null, query: primaryQuery };
    }

    if (visionCalls >= MAX_VISION_CANDIDATES) {
      // Hết ngạch Vision → giữ ảnh hợp lệ đầu tiên làm phương án dự phòng
      if (!best) {
        best = { url: cand.url, source: `${cand.source}-low`, confidence: null, query: primaryQuery };
      }
      continue;
    }

    if (visionCalls > 0) await sleep(500); // giãn nhịp tránh rate limit
    visionCalls++;
    const { score } = await verifyImageMeaning(cand.url, { word, pos, definition });

    if (score === -1) {
      // Vision lỗi → không reject, nhận ảnh với confidence null
      return { url: cand.url, source: cand.source, confidence: null, query: primaryQuery };
    }
    if (score >= VISION_THRESHOLD) {
      return { url: cand.url, source: cand.source, confidence: score, query: primaryQuery };
    }
    // Điểm thấp → ghi nhận ứng viên tốt nhất tới hiện tại
    if (!best || score > (best.confidence ?? -1)) {
      best = { url: cand.url, source: `${cand.source}-low`, confidence: score, query: primaryQuery };
    }
  }

  if (best) return best;
  return { url: '', source: 'none', confidence: null, query: primaryQuery };
}
