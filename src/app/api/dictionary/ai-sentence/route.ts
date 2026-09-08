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
import {
  SentenceChunk,
  SentenceKernel,
  SentenceSegment,
  SentenceBuildLevel,
  SentenceLogic,
  SentenceSpan,
  MainClauseAnalysis,
  SecondaryClause,
  SentenceAnalysisData,
  SpanRole,
} from '@/types/sentence-analysis';
import {
  GdData,
  looksVietnamese,
  looksEnglishHead,
  extractNounPhraseHead,
  alignSpansWithSentence,
  buildSpansFromClauses,
  enrichChunksWithDbMeanings,
  advancedHeuristicAnalysis,
  detectVerbTense,
  getVerbBase,
} from '@/lib/sentence-parser-utils';
import { geminiGenerate, hasGeminiKeys } from '@/lib/gemini-multi';

export const maxDuration = 30;

export type {
  SentenceChunk,
  SentenceKernel,
  SentenceSegment,
  SentenceBuildLevel,
  SentenceLogic,
  SentenceSpan,
  MainClauseAnalysis,
  SecondaryClause,
  SentenceAnalysisData,
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

// looksVietnamese & looksEnglishHead imported from @/lib/sentence-parser-utils

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

function normalizeMainClause(raw: unknown, sentence: string): MainClauseAnalysis | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const sObj = typeof o.subject === 'object' && o.subject !== null ? (o.subject as Record<string, unknown>) : null;
  const vObj = typeof o.verb === 'object' && o.verb !== null ? (o.verb as Record<string, unknown>) : null;
  const oObj = typeof o.object === 'object' && o.object !== null ? (o.object as Record<string, unknown>) : null;

  const sText = sObj && typeof sObj.text === 'string' ? sObj.text.trim() : (typeof o.subject === 'string' ? o.subject.trim() : '');
  const sHead = sObj && typeof sObj.head === 'string' ? sObj.head.trim() : sText;

  const vText = vObj && typeof vObj.text === 'string' ? vObj.text.trim() : (typeof o.verb === 'string' ? o.verb.trim() : '');
  const vHead = vObj && typeof vObj.head === 'string' ? vObj.head.trim() : vText;
  const vTense = vObj && typeof vObj.tense === 'string' ? vObj.tense.trim() : undefined;

  const oText = oObj && typeof oObj.text === 'string' ? oObj.text.trim() : (typeof o.object === 'string' ? o.object.trim() : '');
  const oHead = oObj && typeof oObj.head === 'string' ? oObj.head.trim() : (oText ? extractNounPhraseHead(oText) : '');

  const translation_vi = typeof o.translation_vi === 'string' ? o.translation_vi.trim() : '';

  if (!sText || !vText) return undefined;

  return {
    subject: { text: sText, head: sHead || sText },
    verb: { text: vText, head: vHead || vText, tense: vTense },
    object: oText ? { text: oText, head: oHead || oText } : undefined,
    translation_vi,
  };
}

function normalizeSecondaryClauses(raw: unknown): SecondaryClause[] {
  if (!Array.isArray(raw)) return [];
  const validTypes = new Set([
    'participle_result',
    'relative_clause',
    'adverbial_clause',
    'prepositional_phrase',
    'coordinate_clause',
    'other',
  ]);

  const list: SecondaryClause[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const text = typeof o.text === 'string' ? o.text.trim() : '';
    if (!text) continue;
    const rawType = typeof o.type === 'string' ? o.type.trim() : 'other';
    const type = (validTypes.has(rawType) ? rawType : 'other') as SecondaryClause['type'];
    const type_label_vi =
      typeof o.type_label_vi === 'string' && o.type_label_vi.trim()
        ? o.type_label_vi.trim()
        : type === 'participle_result'
          ? 'Mệnh đề phân từ chỉ kết quả'
          : type === 'relative_clause'
            ? 'Mệnh đề quan hệ'
            : type === 'adverbial_clause'
              ? 'Mệnh đề trạng ngữ'
              : 'Mệnh đề phụ / Bổ ngữ';

    list.push({
      type,
      type_label_vi,
      text,
      linker: typeof o.linker === 'string' ? o.linker.trim() : undefined,
      action: typeof o.action === 'string' ? o.action.trim() : undefined,
      target: typeof o.target === 'string' ? o.target.trim() : undefined,
      translation_vi: typeof o.translation_vi === 'string' ? o.translation_vi.trim() : '',
    });
  }
  return list;
}

