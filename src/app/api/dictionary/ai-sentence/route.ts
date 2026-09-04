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
import { checkAccess } from '@/lib/entitlement';
import { resolvePlanByUserId } from '@/lib/entitlement-server';
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
  // segments.text = span EN trong câu; label_vi mới được VI
  if (looksVietnamese(text) && !/[A-Za-z]{3,}/.test(text)) return null;
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
  // Latin + ' - space; cho phép NP dài vừa (trước đây 40 ký tự → reject "the old teacher who…")
  return /^[A-Za-z][A-Za-z'’\-\s]{0,100}$/.test(t);
}

/** Rút head EN: bỏ mệnh đề quan hệ + lấy 1–2 từ lõi (NP/VP head) */
function compressEnglishHead(phrase: string, kind: 's' | 'v' | 'o'): string {
  let t = phrase.trim();
  if (!t) return '';
  // Bỏ RC gắn sau: teacher who lives… → teacher
  t = t.replace(/\s+,?\s*(who|which|that|whom|whose)\b[\s\S]*$/i, '').trim();
  // Bỏ frame PP đầu nếu lỡ nhét
  t = t.replace(/^(in|on|at|for|from|with|by|of)\s+/i, '').trim();
  const stop = new Set([
    'the', 'a', 'an', 'my', 'your', 'our', 'their', 'his', 'her', 'its', 'this', 'that', 'these', 'those',
    'of', 'to', 'in', 'on', 'for', 'and', 'with', 'by', 'from', 'as', 'at', 'or', 'but', 'not',
  ]);
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (kind === 'v') {
    // giữ phụ trợ + động từ chính tối đa 3 từ: has been reading
    return words.slice(0, 3).join(' ');
  }
  // S/O: head = từ nội dung cuối (bỏ stop)
  const content = words.filter((w) => !stop.has(w.toLowerCase()));
  if (content.length === 0) return words[words.length - 1];
  return content.slice(-2).join(' ');
}

