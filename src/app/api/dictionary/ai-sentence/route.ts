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

export interface SentenceAnalysisData {
  sentence: string;
  translation_vi: string;
  structure?: string;
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

/** Zhipu Flash primary → Groq fallback qua getRouter() */
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
 * Tra cả câu/cụm (Pro): dịch VI + chunk học được.
 * AI: ưu tiên Groq free; nghĩa chunk backfill từ global_dictionary khi có.
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

    const prompt = `You are a bilingual English→Vietnamese tutor for Vietnamese learners.
Analyze this English sentence/phrase for LEARNING (not just raw MT).

SENTENCE: "${sentence}"
${context ? `CONTEXT: "${context}"` : ''}

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "translation_vi": "Natural fluent Vietnamese translation of the whole sentence",
  "structure": "Very short pattern e.g. S + V + O + particle (optional, max 12 words)",
  "chunks": [
    {
      "text": "surface form as in sentence",
      "base": "dictionary base form",
      "meaning_vi": "short Vietnamese gloss for THIS context",
      "pos": "optional POS in Vietnamese e.g. Cụm động từ"
    }
  ],
  "notes": ["optional 0-2 short learning tips in Vietnamese"]
}

RULES:
1. translation_vi must be natural Vietnamese (not word-by-word).
2. chunks: 2-6 items ONLY — phrasal verbs, idioms, collocations, hard words. Skip stopwords (the, a, is, to, of...).
3. base MUST keep full multi-word expressions: "put off" not "put"; "take into account" not "take"; "next week" ok as time phrase.
4. meaning_vi: short (2-8 Vietnamese words), context-aware.
5. Prefer chunks learners should SAVE to SRS.
6. No IPA. No markdown fences. JSON only.`;

    // Groq: smart → llama-3.3-70b (free, ~0.4s); fallback fast 8b nếu fail
    const router = getSentenceRouter();
    let text: string;
    try {
      text = (await router.generate(prompt, 'smart', true)).trim();
    } catch (firstErr) {
      console.warn('[ai-sentence] smart tier failed, retry fast:', firstErr);
      text = (await router.generate(prompt, 'fast', true)).trim();
    }

    if (text.startsWith('```json')) text = text.replace(/```json/g, '');
    if (text.startsWith('```')) text = text.replace(/```/g, '');
    text = text.trim();

    let parsed: {
      translation_vi?: string;
      structure?: string;
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

    // Backfill nghĩa từ DB khi có (không chặn nếu DB chậm)
    try {
      chunks = await enrichChunksFromDb(chunks);
    } catch (dbErr) {
      console.warn('[ai-sentence] DB enrich skipped:', dbErr);
    }

    const notes = Array.isArray(parsed.notes)
      ? parsed.notes.filter((n): n is string => typeof n === 'string').slice(0, 3)
      : [];

    const data: SentenceAnalysisData = {
      sentence,
      translation_vi: (parsed.translation_vi || '').trim() || '—',
      structure: typeof parsed.structure === 'string' ? parsed.structure.trim() : undefined,
      chunks,
      notes: notes.length ? notes : undefined,
    };

    // Shape tương thích popup từ điển (Desktop / extension cũ)
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
              example: sentence,
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
