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
import { matchGoldenSentence } from '@/lib/ai-sentence-golden';

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
  // base/text EN; meaning_vi VI
  if (looksVietnamese(base) || looksVietnamese(text)) return null;
  if (!looksEnglishHead(base) && !looksEnglishHead(text)) return null;
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

/** Có dấu tiếng Việt / chữ Việt → không được dùng làm S/V/O (xương phải EN) */
function looksVietnamese(s: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
}

function looksEnglishHead(s: string): boolean {
  const t = s.trim();
  if (!t || looksVietnamese(t)) return false;
  // Cho phép chữ Latin + ' -
  return /^[A-Za-z][A-Za-z'’\-\s]{0,40}$/.test(t);
}

function normalizeKernel(raw: unknown, sentence: string): SentenceKernel | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  let s = typeof o.s === 'string' ? o.s.trim() : '';
  let v = typeof o.v === 'string' ? o.v.trim() : '';
  let oPart = typeof o.o === 'string' ? o.o.trim() : '';
  // AI hay nhét VI vào s/v/o → reject
  if (!looksEnglishHead(s) || !looksEnglishHead(v)) return undefined;
  if (oPart && !looksEnglishHead(oPart)) oPart = '';

  let text =
    (typeof o.text === 'string' && o.text.trim()) ||
    [s, v, oPart].filter(Boolean).join(' ');
  if (looksVietnamese(text)) {
    text = [s, v, oPart].filter(Boolean).join(' ');
  }
  const translation_vi =
    typeof o.translation_vi === 'string' && o.translation_vi.trim()
      ? o.translation_vi.trim()
      : '—';
  // translation_vi được phép VI; s/v/o/text phải EN
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
  // build_levels.text phải là câu/mảnh EN — slot_vi mới là VI
  if (looksVietnamese(text) && !/[A-Za-z]{3,}/.test(text)) return null;
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

    // Batch drill / desktop: 40/phút/user (trước 20 dễ 429 khi test 20 câu)
    const rl = await checkRateLimitAsync(`ai-sentence:${userId}`, 40, 60_000);
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

    // P0: golden Buổi 2 — không tin AI cho 4 câu panic live
    const golden = matchGoldenSentence(sentence);
    if (golden) {
      const data: SentenceAnalysisData = {
        sentence: golden.sentence,
        translation_vi: golden.translation_vi,
        structure: golden.structure,
        kernel: golden.kernel,
        logic: golden.logic,
        segments: golden.segments,
        build_levels: golden.build_levels,
        chunks: golden.chunks,
        notes: golden.notes,
      };
      return NextResponse.json({
        success: true,
        data: {
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
                  example: data.kernel?.text || sentence,
                  collocations: data.chunks.map((c) => c.base),
                },
              ],
            },
          ],
          familyWords: data.chunks.map((c) => ({
            word: c.base,
            pos: c.pos || 'GOLDEN',
            meaning: c.meaning_vi,
          })),
          _bestIndex: 0,
        },
        analysis: data,
        source: 'ai_sentence',
        aiSource: 'golden',
        plan,
      });
    }

    // Prompt NGẮN — XƯƠNG (s/v/o/text/build_levels/chunks.base) = ENGLISH only; VI chỉ ở *translation* fields
    const prompt = `English sentence skeleton for Vietnamese learners. SENTENCE: "${sentence}"
${context ? `CONTEXT: "${context}"` : ''}
Return ONLY JSON:
{"translation_vi":"full natural Vietnamese of the sentence","structure":"S+V+O","kernel":{"text":"English kernel 3-8 words.","s":"English subject HEAD from sentence","v":"English main verb from sentence","o":"English object HEAD or \\"\\"","translation_vi":"short Vietnamese gist"},"logic":null,"segments":[{"text":"English span from sentence","role":"S|V|O|modifier|frame|adverb|pp|clause|other","label_vi":"Vietnamese label","keep":true}],"build_levels":[{"level":0,"text":"English kernel words only","slot_vi":"Xương"},{"level":1,"text":"English longer","slot_vi":"+ layer"},{"level":2,"text":"full English sentence","slot_vi":"Full"}],"chunks":[{"text":"English surface","base":"english lemma","meaning_vi":"Vietnamese gloss"}],"notes":["optional tip in Vietnamese"]}
CRITICAL:
- kernel.s, kernel.v, kernel.o, kernel.text, build_levels[].text, chunks[].base, chunks[].text, segments[].text MUST be ENGLISH words taken from the sentence (or English lemma). NEVER Vietnamese.
- ONLY these may be Vietnamese: translation_vi, kernel.translation_vi, label_vi, slot_vi, meaning_vi, notes.
- Example: "My younger sister likes spicy food." → s="sister" (or "younger sister"), v="likes", o="food" (or "spicy food"), NOT "em gái"/"thích".
- Drop frame openers. Finite main verb only. Adverb is not object. JSON only.`;

    type AiSentenceJson = {
      translation_vi?: string;
      structure?: string;
      kernel?: unknown;
      logic?: unknown;
      segments?: unknown[];
      build_levels?: unknown[];
      chunks?: unknown[];
      notes?: unknown[];
    };

    let parsed: AiSentenceJson | null = null;
    let aiSource: 'ai' | 'heuristic' = 'ai';

    try {
      const router = getSentenceRouter();
      let text: string;
      try {
        text = (await router.generate(prompt, 'fast', true)).trim();
      } catch (firstErr) {
        console.warn('[ai-sentence] fast failed, retry normal:', firstErr);
        text = (await router.generate(prompt, 'normal', true)).trim();
      }
      if (text.startsWith('```json')) text = text.replace(/```json/g, '');
      if (text.startsWith('```')) text = text.replace(/```/g, '');
      text = text.trim();
      try {
        parsed = JSON.parse(text) as AiSentenceJson;
      } catch {
        const m = text.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('Invalid AI JSON for sentence analysis');
        parsed = JSON.parse(m[0]) as AiSentenceJson;
      }
    } catch (aiErr) {
      // KHÔNG 500 — fallback heuristic để desktop/live luôn có kết quả
      console.warn('[ai-sentence] AI failed, heuristic fallback:', aiErr);
      parsed = null;
      aiSource = 'heuristic';
    }

    let data: SentenceAnalysisData;
    if (parsed !== null) {
      const aiJson: AiSentenceJson = parsed;
      const rawChunks = Array.isArray(aiJson.chunks) ? aiJson.chunks : [];
      let chunks = rawChunks
        .map(normalizeChunk)
        .filter((c): c is SentenceChunk => c !== null)
        .slice(0, 8);

      try {
        chunks = await enrichChunksFromDb(chunks);
      } catch (dbErr) {
        console.warn('[ai-sentence] DB enrich skipped:', dbErr);
      }

      const notes = Array.isArray(aiJson.notes)
        ? aiJson.notes.filter((n): n is string => typeof n === 'string').slice(0, 3)
        : [];

      let kernel = normalizeKernel(aiJson.kernel, sentence);
      let logic = normalizeLogic(aiJson.logic);
      if (!logic) logic = detectComparativeLogic(sentence);

      const segments = Array.isArray(aiJson.segments)
        ? aiJson.segments
            .map(normalizeSegment)
            .filter((s): s is SentenceSegment => s !== null)
            .slice(0, 14)
        : [];
      let build_levels = Array.isArray(aiJson.build_levels)
        ? aiJson.build_levels
            .map(normalizeBuildLevel)
            .filter((b): b is SentenceBuildLevel => b !== null)
            .sort((a, b) => a.level - b.level)
            .slice(0, 8)
        : [];

      if (!kernel) {
        data = heuristicAnalysis(sentence);
        aiSource = 'heuristic';
      } else {
        if (logic && build_levels.length < 3) {
          build_levels = [
            { level: 0, text: kernel.text.replace(/\.$/, ''), slot_vi: 'Xương S–V–O' },
            { level: 1, text: `less in ${logic.a} than in ${logic.b}`, slot_vi: 'less A than B' },
            { level: 2, text: sentence, slot_vi: 'Câu đầy đủ' },
          ];
        }
        if (build_levels.length < 2) {
          build_levels = [
            { level: 0, text: kernel.text.replace(/\.$/, ''), slot_vi: 'Xương S–V–O' },
            { level: 1, text: sentence, slot_vi: 'Câu đầy đủ' },
          ];
        }

        let structure =
          typeof aiJson.structure === 'string' ? aiJson.structure.trim() : undefined;
        if (!structure && logic) structure = logic.pattern;
        if (!structure) structure = kernel.o ? 'S + V + O' : 'S + V';

        if (logic && (kernel.translation_vi === '—' || kernel.translation_vi.length < 12)) {
          kernel = { ...kernel, translation_vi: logic.formula_vi };
        }

        let translation_vi = (aiJson.translation_vi || '').trim();
        if (!translation_vi || translation_vi === '—') {
          translation_vi =
            (kernel.translation_vi && kernel.translation_vi !== '—'
              ? kernel.translation_vi
              : null)
            || logic?.formula_vi
            || `Xương: ${kernel.text}`;
        }

        data = {
          sentence,
          translation_vi,
          structure,
          kernel,
          logic,
          segments: segments.length ? segments : undefined,
          build_levels,
          chunks,
          notes: notes.length ? notes : undefined,
        };
      }
    } else {
      data = heuristicAnalysis(sentence);
    }

    // Shape tương thích Desktop / extension (cũ đọc translation + chunks)
    const chunksOut = data.chunks || [];
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
              example: data.kernel?.text || sentence,
              collocations: chunksOut.map((c) => c.base),
            },
          ],
        },
      ],
      familyWords: chunksOut.map((c) => ({
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
      aiSource,
      plan,
    });
  } catch (error: unknown) {
    console.error('[ai-sentence] unhandled:', error);
    return safeErrorResponse(error, 'Failed to analyze sentence');
  }
}