function normalizeSpans(
  raw: unknown,
  sentence: string,
  mainClause?: MainClauseAnalysis,
  secondaryClauses?: SecondaryClause[],
): SentenceSpan[] {
  const validRoles = new Set(['S', 'V', 'O', 'clause', 'adverb', 'pp', 'linker', 'other']);
  const spans: SentenceSpan[] = [];

  if (Array.isArray(raw) && raw.length > 0) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const text = typeof o.text === 'string' ? o.text.trim() : '';
      if (!text) continue;
      const roleRaw = typeof o.role === 'string' ? o.role.trim() : 'other';
      const role = (validRoles.has(roleRaw) ? roleRaw : 'other') as SpanRole;
      const label_vi = typeof o.label_vi === 'string' ? o.label_vi.trim() : role;
      spans.push({ text, role, label_vi });
    }
  }

  if (spans.length === 0 && mainClause) {
    return buildSpansFromClauses(sentence, mainClause, secondaryClauses || []);
  }

  return alignSpansWithSentence(spans, sentence);
}

async function enrichChunksFromDb(chunks: SentenceChunk[]): Promise<SentenceChunk[]> {
  if (chunks.length === 0) return chunks;
  const supabase = createServiceClient();
  const bases = [...new Set(chunks.map((c) => c.base.toLowerCase()).filter(Boolean))].slice(0, 15);

  const { data: rows } = await supabase
    .from('global_dictionary')
    .select('word, data')
    .in('word', bases);

  const map = new Map<string, GdData>();
  for (const row of rows || []) {
    if (row?.word) map.set(String(row.word).toLowerCase(), (row.data ?? null) as GdData);
  }

  return enrichChunksWithDbMeanings(chunks, map);
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
      const sSeg = golden.segments?.find((s) => s.role === 'S');
      const vSeg = golden.segments?.find((s) => s.role === 'V');
      const oSeg = golden.segments?.find((s) => s.role === 'O');

      const vText = vSeg?.text || golden.kernel.v;
      const vHead = golden.kernel.v;

      const main_clause: MainClauseAnalysis = {
        subject: { text: sSeg?.text || golden.kernel.s, head: golden.kernel.s },
        verb: { text: vText, head: getVerbBase(vHead) || vHead, tense: detectVerbTense(vText) },
        object: golden.kernel.o ? { text: oSeg?.text || golden.kernel.o, head: golden.kernel.o } : undefined,
        translation_vi: golden.kernel.translation_vi || golden.translation_vi,
      };

      const secondary_clauses: SecondaryClause[] = (golden.segments || [])
        .filter((s) => s.role === 'clause')
        .map((s) => ({
          type: 'relative_clause',
          type_label_vi: s.label_vi,
          text: s.text,
          translation_vi: s.label_vi,
        }));

      const rawSpans: SentenceSpan[] = (golden.segments || []).map((s) => ({
        text: s.text,
        role: (s.role === 'modifier' ? 'pp' : s.role) as SpanRole,
        label_vi: s.label_vi,
      }));
      const spans = alignSpansWithSentence(rawSpans, golden.sentence);

      const data: SentenceAnalysisData = {
        sentence: golden.sentence,
        translation_vi: golden.translation_vi,
        structure: golden.structure,
        kernel: golden.kernel,
        main_clause,
        secondary_clauses,
        spans,
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

    // Prompt phân tầng câu (Main Clause vs Secondary Clause/Participle) & Span Segmentation
    const prompt = `English sentence syntactic decomposition and semantic parsing for Vietnamese learners.
SENTENCE: "${sentence}"
${context ? `CONTEXT: "${context}"` : ''}

You must return ONLY a single valid JSON object with:
1. "translation_vi": natural full Vietnamese translation of the entire sentence.
2. "structure": high-level sentence pattern (e.g. "S + V + O · Mệnh đề phân từ chỉ kết quả").
3. "main_clause":
   - "subject": { "text": "full English subject phrase", "head": "core English head noun (1-3 words)" }
   - "verb": { "text": "English main verb or predicate phrase", "head": "base verb", "tense": "e.g. Past simple, Present simple" }
   - "object": { "text": "full English object phrase (e.g. the flow of water from the Atlantic into the Strait of Gibraltar)", "head": "core English noun phrase (e.g. the flow of water)" }
   - "translation_vi": "Vietnamese translation of the main clause"
4. "secondary_clauses": list of subordinate/participial clauses, modifiers, or PP:
   - "type": "participle_result" | "relative_clause" | "adverbial_clause" | "prepositional_phrase" | "coordinate_clause"
   - "type_label_vi": Vietnamese label (e.g. "Mệnh đề phân từ chỉ kết quả", "Mệnh đề quan hệ", "Mệnh đề trạng ngữ")
   - "text": exact clause text in the sentence
   - "linker": connective/conjunction if any (e.g. "thereby", "who", "which", "although")
   - "action": verb-ing or verb in this clause (e.g. "significantly reducing")
   - "target": object/complement of this clause (e.g. "the amount of water received by the Mediterranean")
   - "translation_vi": Vietnamese translation of this clause
5. "spans": list of non-overlapping spans covering 100% of the sentence sequentially:
   - "text": exact text slice from the sentence
   - "role": "S" | "V" | "O" | "clause" | "adverb" | "pp" | "linker" | "other"
   - "label_vi": Vietnamese label (e.g. "Chủ ngữ [S]", "Vị ngữ [V]", "Tân ngữ [O]", "Mệnh đề phân từ")
6. "kernel": { "text": "English kernel 3-8 words.", "s": "English subject head", "v": "English main verb", "o": "English object head or empty", "translation_vi": "Vietnamese gist" }
7. "chunks": 4-8 collocations/vocabulary chunks:
   - "text": phrase as seen in sentence (e.g. "stemmed")
   - "base": dictionary lemma (e.g. "stem")
   - "pos": accurate part of speech in THIS sentence context (e.g. "Động từ (Verb)", "Cụm danh từ")
   - "meaning_vi": contextual Vietnamese meaning (e.g. for "stemmed": "ngăn chặn, kìm hãm dòng chảy", NEVER "thân cây")
8. "build_levels": [
   { "level": 0, "text": "English kernel words only", "slot_vi": "Xương S–V–O" },
   { "level": 1, "text": "English expanded with modifiers", "slot_vi": "+ bổ ngữ" },
   { "level": 2, "text": "Full sentence", "slot_vi": "Câu đầy đủ" }
]
9. "notes": ["optional grammar tips in Vietnamese"]

CRITICAL RESTRICTIONS:
- English fields: main_clause.subject.text, main_clause.verb.text, main_clause.object.text, kernel.* (except translation_vi), spans[].text, chunks[].text, chunks[].base MUST BE IN ENGLISH taken from the sentence.
- Vietnamese fields: translation_vi, main_clause.translation_vi, secondary_clauses[].type_label_vi, secondary_clauses[].translation_vi, spans[].label_vi, chunks[].meaning_vi, notes MUST BE IN VIETNAMESE.
- Never confuse a participle clause (e.g. ", thereby reducing...") as main verb. The main verb is the finite verb of the main clause.
- Return JSON only. No markdown fences.`;

    type AiSentenceJson = {
      translation_vi?: string;
      structure?: string;
      main_clause?: unknown;
      secondary_clauses?: unknown[];
      spans?: unknown[];
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
        try {
          text = (await router.generate(prompt, 'normal', true)).trim();
        } catch (secondErr) {
          if (hasGeminiKeys()) {
            console.warn('[ai-sentence] Groq/Zhipu normal failed, trying Gemini fallback:', secondErr);
            text = (await geminiGenerate(prompt, { json: true })).trim();
          } else {
            throw secondErr;
          }
        }
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
      console.warn('[ai-sentence] AI failed, advanced heuristic fallback:', aiErr);
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
        .slice(0, 10);

      try {
        chunks = await enrichChunksFromDb(chunks);
      } catch (dbErr) {
        console.warn('[ai-sentence] DB enrich skipped:', dbErr);
      }

      let notes = Array.isArray(aiJson.notes)
        ? aiJson.notes.filter((n): n is string => typeof n === 'string').slice(0, 3)
        : [];

      let main_clause = normalizeMainClause(aiJson.main_clause, sentence);
      const secondary_clauses = normalizeSecondaryClauses(aiJson.secondary_clauses);
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

      // If AI didn't return main_clause, build from kernel if valid
      if (!main_clause && kernel) {
        main_clause = {
          subject: { text: kernel.s, head: kernel.s },
          verb: { text: kernel.v, head: kernel.v },
          object: kernel.o ? { text: kernel.o, head: kernel.o } : undefined,
          translation_vi: kernel.translation_vi,
        };
      }

      // If kernel missing, build from main_clause
      if (!kernel && main_clause) {
        const kText = `${main_clause.subject.head} ${main_clause.verb.head || main_clause.verb.text} ${main_clause.object?.head || ''}.`.trim();
        kernel = {
          text: kText,
          s: main_clause.subject.head,
          v: main_clause.verb.head || main_clause.verb.text,
          o: main_clause.object?.head,
          translation_vi: main_clause.translation_vi || (aiJson.translation_vi || ''),
        };
      }

      // If both kernel & main_clause missing or corrupted -> heuristic fallback
      let usedHeuristicBones = false;
      if (!kernel || !main_clause) {
        const fallback = advancedHeuristicAnalysis(sentence);
        kernel = fallback.kernel;
        main_clause = fallback.main_clause;
        usedHeuristicBones = true;
        aiSource = 'heuristic';
        if (!build_levels.length) build_levels = fallback.build_levels || [];
        if (!segments.length && fallback.segments) segments.push(...fallback.segments);
        if (!chunks.length) chunks = fallback.chunks;
        if (!notes.length && fallback.notes) notes.push(...fallback.notes);
      }

      // Spans normalization covering 100% of sentence
      const spans = normalizeSpans(aiJson.spans, sentence, main_clause, secondary_clauses);

      if (logic && build_levels.length < 3 && kernel) {
        build_levels = [
          { level: 0, text: kernel.text.replace(/\.$/, ''), slot_vi: 'Xương S–V–O' },
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
      if (!structure && secondary_clauses.length > 0) {
        structure = `S + V + O · ${secondary_clauses[0].type_label_vi}`;
      }
      if (!structure) structure = kernel?.o ? 'S + V + O' : 'S + V';

      if (kernel && logic && (kernel.translation_vi === '—' || kernel.translation_vi.length < 12)) {
        kernel = { ...kernel, translation_vi: logic.formula_vi };
      }

      let translation_vi = (aiJson.translation_vi || '').trim();
      if (!translation_vi || translation_vi === '—' || /^xương\s*:/i.test(translation_vi)) {
        translation_vi =
          main_clause?.translation_vi
          || (kernel?.translation_vi && kernel.translation_vi !== '—' && !/^xương\s*:/i.test(kernel.translation_vi)
            ? kernel.translation_vi
            : null)
          || logic?.formula_vi
          || '';
      }
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
        main_clause,
        secondary_clauses,
        spans,
        logic,
        segments: segments.length ? segments : undefined,
        build_levels,
        chunks,
        notes: notes.length ? notes : undefined,
      };
    } else {
      data = advancedHeuristicAnalysis(sentence);
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

function heuristicAnalysis(sentence: string): SentenceAnalysisData {
  return advancedHeuristicAnalysis(sentence);
}

