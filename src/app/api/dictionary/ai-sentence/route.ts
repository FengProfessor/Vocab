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

/** So sánh / paraphrase logic — bổ sung khi SVO chưa đủ ý */
export interface SentenceLogic {
  pattern: string;
  a: string;
  b: string;
  formula_vi: string;
}

export interface SentenceAnalysisData {
  sentence: string;
  translation_vi: string;
  /** Pattern ngắn, vd. S + V + O · less A than B */
  structure?: string;
  /** Xương 3–8 từ */
  kernel?: SentenceKernel;
  /** Xương logic (less A than B, not A but B…) */
  logic?: SentenceLogic;
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

function normalizeLogic(raw: unknown): SentenceLogic | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const a = typeof o.a === 'string' ? o.a.trim() : '';
  const b = typeof o.b === 'string' ? o.b.trim() : '';
  if (!a || !b) return undefined;
  const pattern =
    typeof o.pattern === 'string' && o.pattern.trim()
      ? o.pattern.trim()
      : 'less A than B';
  const formula_vi =
    typeof o.formula_vi === 'string' && o.formula_vi.trim()
      ? o.formula_vi.trim()
      : `Ý chính ≈ B (${b}), không phải A (${a})`;
  return { pattern, a, b, formula_vi };
}

/** Fallback local: less in A than in B / less A than B */
function detectComparativeLogic(sentence: string): SentenceLogic | undefined {
  const s = sentence.trim();
  // less in X than in Y
  let m = s.match(
    /\bless\s+in\s+(.+?)\s+than\s+in\s+(.+?)(?:[.!?]|$)/i,
  );
  if (m) {
    const a = m[1].replace(/,+\s*$/, '').trim();
    const b = m[2].replace(/,+\s*$/, '').trim();
    if (a && b) {
      return {
        pattern: 'less A than B',
        a,
        b,
        formula_vi: `Ý chính ≈ B (${shortClip(b)}), không phải A (${shortClip(a)})`,
      };
    }
  }
  // not A but B / rather than
  m = s.match(/\bnot\s+(.+?)\s+but\s+(.+?)(?:[.!?]|$)/i);
  if (m) {
    const a = m[1].trim();
    const b = m[2].trim();
    if (a && b) {
      return {
        pattern: 'not A but B',
        a,
        b,
        formula_vi: `Ý chính = B (${shortClip(b)}), không phải A (${shortClip(a)})`,
      };
    }
  }
  return undefined;
}

function shortClip(t: string, n = 36): string {
  const x = t.trim();
  if (x.length <= n) return x;
  return `${x.slice(0, n - 1)}…`;
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
IMPORTANT: Many exam sentences are COMPARATIVE / paraphrase logic (less A than B, not A but B). Then SVO alone feels incomplete — you MUST fill "logic".

SENTENCE: "${sentence}"
${context ? `CONTEXT: "${context}"` : ''}

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "translation_vi": "Natural fluent Vietnamese of the FULL sentence",
  "structure": "Short pattern e.g. S + V + O · less A than B",
  "kernel": {
    "text": "3-10 word English kernel ending with period",
    "s": "subject HEAD only (1-3 words, not long relative clause)",
    "v": "main finite verb / verb phrase of MAIN clause",
    "o": "object/complement HEAD if any",
    "translation_vi": "1 short Vietnamese gist of the kernel only"
  },
  "logic": null,
  "segments": [
    {
      "text": "contiguous span from the sentence (surface form)",
      "role": "S|V|O|C|modifier|frame|adverb|pp|clause|other",
      "label_vi": "short VI label",
      "keep": true
    }
  ],
  "build_levels": [
    { "level": 0, "text": "kernel bones", "slot_vi": "Xương S–V–O" },
    { "level": 1, "text": "add one layer", "slot_vi": "..." },
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

For COMPARATIVE / contrast, set logic (do NOT leave null):
{
  "logic": {
    "pattern": "less A than B",
    "a": "the weaker / rejected side (short EN)",
    "b": "the stronger / real focus (short EN)",
    "formula_vi": "1 line VI e.g. Lý do ≈ B, không phải A"
  }
}
Example: "The reason … lies less in the technology itself than in what each method asks of the brain."
→ kernel: s=reason v=lies (or "lies less") o="" ; text "The reason lies less in A than in B."
→ logic: pattern="less A than B", a="technology itself", b="what each method asks of the brain",
  formula_vi="Lý do chủ yếu ≈ B (yêu cầu với não), không phải A (công nghệ)."
→ structure: "less A than B (paraphrase)"
→ build_levels should include a step that lights A vs B contrast.

RULES (critical):
1. kernel S/V/O = short HEADS only. Drop frame "according to…", adverbs, long relatives from s/v/o fields.
2. If sentence has less…than… / not…but… / rather than → logic is REQUIRED; kernel.translation_vi should state the contrast gist.
3. segments: 4-12 items left→right. keep=true only for main bones; frame/according-to = keep false.
4. build_levels: 3-5 steps kernel → full. Each step one clear layer.
5. chunks: 2-6 saveable units (less…than, ask of, according to, …).
6. JSON only, no markdown fences.`;

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
      logic?: unknown;
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
    let logic = normalizeLogic(parsed.logic);
    if (!logic) logic = detectComparativeLogic(sentence);

    const segments = Array.isArray(parsed.segments)
      ? parsed.segments
          .map(normalizeSegment)
          .filter((s): s is SentenceSegment => s !== null)
          .slice(0, 14)
      : [];
    let build_levels = Array.isArray(parsed.build_levels)
      ? parsed.build_levels
          .map(normalizeBuildLevel)
          .filter((b): b is SentenceBuildLevel => b !== null)
          .sort((a, b) => a.level - b.level)
          .slice(0, 8)
      : [];

    // Comparative: đảm bảo có ≥3 tầng nếu AI trả quá ít
    if (logic && build_levels.length < 3 && kernel) {
      build_levels = [
        {
          level: 0,
          text: kernel.text.replace(/\.$/, ''),
          slot_vi: 'Xương (reason / lies…)',
        },
        {
          level: 1,
          text: `less in ${logic.a} than in ${logic.b}`,
          slot_vi: 'less A than B',
        },
        {
          level: 2,
          text: sentence,
          slot_vi: 'Câu đầy đủ',
        },
      ];
    }

    // Fallback structure từ kernel / logic
    let structure =
      typeof parsed.structure === 'string' ? parsed.structure.trim() : undefined;
    if (!structure && logic) {
      structure = logic.pattern;
    }
    if (!structure && kernel) {
      structure = kernel.o ? 'S + V + O' : 'S + V';
    }

    // Gist kernel: nếu có logic mà gist quá mỏng → bổ sung formula
    if (kernel && logic && (kernel.translation_vi === '—' || kernel.translation_vi.length < 12)) {
      kernel.translation_vi = logic.formula_vi;
    }

    const data: SentenceAnalysisData = {
      sentence,
      translation_vi: (parsed.translation_vi || '').trim() || '—',
      structure,
      kernel,
      logic,
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
