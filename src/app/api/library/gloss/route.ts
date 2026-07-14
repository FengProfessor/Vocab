/**
 * POST /api/library/gloss
 * Body: { words: string[] }
 * Trả map lemma → { pos, definition, example, ipa } từ global_dictionary (batch).
 * Dùng cho PDF chủ đề / unit — đủ nghĩa + dạng từ + phiên âm, không gọi AI.
 */
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { extractIpaFromDictionaryData } from '@/lib/ipa-resolve';

export interface WordGloss {
  pos: string;
  definition: string;
  example: string;
  /** IPA đã clean, không slash bọc ngoài (PDF tự thêm /…/) */
  ipa: string;
}

type GdRow = {
  word: string;
  data: {
    results?: {
      meanings?: {
        pos?: string;
        definition?: string;
        example?: string;
      }[];
    }[];
    pronunciations?: { ipa?: string; region?: string | null }[];
    openVocab?: { ipaUs?: string; ipaUk?: string; ipa?: string };
    phonetic?: string;
  } | null;
};

function pickIpa(data: GdRow['data']): string {
  if (!data) return '';
  const fromExtract = extractIpaFromDictionaryData(data, 'US');
  if (fromExtract) return fromExtract;
  const ov = data.openVocab;
  const candidates = [ov?.ipaUs, ov?.ipa, ov?.ipaUk].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );
  for (const c of candidates) {
    const s = c.trim().replace(/^\/+|\/+$/g, '').trim();
    if (s) return s;
  }
  return '';
}

function pickGloss(row: GdRow): WordGloss {
  const m = row.data?.results?.[0]?.meanings?.[0];
  return {
    pos: (m?.pos ?? '').trim(),
    definition: (m?.definition ?? '').trim(),
    example: (m?.example ?? '').trim(),
    ipa: pickIpa(row.data),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { words?: unknown };
    if (!Array.isArray(body.words)) {
      return NextResponse.json({ success: false, error: 'words[] required' }, { status: 400 });
    }

    const words = [
      ...new Set(
        body.words
          .filter((w): w is string => typeof w === 'string')
          .map((w) => w.trim().toLowerCase())
          .filter((w) => w.length > 0 && w.length < 80),
      ),
    ];

    if (words.length === 0) {
      return NextResponse.json({ success: true, glosses: {} as Record<string, WordGloss> });
    }
    if (words.length > 800) {
      return NextResponse.json(
        { success: false, error: 'Tối đa 800 từ / lần xuất PDF' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const glosses: Record<string, WordGloss> = {};
    const CHUNK = 200;

    for (let i = 0; i < words.length; i += CHUNK) {
      const slice = words.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from('global_dictionary')
        .select('word, data')
        .in('word', slice);
      if (error) throw error;
      for (const row of (data ?? []) as GdRow[]) {
        const key = String(row.word).toLowerCase();
        glosses[key] = pickGloss(row);
      }
    }

    // Lemma không có trong GD → slot rỗng (PDF vẫn in được)
    for (const w of words) {
      if (!glosses[w]) glosses[w] = { pos: '', definition: '', example: '', ipa: '' };
    }

    const withDef = Object.values(glosses).filter((g) => g.definition).length;
    const withIpa = Object.values(glosses).filter((g) => g.ipa).length;
    return NextResponse.json({
      success: true,
      glosses,
      stats: { requested: words.length, withDefinition: withDef, withIpa },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[library/gloss]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
