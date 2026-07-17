import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { AIRouter, getRouter } from '@/lib/ai-router';
import {
  getAuthUser,
  unauthorized,
  sanitizeForPrompt,
  checkRateLimitAsync,
  safeErrorResponse,
} from '@/lib/api-security';
import { checkAccess, resolvePlanByUserId } from '@/lib/entitlement';

export const maxDuration = 30;

export interface SentenceChunk {
  text: string;
  base: string;
  meaning_vi: string;
  pos?: string;
  /** Nghĩa ưu tiên từ global_dictionary nếu có */
  from_db?: boolean;
  ipa?: string;
}

/** Kernel S–V–O (xương câu) — method Buổi 2 LingoPro */
export interface SentenceKernel {
  text: string;
  s: string;
  v: string;
  o?: string;
  translation_vi: string;
}

/**
 * Mảnh câu theo lượt đọc:
 * keep=true = Lượt 1 giữ (xương); keep=false = gạch tạm (đồ trang trí)
 */
export interface SentenceSegment {
  text: string;
  role: 'S' | 'V' | 'O' | 'C' | 'modifier' | 'frame' | 'adverb' | 'pp' | 'clause' | 'other';
  label_vi: string;
  keep: boolean;
}

/** Thang xây ngược kernel → full (wow build) */
export interface SentenceBuildLevel {
  level: number;
  text: string;
  slot_vi: string;
}

export interface SentenceAnalysisData {
  sentence: string;
  translation_vi: string;
  /** Pattern ngắn, vd. S + V + O */
  structure?: string;
  /** Xương 3–8 từ */
  kernel?: SentenceKernel;
  /** Tách lớp: giữ / gạch */
  segments?: SentenceSegment[];
  /** Level 0 = kernel → full */
  build_levels?: SentenceBuildLevel[];
  chunks: SentenceChunk[];
  notes?: string[];
}

type GdMeaning = { pos?: string; definition?: string; example?: string };
type GdData = {
  pronunciations?: { ipa?: string }[];
  results?: { meanings?: GdMeaning[] }[];
};

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function isMultiWord(s: string): boolean {
  return wordCount(s) >= 2 || s.trim().length > 40;
}

function getSentenceRouter(): AIRouter {
  return getRouter();
}

function normalizeChunk(raw: unknown): SentenceChunk | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const text = typeof o.text === 'string' ? o.text.trim() : '';
  const base = typeof o.base === 'string' ? o.base.trim().toLowerCase() : text.toLowerCase();
  const meaning_vi = typeof o.meaning_vi === 'string' ? o.meaning_vi.trim() : '';
  if (!text && !base) return null;
  const pos = typeof o.pos === 'string' ? o.pos.trim() : undefined;
  return {
    text: text || base,
    base: base || text.toLowerCase(),
    meaning_vi: meaning_vi || '—',
    pos,
  };
}

const SEGMENT_ROLES = new Set([
  'S', 'V', 'O', 'C', 'modifier', 'frame', 'adverb', 'pp', 'clause', 'other',
]);

function normalizeSegment(raw: unknown): SentenceSegment | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const text = typeof o.text === 'string' ? o.text.trim() : '';
  if (!text) return null;
  const roleRaw = typeof o.role === 'string' ? o.role.trim() : 'other';
  const role = (SEGMENT_ROLES.has(roleRaw) ? roleRaw : 'other') as SentenceSegment['role'];
  const label_vi =
    typeof o.label_vi === 'string' && o.label_vi.trim()
      ? o.label_vi.trim()
      : role;
  const keep = o.keep === true || role === 'S' || role === 'V' || role === 'O' || role === 'C';
  return { text, role, label_vi, keep };
}

function normalizeKernel(raw: unknown, sentence: string): SentenceKernel | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const s = typeof o.s === 'string' ? o.s.trim() : '';
  const v = typeof o.v === 'string' ? o.v.trim() : '';
  if (!s || !v) return undefined;
  const oPart = typeof o.o === 'string' ? o.o.trim() : '';
  const text =
    (typeof o.text === 'string' && o.text.trim()) ||
    [s, v, oPart].filter(Boolean).join(' ');
  const translation_vi =
    typeof o.translation_vi === 'string' && o.translation_vi.trim()
      ? o.translation_vi.trim()
      : '—';
  return {
    text: text.endsWith('.') ? text : `${text}.`,
    s,
    v,
    o: oPart || undefined,
    translation_vi,
  };
}

function normalizeBuildLevel(raw: unknown): SentenceBuildLevel | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const text = typeof o.text === 'string' ? o.text.trim() : '';
  if (!text) return null;
  const level = typeof o.level === 'number' && Number.isFinite(o.level) ? Math.round(o.level) : 0;
  const slot_vi =
    typeof o.slot_vi === 'string' && o.slot_vi.trim() ? o.slot_vi.trim() : `Lớp ${level}`;
  return { level, text, slot_vi };
}