function normalizeKernel(raw: unknown, sentence: string): SentenceKernel | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  let s = typeof o.s === 'string' ? o.s.trim() : '';
  let v = typeof o.v === 'string' ? o.v.trim() : '';
  let oPart = typeof o.o === 'string' ? o.o.trim() : '';
  // AI hay nhét VI vào s/v/o → reject toàn bộ kernel
  if (!looksEnglishHead(s) || !looksEnglishHead(v)) return undefined;
  if (oPart && !looksEnglishHead(oPart)) oPart = '';

  // Rút head (xương Buổi 2 = 1 head/slot, không cả RC)
  s = compressEnglishHead(s, 's') || s;
  v = compressEnglishHead(v, 'v') || v;
  if (oPart) oPart = compressEnglishHead(oPart, 'o') || oPart;
  if (!looksEnglishHead(s) || !looksEnglishHead(v)) return undefined;

  let text =
    (typeof o.text === 'string' && o.text.trim() && !looksVietnamese(o.text.trim())
      ? o.text.trim()
      : '')
    || [s, v, oPart].filter(Boolean).join(' ');
  // text kernel ngắn: head S V O
  if (text.split(/\s+/).length > 10 || /who|which|that/i.test(text)) {
    text = [s, v, oPart].filter(Boolean).join(' ');
  }
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
- Example: "My younger sister likes spicy food." → s="sister", v="likes", o="food", NOT "em gái"/"thích".
- Relative clause is NOT main V: "The old teacher who lives in Ha Noi teaches English every morning." → s="teacher", v="teaches", o="English" (who lives… = clause decoration).
- Heads short (1–2 words). Drop frame openers. Adverb is not object. JSON only.`;

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

      let notes = Array.isArray(aiJson.notes)
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

      // Kernel EN bắt buộc; nếu AI nhét VI / NP quá bẩn → heuristic xương + giữ VI/chunk AI nếu còn
      let usedHeuristicBones = false;
      if (!kernel) {
        const fallback = heuristicAnalysis(sentence);
        kernel = fallback.kernel;
        usedHeuristicBones = true;
        aiSource = 'heuristic';
        if (!build_levels.length) build_levels = fallback.build_levels || [];
        if (!segments.length && fallback.segments) segments.push(...fallback.segments);
        if (!chunks.length) chunks = fallback.chunks;
        if (!notes.length && fallback.notes) notes.push(...fallback.notes);
      }

      if (logic && build_levels.length < 3) {
        build_levels = [
          { level: 0, text: kernel!.text.replace(/\.$/, ''), slot_vi: 'Xương S–V–O' },
          { level: 1, text: `less in ${logic.a} than in ${logic.b}`, slot_vi: 'less A than B' },
          { level: 2, text: sentence, slot_vi: 'Câu đầy đủ' },
        ];
      }
      if (build_levels.length < 2 && kernel) {
        build_levels = buildBuildLevelsFromKernel(kernel, sentence, segments);
      }

      let structure =
        typeof aiJson.structure === 'string' ? aiJson.structure.trim() : undefined;
      if (!structure && logic) structure = logic.pattern;
      if (!structure) structure = kernel?.o ? 'S + V + O' : 'S + V';

      if (kernel && logic && (kernel.translation_vi === '—' || kernel.translation_vi.length < 12)) {
        kernel = { ...kernel, translation_vi: logic.formula_vi };
      }

      let translation_vi = (aiJson.translation_vi || '').trim();
      if (!translation_vi || translation_vi === '—' || /^xương\s*:/i.test(translation_vi)) {
        translation_vi =
          (kernel?.translation_vi && kernel.translation_vi !== '—' && !/^xương\s*:/i.test(kernel.translation_vi)
            ? kernel.translation_vi
            : null)
          || logic?.formula_vi
          || '';
      }
      // Không bao giờ để "Xương: The old…" làm bản dịch
      if (!translation_vi) {
        translation_vi = kernel
          ? `(Ước lượng) ${[kernel.s, kernel.v, kernel.o].filter(Boolean).join(' ')}`
          : sentence;
      }

      if (usedHeuristicBones) {
        notes = [
          ...notes,
          'Xương EN ước lượng (AI kernel lỗi/VI) — gist/chunk có thể từ AI.',
        ].slice(0, 4);
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

/** Build levels từ kernel + segments (RC / modifier / PP) */
function buildBuildLevelsFromKernel(
  kernel: SentenceKernel,
  sentence: string,
  segments: SentenceSegment[],
): SentenceBuildLevel[] {
  const kText = [kernel.s, kernel.v, kernel.o].filter(Boolean).join(' ');
  const levels: SentenceBuildLevel[] = [
    { level: 0, text: kText, slot_vi: 'Xương S–V–O' },
  ];
  const mods = segments
    .filter((s) => s.role === 'modifier' || s.role === 'adverb')
    .map((s) => s.text.trim())
    .filter(Boolean);
  if (mods.length) {
    levels.push({
      level: levels.length,
      text: `${kText} (+ ${mods.join(', ')})`,
      slot_vi: '+ tính từ / trạng từ',
    });
  }
  const extras = segments
    .filter((s) => s.role === 'clause' || s.role === 'pp' || s.role === 'frame')
    .map((s) => s.text.trim())
    .filter(Boolean);
  if (extras.length) {
    levels.push({
      level: levels.length,
      text: `${kText} ${extras.join(' ')}`.trim(),
      slot_vi: '+ mệnh đề / PP',
    });
  }
  const full = sentence.trim();
  const last = levels[levels.length - 1]?.text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '') || '';
  const fullNorm = full.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '');
  if (full && last !== fullNorm) {
    levels.push({ level: levels.length, text: full, slot_vi: 'Câu đầy đủ' });
  }
  return levels.map((l, i) => ({ ...l, level: i }));
}

const DET_STOP = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'with', 'that', 'this', 'these', 'those',
  'by', 'from', 'as', 'at', 'or', 'but', 'not', 'it', 'its', 'their', 'his', 'her', 'my', 'your', 'our',
  'who', 'which', 'whom', 'whose', 'what', 'when', 'where', 'into', 'onto', 'upon', 'about',
  'after', 'before', 'between', 'during', 'without', 'within', 'than', 'then', 'so', 'if', 'while',
  'although', 'because', 'since', 'until', 'unless', 'also', 'only', 'even', 'still', 'just', 'very',
  'more', 'most', 'such', 'both', 'each', 'every', 'ha', 'noi', // place fragments
]);

const AUX_FINITE =
  /^(is|are|was|were|has|have|had|do|does|did|can|could|will|would|should|must|may|might|am)$/i;

const KNOWN_FINITE =
  /^(likes?|liked|loves?|loved|lives?|lived|teaches?|taught|reads?|writes?|wrote|makes?|made|takes?|took|gives?|gave|gets?|got|seems?|becomes?|became|remains?|turns?|lies?|lay|goes?|went|comes?|came|works?|worked|plays?|played|helps?|helped|needs?|needed|wants?|wanted|shows?|showed|says?|said|tells?|told|asks?|asked|feels?|felt|keeps?|kept|leaves?|left|begins?|began|starts?|started|ends?|ended|opens?|opened|closes?|closed|moves?|moved|runs?|ran|walks?|walked|sits?|sat|stands?|stood|thinks?|thought|knows?|knew|sees?|saw|hears?|heard|calls?|called|uses?|used|finds?|found|builds?|built|buys?|bought|sells?|sold|pays?|paid|costs?|means?|meant|outperforms?|outperformed|supplants?|supplanted|shifts?|shifted|involves?|involved|demands?|demanded|requires?|required|equals?|highlights?|underlines?|describes?|argues?|claims?|proves?|functions?|produces?|produced|puts?|put|sets?|leads?|led|holds?|held|brings?|brought|meets?|met|grows?|grew|falls?|fell|rises?|rose)$/i;

const ADV_RE = /ly$/i;
const VING_RE = /ing$/i;
const REL_MARK = /^(who|which|that|whom|whose)$/i;

function isFiniteVerbToken(t: string): boolean {
  if (AUX_FINITE.test(t) || KNOWN_FINITE.test(t)) return true;
  // past regular
  if (/ed$/i.test(t) && t.length > 3 && !ADV_RE.test(t)) return true;
  // 3sg: teaches, lives, goes, watches (không nhận mọi *s — tránh students/books làm V)
  if (/(?:ches|shes|sses|zzes|xes|oes|[bcdfghjklmnpqrstvwxyz]ies|[aeiou]ys|[^s]s)$/i.test(t) && t.length > 3) {
    // loại plural danh từ phổ biến
    if (/^(students|teachers|books|things|years|days|people|children|women|men|ways|parts|words|ideas|problems|results|systems|methods|reasons|levels|areas|times|places|cases|points|groups|members|numbers|values|types|kinds|forms|names|sides|lines|pages|rooms|schools|cities|countries|laptops|mornings|evenings)$/i.test(t)) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Bóc who/which/whom (+ that RC) khỏi chuỗi token trước khi tìm V chính.
 * "teacher who lives in Ha Noi teaches" → "teacher teaches"
 * "Students who use laptops outperformed those who write" → "Students outperformed those"
 */
function stripRelativeClauses(tokens: string[]): { core: string[]; stripped: string[] } {
  const core: string[] = [];
  const stripped: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    const isRel =
      /^(who|which|whom)$/i.test(t)
      || (/^that$/i.test(t) && i > 0 && !DET_STOP.has(tokens[i - 1]?.toLowerCase() || ''));
    if (!isRel) {
      core.push(t);
      i += 1;
      continue;
    }
    // Bắt RC: marker + (tối đa 1 finite) + bổ ngữ đến trước finite kế (V chính)
    const rcStart = i;
    i += 1; // skip who/which/that
    let rcVerbs = 0;
    while (i < tokens.length) {
      if (/^(who|which|whom)$/i.test(tokens[i])) break;
      if (isFiniteVerbToken(tokens[i])) {
        rcVerbs += 1;
        if (rcVerbs >= 2) break; // finite thứ 2 = động từ mệnh đề chính
        i += 1;
        continue;
      }
      // sau verb RC: lấy object/pp ngắn, dừng nếu quá dài
      if (rcVerbs >= 1 && i - rcStart > 8) break;
      i += 1;
      if (rcVerbs >= 1 && i - rcStart > 6) break;
    }
    stripped.push(tokens.slice(rcStart, i).join(' '));
  }
  return { core, stripped };
}

/**
 * Fallback khi AI chết / kernel VI bị reject.
 * Nguyên tắc Buổi 2: bóc finite mệnh đề chính, bỏ RC/frame, head S–V–O EN.
 */
function heuristicAnalysis(sentence: string): SentenceAnalysisData {
  const logic = detectComparativeLogic(sentence);
  const frameOpeners =
    /^(in a series of|according to|for decades|for years|in reality|by the same token|from this perspective)\b/i;

  let work = sentence.trim();
  const frameM = work.match(
    /^(In a series of [^,]+,\s*|According to [^,]+,\s*|For decades,\s*|For years,\s*|In reality,\s*however,\s*|By the same token,\s*|From this perspective,\s*)/i,
  );
  if (frameM) work = work.slice(frameM[0].length).trim();

  const rawTokens = work
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const { core: tokens, stripped: rcStripped } = stripRelativeClauses(rawTokens);

  // Finite trên core (đã bỏ RC)
  const finiteIdxs: number[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (i === 0 && VING_RE.test(tokens[i]) && !AUX_FINITE.test(tokens[i])) continue;
    if (isFiniteVerbToken(tokens[i])) finiteIdxs.push(i);
  }

  let vIdx = finiteIdxs[0];
  if (vIdx === undefined) {
    vIdx = tokens.findIndex((t) => isFiniteVerbToken(t));
    if (vIdx < 0) vIdx = Math.min(Math.max(1, Math.floor(tokens.length / 3)), Math.max(0, tokens.length - 1));
  }

  const beforeV = tokens.slice(0, vIdx);
  const sTokens = beforeV.filter((t) => !DET_STOP.has(t.toLowerCase()) && !ADV_RE.test(t));
  let s =
    sTokens.slice(-1)[0]
    || beforeV.filter((t) => !DET_STOP.has(t.toLowerCase())).slice(-1)[0]
    || tokens[0]
    || 'it';

  let v = tokens[vIdx] || 'is';
  if (AUX_FINITE.test(v) && vIdx + 1 < tokens.length) {
    const next = tokens[vIdx + 1];
    if (ADV_RE.test(next) && vIdx + 2 < tokens.length) {
      const n2 = tokens[vIdx + 2];
      if (n2 && !DET_STOP.has(n2.toLowerCase())) v = `${tokens[vIdx]} ${n2}`;
    } else if (!DET_STOP.has(next.toLowerCase()) && !REL_MARK.test(next)) {
      if (VING_RE.test(next) || /ed$/i.test(next) || KNOWN_FINITE.test(next)) {
        v = `${v} ${next}`;
      }
    }
  }

  // O: chỉ skip article/prep/adv — GIỮ this/these/those (hay làm tân ngữ)
  const oSkip = new Set([
    'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'with', 'by', 'from', 'as', 'at',
    'or', 'but', 'not', 'very', 'also', 'only', 'just', 'even', 'still',
  ]);
  let oStart = vIdx + (v.includes(' ') ? 2 : 1);
  while (
    oStart < tokens.length
    && (ADV_RE.test(tokens[oStart]) || oSkip.has(tokens[oStart].toLowerCase()) || REL_MARK.test(tokens[oStart]))
  ) {
    oStart += 1;
  }
  let o = '';
  if (oStart < tokens.length) {
    o = tokens[oStart];
    // spicy food → food (head NP); those/this giữ nguyên; English every → English
    if (
      oStart + 1 < tokens.length
      && !/^(this|that|these|those|it|him|her|them|us)$/i.test(o)
      && !oSkip.has(tokens[oStart + 1].toLowerCase())
      && !isFiniteVerbToken(tokens[oStart + 1])
      && !ADV_RE.test(tokens[oStart + 1])
      && !/^(in|on|at|for|from|with|by|every|each|all|some|many|much)$/i.test(tokens[oStart + 1])
    ) {
      o = tokens[oStart + 1];
    }
  }

  s = s.replace(/[^A-Za-z'\-\s]/g, '').trim() || 'it';
  v = v.replace(/[^A-Za-z'\-\s]/g, '').trim() || 'is';
  o = o.replace(/[^A-Za-z'\-\s]/g, '').trim();
  const cap = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);
  const sHead = s.toLowerCase();
  const vHead = v.toLowerCase();
  const oHead = o.toLowerCase();

  const kernel: SentenceKernel = {
    text: [cap(sHead), vHead, oHead].filter(Boolean).join(' ') + '.',
    s: sHead,
    v: vHead,
    o: oHead || undefined,
    translation_vi: logic?.formula_vi || '—',
  };

  const segments: SentenceSegment[] = [];
  const sSpan = beforeV.join(' ') || sHead;
  if (sSpan) segments.push({ text: sSpan, role: 'S', label_vi: 'Chủ ngữ', keep: true });
  for (const rc of rcStripped) {
    if (rc) segments.push({ text: rc, role: 'clause', label_vi: 'Mệnh đề quan hệ (who/which)', keep: false });
  }
  segments.push({ text: vHead, role: 'V', label_vi: 'Động từ chính', keep: true });
  if (oHead) segments.push({ text: oHead, role: 'O', label_vi: 'Tân ngữ', keep: true });

  let tailStart = oStart + 1;
  if (o && tokens[oStart]?.toLowerCase() !== oHead && tokens[oStart + 1]?.toLowerCase() === oHead) {
    tailStart = oStart + 2;
  }
  const tail = tokens.slice(tailStart).join(' ');
  if (tail) {
    const isPp = /^(in|on|at|for|from|with|by|every|each)\b/i.test(tail);
    segments.push({
      text: tail,
      role: isPp ? 'pp' : 'adverb',
      label_vi: isPp ? 'PP / trạng ngữ' : 'Trạng ngữ',
      keep: false,
    });
  }

  const build_levels = logic
    ? [
        { level: 0, text: [sHead, vHead].filter(Boolean).join(' '), slot_vi: 'Xương (S + V)' },
        { level: 1, text: `less in ${logic.a} than in ${logic.b}`, slot_vi: logic.pattern },
        { level: 2, text: sentence, slot_vi: 'Câu đầy đủ' },
      ]
    : buildBuildLevelsFromKernel(kernel, sentence, segments);

  const chunkSeeds: Array<{ text: string; base: string; meaning_vi: string }> = [];
  const sWords = sSpan.split(/\s+/).filter((w) => w && !DET_STOP.has(w.toLowerCase()));
  if (sWords.length >= 2) {
    chunkSeeds.push({
      text: sWords.slice(-2).join(' '),
      base: sWords.slice(-2).join(' ').toLowerCase(),
      meaning_vi: '—',
    });
  }
  if (sHead) chunkSeeds.push({ text: sHead, base: sHead, meaning_vi: '—' });
  if (vHead) chunkSeeds.push({ text: vHead, base: vHead.split(/\s+/).slice(-1)[0], meaning_vi: '—' });
  if (oHead) chunkSeeds.push({ text: oHead, base: oHead, meaning_vi: '—' });

  const seen = new Set<string>();
  const chunks: SentenceChunk[] = [];
  for (const c of chunkSeeds) {
    const key = c.base.toLowerCase();
    if (seen.has(key) || key.length < 2) continue;
    seen.add(key);
    chunks.push(c);
    if (chunks.length >= 5) break;
  }

  return {
    sentence,
    translation_vi: logic?.formula_vi || `(Ước lượng xương) ${[sHead, vHead, oHead].filter(Boolean).join(' ')}`,
    structure: logic?.pattern || (oHead ? 'S + V + O' : 'S + V'),
    kernel,
    logic,
    segments,
    build_levels,
    chunks,
    notes: [
      frameOpeners.test(sentence)
        ? 'Đã bỏ frame mở câu khi ước lượng xương.'
        : 'Phân tích dự phòng — finite mệnh đề chính, bỏ who/which RC.',
      'Badge Ước lượng: nên kiểm tra lại S–V–O trước khi demo live.',
    ],
  };
}