/** Fallback khi AI chết — heuristic tốt hơn (bỏ frame, ưu tiên finite verb) */
function heuristicAnalysis(sentence: string): SentenceAnalysisData {
  const logic = detectComparativeLogic(sentence);
  const stop = new Set([
    'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'with', 'that', 'this', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'by', 'from', 'as', 'at', 'or', 'but', 'not',
    'it', 'its', 'their', 'his', 'her', 'who', 'which', 'whom', 'whose', 'what', 'when', 'where',
    'into', 'onto', 'upon', 'about', 'after', 'before', 'between', 'during', 'without', 'within',
    'than', 'then', 'so', 'if', 'while', 'although', 'because', 'since', 'until', 'unless',
    'also', 'only', 'even', 'still', 'just', 'very', 'more', 'most', 'such', 'both', 'each',
    'in', 'a', 'series', 'of', // frame bait
  ]);
  const frameOpeners =
    /^(in a series of|according to|for decades|for years|in reality|by the same token|from this perspective|as a ban|until that|things go|even when|unable to)\b/i;

  let work = sentence.trim();
  // Bỏ frame mở đầu nếu có
  const frameM = work.match(
    /^(In a series of [^,]+,\s*|According to [^,]+,\s*|For decades,\s*|For years,\s*|In reality,\s*however,\s*|By the same token,\s*|From this perspective,\s*)/i,
  );
  if (frameM) work = work.slice(frameM[0].length).trim();

  const tokens = work
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const FINITE =
    /^(is|are|was|were|has|have|had|do|does|did|can|could|will|would|should|must|may|might|lies|lie|makes|make|takes|take|gives|give|gets|get|seems|seem|becomes|become|remains|remain|turns|turn|outperforms?|outperformed|supplants?|supplanted|shifts?|shifted|involves?|involved|demands?|demanded|requires?|required|equals?|asks?|asked|reads?|read|writes?|wrote|produces?|produced|highlights?|underlines?|describes?|argues?|claims?|proves?|function|functions)$/i;
  const ADV = /ly$/i;
  const VING = /ing$/i;

  // S: cụm đầu đến trước finite verb (cho phép V-ing đầu làm gerund S)
  let vIdx = tokens.findIndex((t, i) => FINITE.test(t) && !(i === 0 && VING.test(t)));
  if (vIdx < 0) {
    vIdx = tokens.findIndex((t) => /ed$/i.test(t) && !ADV.test(t));
  }
  if (vIdx < 0) vIdx = Math.min(1, tokens.length - 1);

  const sTokens = tokens.slice(0, Math.max(1, vIdx)).filter((t) => !stop.has(t.toLowerCase()) || VING.test(t));
  // head S = last content in sTokens
  let s =
    sTokens.filter((t) => !ADV.test(t)).slice(-2).join(' ')
    || tokens[0]
    || 'it';
  // Prefer noun-like last token of S
  const sParts = s.split(/\s+/);
  if (sParts.length > 1 && stop.has(sParts[0].toLowerCase())) s = sParts.slice(1).join(' ');

  // V: finite (+ particle optional)
  let v = tokens[vIdx] || 'is';
  if (vIdx + 1 < tokens.length && /^(out|up|in|on|off|down|over|to)$/i.test(tokens[vIdx + 1])) {
    // has + V-ed
  }
  if (/^(has|have|had|is|are|was|were)$/i.test(v) && vIdx + 1 < tokens.length) {
    const next = tokens[vIdx + 1];
    if (!ADV.test(next) && !stop.has(next.toLowerCase())) {
      v = `${v} ${next}`;
    } else if (vIdx + 2 < tokens.length && ADV.test(next)) {
      // has subtly supplanted → has supplanted
      const n2 = tokens[vIdx + 2];
      if (n2 && !stop.has(n2.toLowerCase())) v = `${tokens[vIdx]} ${n2}`;
    }
  }

  // O: first content after V block, skip adverbs
  let oStart = vIdx + (v.includes(' ') ? 2 : 1);
  while (oStart < tokens.length && (ADV.test(tokens[oStart]) || stop.has(tokens[oStart].toLowerCase()))) {
    oStart += 1;
  }
  let o = '';
  if (oStart < tokens.length) {
    const oTok = tokens[oStart];
    if (!ADV.test(oTok)) o = oTok;
    // the pen → pen
    if (stop.has(o.toLowerCase()) && oStart + 1 < tokens.length) o = tokens[oStart + 1];
  }

  // Clean
  s = s.replace(/[^A-Za-z'\-\s]/g, '').trim() || 'it';
  v = v.replace(/[^A-Za-z'\-\s]/g, '').trim() || 'is';
  o = o.replace(/[^A-Za-z'\-\s]/g, '').trim();

  const gist =
    logic?.formula_vi
    || `Xương: ${[s, v, o].filter(Boolean).join(' ')}.`;

  const kernel: SentenceKernel = {
    text: [s, v, o].filter(Boolean).join(' ') + '.',
    s,
    v,
    o: o || undefined,
    translation_vi: gist,
  };

  const build_levels: SentenceBuildLevel[] = logic
    ? [
        { level: 0, text: kernel.text.replace(/\.$/, ''), slot_vi: 'Xương S–V–O' },
        { level: 1, text: `less in ${logic.a} than in ${logic.b}`, slot_vi: logic.pattern },
        { level: 2, text: sentence, slot_vi: 'Câu đầy đủ' },
      ]
    : [
        { level: 0, text: kernel.text.replace(/\.$/, ''), slot_vi: 'Xương S–V–O' },
        { level: 1, text: sentence, slot_vi: 'Câu đầy đủ' },
      ];

  const content = tokens.filter((w) => w.length > 2 && !stop.has(w.toLowerCase()) && !ADV.test(w));
  const chunks: SentenceChunk[] = content.slice(0, 5).map((w) => ({
    text: w,
    base: w.toLowerCase(),
    meaning_vi: '(xem ngữ cảnh câu)',
  }));

  return {
    sentence,
    translation_vi: gist,
    structure: logic?.pattern || (o ? 'S + V + O' : 'S + V'),
    kernel,
    logic,
    build_levels,
    chunks,
    notes: frameOpeners.test(sentence)
      ? ['Đã bỏ frame mở câu khi ước lượng xương.']
      : ['Phân tích dự phòng — ưu tiên finite verb mệnh đề chính.'],
  };
}