async function enrichChunksFromDb(chunks: SentenceChunk[]): Promise<SentenceChunk[]> {
  if (chunks.length === 0) return chunks;
  const supabase = createServiceClient();
  const bases = [...new Set(chunks.map((c) => c.base.toLowerCase()).filter(Boolean))].slice(0, 12);

  const { data: rows } = await supabase
    .from('global_dictionary')
    .select('word, data')
    .in('word', bases);

  const map = new Map<string, GdData>();
  for (const row of rows || []) {
    if (row?.word) map.set(String(row.word).toLowerCase(), (row.data ?? null) as GdData);
  }

  return chunks.map((chunk) => {
    const gd = map.get(chunk.base.toLowerCase());
    const meaning = gd?.results?.[0]?.meanings?.[0];
    if (!meaning?.definition) return chunk;
    return {
      ...chunk,
      meaning_vi: meaning.definition,
      pos: meaning.pos || chunk.pos,
      ipa: gd?.pronunciations?.[0]?.ipa || chunk.ipa,
      from_db: true,
    };
  });
}

/**
 * POST /api/dictionary/ai-sentence
 * Body: { sentence: string, context?: string }
 *
 * Phân tích câu theo method LingoPro Buổi 2:
 * ngợp → bóc kernel S–V–O → gạch modifier → build lại từng lớp → chunk SRS.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const rl = await checkRateLimitAsync(`ai-sentence:${userId}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } },
      );
    }

    const body = (await req.json()) as { sentence?: unknown; context?: unknown; phrase?: unknown };
    const rawSentence =
      (typeof body.sentence === 'string' && body.sentence) ||
      (typeof body.phrase === 'string' && body.phrase) ||
      '';
    if (!rawSentence || typeof rawSentence !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing sentence' }, { status: 400 });
    }
    if (rawSentence.length > 400) {
      return NextResponse.json({ success: false, error: 'sentence too long (max 400)' }, { status: 400 });
    }

    const sentence = sanitizeForPrompt(rawSentence, 400).trim();
    if (!sentence) {
      return NextResponse.json({ success: false, error: 'Empty sentence' }, { status: 400 });
    }
    if (!isMultiWord(sentence)) {
      return NextResponse.json(
        { success: false, error: 'Use word lookup for single words', code: 'USE_WORD_LOOKUP' },
        { status: 400 },
      );
    }

    const context =
      typeof body.context === 'string' ? sanitizeForPrompt(body.context, 500) : '';

    const supabase = createServiceClient();
    const plan = await resolvePlanByUserId(supabase, userId);
    const access = checkAccess(plan, 'ai_sentence');
    if (!access.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pro plan required for sentence analysis',
          code: 'PRO_REQUIRED',
          upgradeTo: access.upgradeTo ?? 'pro',
        },
        { status: 403 },
      );
    }

    const prompt = `You are a bilingual English→Vietnamese tutor for Vietnamese high-school / adult learners.
Teach the LingoPro "skeleton" method (Buổi 2): long sentence = KERNEL (S–V–O bones) + decoration layers.
Do NOT only translate. Strip modifiers first, then rebuild.

SENTENCE: "${sentence}"
${context ? `CONTEXT: "${context}"` : ''}

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "translation_vi": "Natural fluent Vietnamese of the FULL sentence",
  "structure": "S + V + O (or S + V + C / passive pattern), max 12 words",
  "kernel": {
    "text": "3-8 word English kernel ending with period, main clause only",
    "s": "subject head (lemma or short NP, no long modifiers)",
    "v": "main finite verb / verb phrase of MAIN clause",
    "o": "object/complement head if any, else empty string",
    "translation_vi": "1 short Vietnamese gist of the kernel only"
  },
  "segments": [
    {
      "text": "contiguous span from the sentence (surface form)",
      "role": "S|V|O|C|modifier|frame|adverb|pp|clause|other",
      "label_vi": "short VI label e.g. Chủ ngữ / Động từ chính / V-ing gắn S / Khung / Cụm giới từ",
      "keep": true
    }
  ],
  "build_levels": [
    { "level": 0, "text": "same as kernel.text", "slot_vi": "Xương S–V–O" },
    { "level": 1, "text": "kernel + one new layer", "slot_vi": "what was added in VI, e.g. Trạng từ" },
    { "level": 2, "text": "...", "slot_vi": "..." }
  ],
  "chunks": [
    {
      "text": "surface form",
      "base": "dictionary base / multi-word unit",
      "meaning_vi": "short gloss 2-8 VI words in THIS context",
      "pos": "optional VI POS"
    }
  ],
  "notes": ["0-2 short learning tips in Vietnamese"]
}

RULES (critical):
1. kernel = MAIN CLAUSE bones only. Drop frame (In a series…), adverbs, PP, relative clauses, V-ing postmodifiers, even-when clauses.
   Example: "students taking notes by hand … outperformed those using laptops …"
   → kernel.text "Students outperformed those." s=students v=outperformed o=those
2. Finite main verb only for V (not V-ing modifiers). Passive: keep "is paid for" etc. as v.
3. segments: cover the sentence left→right in order, 4-12 items. keep=true ONLY for S/V/O/C bones of main clause. Everything else keep=false (gạch tạm lượt 1).
4. build_levels: 3-6 steps from kernel → nearly full. Last level may be the full sentence. Each step adds ONE clear layer (adj / adv / PP / who-which / V-ing / frame).
5. chunks: 2-6 SAVEABLE units (phrasal verbs, collocations, hard words, idioms). Skip stopwords. Multi-word bases stay intact ("take notes", "outperform", "conceptual understanding").
6. translation_vi = full sentence; kernel.translation_vi = gist only (shorter).
7. Labels in Vietnamese, simple (no heavy grammar jargon). JSON only, no markdown fences.`;

    // Vercel maxDuration=30s + desktop ~28s → KHÔNG dùng smart (timeout 180s).
    // fast (12s) trước, normal fallback — tránh socket chết → client "fetch failed".
    const router = getSentenceRouter();
    let text: string;
    try {
      text = (await router.generate(prompt, 'fast', true)).trim();
    } catch (firstErr) {
      console.warn('[ai-sentence] fast tier failed, retry normal:', firstErr);
      text = (await router.generate(prompt, 'normal', true)).trim();
    }

    if (text.startsWith('```json')) text = text.replace(/```json/g, '');
    if (text.startsWith('```')) text = text.replace(/```/g, '');
    text = text.trim();

    let parsed: {
      translation_vi?: string;
      structure?: string;
      kernel?: unknown;
      segments?: unknown[];
      build_levels?: unknown[];
      chunks?: unknown[];
      notes?: unknown[];
    };
    try {
      parsed = JSON.parse(text) as typeof parsed;
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('Invalid AI JSON for sentence analysis');
      parsed = JSON.parse(m[0]) as typeof parsed;
    }

    const rawChunks = Array.isArray(parsed.chunks) ? parsed.chunks : [];
    let chunks = rawChunks
      .map(normalizeChunk)
      .filter((c): c is SentenceChunk => c !== null)
      .slice(0, 8);

    try {
      chunks = await enrichChunksFromDb(chunks);
    } catch (dbErr) {
      console.warn('[ai-sentence] DB enrich skipped:', dbErr);
    }

    const notes = Array.isArray(parsed.notes)
      ? parsed.notes.filter((n): n is string => typeof n === 'string').slice(0, 3)
      : [];

    const kernel = normalizeKernel(parsed.kernel, sentence);
    const segments = Array.isArray(parsed.segments)
      ? parsed.segments
          .map(normalizeSegment)
          .filter((s): s is SentenceSegment => s !== null)
          .slice(0, 14)
      : [];
    const build_levels = Array.isArray(parsed.build_levels)
      ? parsed.build_levels
          .map(normalizeBuildLevel)
          .filter((b): b is SentenceBuildLevel => b !== null)
          .sort((a, b) => a.level - b.level)
          .slice(0, 8)
      : [];

    // Fallback structure từ kernel nếu AI bỏ
    let structure =
      typeof parsed.structure === 'string' ? parsed.structure.trim() : undefined;
    if (!structure && kernel) {
      structure = kernel.o ? 'S + V + O' : 'S + V';
    }

    const data: SentenceAnalysisData = {
      sentence,
      translation_vi: (parsed.translation_vi || '').trim() || '—',
      structure,
      kernel,
      segments: segments.length ? segments : undefined,
      build_levels: build_levels.length ? build_levels : undefined,
      chunks,
      notes: notes.length ? notes : undefined,
    };

    // Shape tương thích Desktop / extension (cũ đọc translation + chunks)
    const dictionaryCompat = {
      word: sentence,
      resolvedWord: sentence,
      originalWord: sentence,
      sentenceAnalysis: data,
      results: [
        {
          meanings: [
            {
              pos: 'Câu',
              definition: data.translation_vi,
              example: kernel?.text || sentence,
              collocations: chunks.map((c) => c.base),
            },
          ],
        },
      ],
      familyWords: chunks.map((c) => ({
        word: c.base,
        pos: c.pos || (c.from_db ? 'DB' : 'AI'),
        meaning: c.meaning_vi,
      })),
      _bestIndex: 0,
    };

    return NextResponse.json({
      success: true,
      data: dictionaryCompat,
      analysis: data,
      source: 'ai_sentence',
      plan,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to analyze sentence');
  }
}
