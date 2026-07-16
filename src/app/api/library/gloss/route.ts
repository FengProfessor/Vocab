/**
 * POST /api/library/gloss
 * Body: { words: string[] }
 * Trả map lemma → { pos, definition, example, ipa } từ global_dictionary (batch).
 * Dùng cho PDF chủ đề / unit — đủ nghĩa + dạng từ + phiên âm, không gọi AI.
 */
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, getClientIp } from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';

export interface WordGloss {
  pos: string;
  definition: string;
  example: string;
  /** IPA đã clean, không slash bọc ngoài (PDF tự thêm /…/) */
  ipa: string;
}

type Pron = { ipa?: string; text?: string; phonetic?: string; region?: string | null };

type GdRow = {
  word: string;
  data: {
    results?: {
      meanings?: {
        pos?: string;
        definition?: string;
        example?: string;
      }[];
      phonetic?: string;
      pronunciations?: Pron[];
    }[];
    pronunciations?: Pron[];
    phonetics?: Array<{ text?: string; ipa?: string }>;
    openVocab?: { ipaUs?: string; ipaUk?: string; ipa?: string; phonetic?: string };
    phonetic?: string;
  } | null;
};

/** Lấy IPA trực tiếp — không phụ thuộc whitelist chặt (tránh mất phiên âm trên PDF). */
function pickIpa(data: GdRow['data']): string {
  if (!data) return '';

  const clean = (raw: string | undefined | null): string => {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw.trim();
    if (!s || /^https?:/i.test(s) || s.includes('://') || s.includes('.com/')) return '';
    s = s.replace(/^\/+|\/+$/g, '').trim();
    s = s.replace(/^(US|UK|AmE|BrE|GA|RP)\s*[:：]?\s*/i, '').trim();
    s = s.replace(/^\/+|\/+$/g, '').trim();
    if (!s || s.length > 100) return '';
    return s;
  };

  const fromProns = (list: Pron[] | undefined): string => {
    if (!Array.isArray(list)) return '';
    for (const p of list) {
      const ipa = clean(p.ipa || p.text || p.phonetic);
      if (ipa) return ipa;
    }
    return '';
  };

  let ipa = fromProns(data.pronunciations);
  if (ipa) return ipa;

  ipa = clean(data.phonetic);
  if (ipa) return ipa;

  if (Array.isArray(data.phonetics)) {
    for (const p of data.phonetics) {
      ipa = clean(p?.text || p?.ipa);
      if (ipa) return ipa;
    }
  }

  const ov = data.openVocab;
  if (ov) {
    for (const key of ['ipaUs', 'ipa', 'ipaUk', 'phonetic'] as const) {
      ipa = clean(ov[key]);
      if (ipa) return ipa;
    }
  }

  for (const res of data.results ?? []) {
    ipa = clean(res.phonetic) || fromProns(res.pronunciations);
    if (ipa) return ipa;
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
    // Bắt buộc đăng nhập — chống dump global_dictionary ẩn danh
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const ip = getClientIp(req);
    const denied = await assertScrapeQuota(
      `library-gloss:${auth.userId}:${ip}`,
      QUOTA.contentList,
    );
    if (denied) return denied;

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
    // Cap 120 — đủ 1 unit PDF; chặn dump 800 từ/request
    if (words.length > 120) {
      return NextResponse.json(
        { success: false, error: 'Tối đa 120 từ / lần (chống cào dữ liệu)' },
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
