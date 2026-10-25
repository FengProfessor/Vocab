import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getClientIp } from '@/lib/api-security';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import { getInMemWordList, fuzzySuggestFromRAM } from '@/lib/dict-trie-engine';
import { getCollocationVocabEntry, getWordFamilyCluster } from '@/lib/toeic-collocation-index';
import { getDerivationalStems } from '@/lib/dict-cache';
import type { WordFamilyEntry, DictionaryMeaning, CoreSenseEntry } from '@/lib/supabase';

type CachedPayload = {
  status: number;
  body: Record<string, unknown>;
};

const CACHE_TTL_MS = 24 * 3600 * 1000; // 24 giờ lưu RAM
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
} as const;

/** Cặp vai trò hay bị gán nhầm "trái nghĩa" (teach↔learn ≠ hot↔cold). */
const ROLE_CONVERSE: Record<string, string[]> = {
  teach: ['learn', 'study', 'learning'],
  teaches: ['learn', 'study', 'learning'],
  teaching: ['learn', 'study', 'learning'],
  learn: ['teach', 'teaching'],
  learning: ['teach', 'teaching'],
  study: ['teach', 'teaching'],
  buy: ['sell'],
  sell: ['buy'],
  lend: ['borrow'],
  borrow: ['lend'],
  give: ['take', 'receive'],
  take: ['give'],
  win: ['lose'],
  lose: ['win'],
};

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

/** Bỏ ant trùng syn + cặp converse + biến thể lemma. */
function sanitizeSynAntPayload(
  lemma: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const w = lemma.toLowerCase();
  const variants = new Set<string>([w]);
  if (w.endsWith('s') && w.length > 3) variants.add(w.slice(0, -1));
  else variants.add(`${w}s`);
  if (w.endsWith('ing') && w.length > 4) variants.add(w.slice(0, -3));
  if (w.endsWith('ed') && w.length > 3) variants.add(w.slice(0, -2));

  const blockAnt = new Set((ROLE_CONVERSE[w] || []).map((x) => x.toLowerCase()));
  for (const v of variants) {
    for (const x of ROLE_CONVERSE[v] || []) blockAnt.add(x.toLowerCase());
  }

  const clean = (list: string[], kind: 'syn' | 'ant'): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of list) {
      const item = raw.trim().toLowerCase();
      if (!item || !/^[a-z][a-z'-]{1,24}$/.test(item)) continue;
      if (variants.has(item) || seen.has(item)) continue;
      if (kind === 'ant' && blockAnt.has(item)) continue;
      seen.add(item);
      out.push(item);
      if (out.length >= 8) break;
    }
    return out;
  };

  const synonyms = clean(asStringList(payload.synonyms), 'syn');
  let antonyms = clean(asStringList(payload.antonyms), 'ant');
  const synSet = new Set(synonyms);
  antonyms = antonyms.filter((a) => !synSet.has(a));

  return {
    ...payload,
    ...(synonyms.length ? { synonyms } : { synonyms: [] }),
    ...(antonyms.length ? { antonyms } : { antonyms: [] }),
  };
}

function parseRawFamilyWords(raw: unknown): WordFamilyEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: WordFamilyEntry[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const m = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/);
      if (m) {
        entries.push({ word: m[1].trim(), pos: m[2].trim(), meaning: m[3]?.trim() || undefined });
      } else {
        const simple = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
        entries.push(simple ? { word: simple[1].trim(), pos: simple[2].trim() } : { word: trimmed });
      }
    } else if (item && typeof item === 'object' && (item as WordFamilyEntry).word) {
      entries.push({ ...(item as WordFamilyEntry) });
    }
  }
  return entries;
}

function parsePronunciations(ipa?: string): Array<{ ipa: string; region?: 'UK' | 'US' | null }> {
  if (!ipa) return [];
  const prons: Array<{ ipa: string; region?: 'UK' | 'US' | null }> = [];
  const ukMatch = ipa.match(/UK:\s*([^|]+)/i);
  const usMatch = ipa.match(/US:\s*(.+)$/i);
  if (ukMatch || usMatch) {
    if (ukMatch) prons.push({ ipa: ukMatch[1].trim(), region: 'UK' });
    if (usMatch) prons.push({ ipa: usMatch[1].trim(), region: 'US' });
  } else {
    prons.push({ ipa: ipa.trim(), region: 'US' });
  }
  return prons;
}

const CEFR_RANK: Record<string, number> = {
  a1: 1,
  a2: 2,
  b1: 3,
  b2: 4,
  c1: 5,
  c2: 6,
};

function scoreMeaningPopularity(m: DictionaryMeaning): number {
  if (m.isPrimary) return 0;
  if (typeof m.popularity === 'number') return m.popularity;
  if (m.cefr) {
    const r = CEFR_RANK[m.cefr.toLowerCase().trim()];
    if (r) return 10 + r;
  }
  const def = (m.definition || '').toLowerCase();
  // Penalize obscure/archaic/cross-reference definitions
  if (def.startsWith('xem ') || def.startsWith('dạng ') || def.includes('(cũ)') || def.includes('(hiếm)')) {
    return 999;
  }
  return 100;
}

function buildOrderedMeanings(
  coreSensesRaw: unknown,
  existingResultsRaw: unknown,
  fallbackMeaning?: { pos?: string; definition?: string; example?: string; exampleVi?: string; toeicTip?: string },
): { meanings: DictionaryMeaning[]; coreSenses: CoreSenseEntry[] } {
  const coreSenses: CoreSenseEntry[] = Array.isArray(coreSensesRaw)
    ? [...(coreSensesRaw as CoreSenseEntry[])].sort((a, b) => (a.popularity || 99) - (b.popularity || 99))
    : [];

  const meanings: DictionaryMeaning[] = [];

  // 1. Oxford/Cambridge curated core senses take top priority (popularity 1, 2, 3...)
  if (coreSenses.length > 0) {
    for (let i = 0; i < coreSenses.length; i++) {
      const cs = coreSenses[i];
      meanings.push({
        pos: cs.pos || '',
        definition: cs.definition_vi || cs.label_vi || '',
        label_vi: cs.label_vi,
        definition_en: cs.definition_en,
        example: cs.example,
        example_vi: cs.example_vi,
        cefr: cs.cefr,
        popularity: cs.popularity || i + 1,
        isPrimary: i === 0 || cs.popularity === 1,
        collocations: cs.collocations,
      });
    }
  }

  // 2. If no curated core senses, the curated TOEIC definition is elevated as the primary meaning!
  if (meanings.length === 0 && fallbackMeaning?.definition) {
    meanings.push({
      pos: fallbackMeaning.pos || '',
      definition: fallbackMeaning.definition,
      example: fallbackMeaning.example,
      example_vi: fallbackMeaning.exampleVi,
      toeic_tip: fallbackMeaning.toeicTip,
      isPrimary: true,
      popularity: 1,
    });
  }

  // 3. Include existing results meanings if they add distinct definitions
  const existingMeanings: DictionaryMeaning[] = [];
  if (Array.isArray(existingResultsRaw)) {
    for (const r of existingResultsRaw as Array<{ meanings?: DictionaryMeaning[] }>) {
      for (const m of r.meanings || []) {
        if (!m.definition) continue;
        const isDuplicate = meanings.some(
          (existing) =>
            existing.definition?.toLowerCase().trim() === m.definition?.toLowerCase().trim() ||
            (existing.label_vi && m.definition?.toLowerCase().includes(existing.label_vi.toLowerCase())),
        );
        if (!isDuplicate && !existingMeanings.some((em) => em.definition?.toLowerCase().trim() === m.definition?.toLowerCase().trim())) {
          existingMeanings.push({ ...m });
        }
      }
    }
  }

  // Sort existing uncurated meanings by popularity / CEFR
  existingMeanings.sort((a, b) => scoreMeaningPopularity(a) - scoreMeaningPopularity(b));

  for (const m of existingMeanings) {
    meanings.push({
      ...m,
      isPrimary: meanings.length === 0,
    });
  }

  // Ensure exactly the top/first meaning is designated primary
  if (meanings.length > 0) {
    let hasPrimary = false;
    for (let i = 0; i < meanings.length; i++) {
      if (i === 0) {
        meanings[0].isPrimary = true;
        hasPrimary = true;
      } else if (meanings[i].isPrimary && hasPrimary) {
        meanings[i].isPrimary = false;
      }
    }
  }

  return { meanings, coreSenses };
}

async function enrichFamilyWords(
  word: string,
  baseFamily: WordFamilyEntry[],
  morphology?: any,
  supabase?: any,
): Promise<WordFamilyEntry[]> {
  const map = new Map<string, WordFamilyEntry>();
  const headLower = word.trim().toLowerCase();

  for (const f of baseFamily) {
    if (f.word) map.set(f.word.toLowerCase().trim(), f);
  }

  // 1. Instant 0ms bidirectional family cluster lookup (covers ~5,000 common words)
  const cluster = getWordFamilyCluster(word);
  if (cluster && cluster.length > 0) {
    for (const f of cluster) {
      if (f.word && !map.has(f.word.toLowerCase().trim())) {
        map.set(f.word.toLowerCase().trim(), f);
      }
    }
  }

  const nonSelf = Array.from(map.values()).filter((f) => f.word.toLowerCase().trim() !== headLower);
  if (nonSelf.length >= 2) {
    return Array.from(map.values());
  }

  // 2. Try morphology root word
  const root = morphology?.rootWord?.trim()?.toLowerCase();
  if (root && root !== headLower && root.length >= 3) {
    const rootCluster = getWordFamilyCluster(root);
    if (rootCluster) {
      for (const f of rootCluster) {
        if (f.word && !map.has(f.word.toLowerCase().trim())) {
          map.set(f.word.toLowerCase().trim(), f);
        }
      }
    }

    const rootToeic = getCollocationVocabEntry(root);
    if (rootToeic?.wordFamily) {
      for (const f of parseRawFamilyWords(rootToeic.wordFamily)) {
        if (f.word && !map.has(f.word.toLowerCase().trim())) {
          map.set(f.word.toLowerCase().trim(), f);
        }
      }
    }
    if (supabase) {
      try {
        const { data: rootDb } = await supabase
          .from('global_dictionary')
          .select('data')
          .eq('word', root)
          .maybeSingle();
        if (rootDb?.data?.familyWords) {
          for (const f of parseRawFamilyWords(rootDb.data.familyWords)) {
            if (f.word && !map.has(f.word.toLowerCase().trim())) {
              map.set(f.word.toLowerCase().trim(), f);
            }
          }
        }
      } catch {
        // ignore db error
      }
    }
    if (!map.has(root)) {
      map.set(root, { word: root, pos: 'gốc từ', meaning: morphology?.rootMeaning || undefined });
    }
  }

  // 3. Try derivational stems with bidirectional clusters
  const candidateStems = getDerivationalStems(word).filter((s) => s !== headLower && s.length >= 3);
  for (const stem of candidateStems.slice(0, 5)) {
    const stemCluster = getWordFamilyCluster(stem);
    if (stemCluster) {
      for (const f of stemCluster) {
        if (f.word && !map.has(f.word.toLowerCase().trim())) {
          map.set(f.word.toLowerCase().trim(), f);
        }
      }
    }
    const stemToeic = getCollocationVocabEntry(stem);
    if (stemToeic?.wordFamily) {
      for (const f of parseRawFamilyWords(stemToeic.wordFamily)) {
        if (f.word && !map.has(f.word.toLowerCase().trim())) {
          map.set(f.word.toLowerCase().trim(), f);
        }
      }
    }
  }

  const remainingNonSelf = Array.from(map.values()).filter((f) => f.word.toLowerCase().trim() !== headLower);
  if (remainingNonSelf.length < 2 && candidateStems.length > 0 && supabase) {
    try {
      const { data: stemRows } = await supabase
        .from('global_dictionary')
        .select('word, data')
        .in('word', candidateStems.slice(0, 5));

      for (const r of stemRows || []) {
        const stemFam = parseRawFamilyWords(r.data?.familyWords);
        for (const f of stemFam) {
          if (f.word && !map.has(f.word.toLowerCase().trim())) {
            map.set(f.word.toLowerCase().trim(), f);
          }
        }
        if (!map.has(r.word.toLowerCase().trim())) {
          const def = r.data?.results?.[0]?.meanings?.[0]?.definition || r.data?.definition;
          map.set(r.word.toLowerCase().trim(), {
            word: r.word,
            pos: r.data?.results?.[0]?.meanings?.[0]?.pos || r.data?.pos || 'từ gốc',
            meaning: def || undefined,
          });
        }
      }
    } catch {
      // ignore db error
    }
  }

  return Array.from(map.values());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const word = (searchParams.get('word') || '').trim().toLowerCase();

  if (!word) {
    return NextResponse.json({ success: false, error: 'word is required' }, { status: 400 });
  }
  if (word.length > 100) {
    return NextResponse.json(
      { success: false, error: 'word must not exceed 100 characters' },
      { status: 400 },
    );
  }

  const ip = getClientIp(req);
  const denied = await assertScrapeQuota(`dict-lookup:${ip}`, QUOTA.dictLookup);
  if (denied) return denied;

  const cacheKey = `dict-lookup:${word}`;
  const cached = cacheGet<CachedPayload>(cacheKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT' },
    });
  }

  // ── 0. High-Performance TOEIC Collocation & Vocabulary Static Index (0ms RAM lookup) ──
  const toeicEntry = getCollocationVocabEntry(word);
  if (toeicEntry) {
    let extraData: Record<string, unknown> | null = null;
    let extraTags: string[] = [];
    let extraImageUrl: string | null = null;
    let extraImageSource = 'none';

    let supabaseClient: any = null;
    try {
      supabaseClient = createServiceClient();
    } catch {
      // Offline/test/network fallback
    }

    if (supabaseClient) {
      try {
        const { data: gdRow } = await supabaseClient
          .from('global_dictionary')
          .select('word, data, tags, image_url, image_source')
          .eq('word', word)
          .maybeSingle();
        if (gdRow?.data) {
          extraData = gdRow.data as Record<string, unknown>;
          extraTags = gdRow.tags || [];
          extraImageUrl = gdRow.image_url || null;
          extraImageSource = gdRow.image_source || 'none';
        }
      } catch {
        // Offline/test/network fallback
      }
    }

    const { meanings, coreSenses } = buildOrderedMeanings(
      extraData?.core_senses,
      extraData?.results,
      {
        pos: toeicEntry.pos,
        definition: toeicEntry.definition,
        example: toeicEntry.example,
        exampleVi: toeicEntry.exampleVi,
        toeicTip: toeicEntry.toeicTip,
      },
    );

    const baseFamily = [
      ...parseRawFamilyWords(extraData?.familyWords || extraData?.wordFamily || extraData?.word_family),
      ...parseRawFamilyWords(toeicEntry.wordFamily),
    ];
    let familyWords = baseFamily;
    try {
      familyWords = await enrichFamilyWords(word, baseFamily, extraData?.morphology, supabaseClient);
    } catch {
      // fallback
    }

    const rawPhrases = toeicEntry.phrases || [];
    const extraColls = Array.isArray(extraData?.collocations) ? extraData.collocations : [];
    const collocations = [
      ...rawPhrases.map((p) => ({
        phrase: p.phrase,
        meaning_vi: p.meaning,
        imageUrl: p.imageUrl,
      })),
      ...extraColls,
    ];

    const extraProns = extraData?.pronunciations as Array<{ ipa: string; region?: 'UK' | 'US' | null }> | undefined;
    const pronunciations = extraProns?.length
      ? extraProns
      : parsePronunciations(toeicEntry.ipa);

    const body: Record<string, unknown> = {
      success: true,
      source: 'toeic_collocation_index',
      word: toeicEntry.word,
      cleanWord: toeicEntry.cleanWord || word,
      ipa: toeicEntry.ipa || (pronunciations[0] ? pronunciations[0].ipa : ''),
      pos: toeicEntry.pos || meanings[0]?.pos || '',
      definition: toeicEntry.definition || meanings[0]?.definition || '',
      example: toeicEntry.example || meanings[0]?.example || undefined,
      example_vi: toeicEntry.exampleVi || meanings[0]?.example_vi || undefined,
      exampleVi: toeicEntry.exampleVi || meanings[0]?.example_vi || undefined,
      toeic_tip: toeicEntry.toeicTip || undefined,
      toeicTip: toeicEntry.toeicTip || undefined,
      word_family: toeicEntry.wordFamily || [],
      wordFamily: toeicEntry.wordFamily || [],
      familyWords,
      synonyms: toeicEntry.synonyms?.length ? toeicEntry.synonyms : asStringList(extraData?.synonyms),
      antonyms: toeicEntry.antonyms?.length ? toeicEntry.antonyms : asStringList(extraData?.antonyms),
      image_url: extraImageUrl || toeicEntry.imageUrl || null,
      imageUrl: extraImageUrl || toeicEntry.imageUrl || null,
      image_source: extraImageSource,
      audio_us: toeicEntry.audioUs || extraData?.audio_us || null,
      audioUs: toeicEntry.audioUs || extraData?.audio_us || null,
      audio_uk: toeicEntry.audioUk || extraData?.audio_uk || null,
      audioUk: toeicEntry.audioUk || extraData?.audio_uk || null,
      phrases: toeicEntry.phrases || [],
      collocations,
      pronunciations,
      core_senses: coreSenses.length > 0 ? coreSenses : undefined,
      morphology: extraData?.morphology || undefined,
      results: [
        {
          meanings,
        },
      ],
      meanings: meanings.map((m) => ({
        meaning: m.definition || '',
        part_of_speech: m.pos || '',
        example: m.example || '',
        example_vi: m.example_vi || '',
        toeic_tip: m.toeic_tip || '',
        word_family: toeicEntry.wordFamily || [],
        antonyms: toeicEntry.antonyms || [],
      })),
      tags: extraTags,
    };
    cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);
    return NextResponse.json(body, {
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT-TOEIC-COLLOCATION' },
    });
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, data, tags, image_url, image_source')
      .eq('word', word)
      .maybeSingle();

    if (error) throw error;

    if (!data || !data.data) {
      // Tìm kiếm gợi ý sửa lỗi gõ sai chính tả từ 40,860 từ trong RAM
      await getInMemWordList(250);
      const fuzzyMatches = fuzzySuggestFromRAM(word, 2, 4);
      const didYouMean = fuzzyMatches.map((m) => m.word);

      const body: Record<string, unknown> = {
        success: false,
        error: 'Not found',
        ...(didYouMean.length > 0 ? { didYouMean } : {}),
      };
      // 404 cache ngắn hơn — từ mới backfill có thể xuất hiện
      cacheSet(cacheKey, { status: 404, body }, 15_000);
      return NextResponse.json(body, {
        status: 404,
        headers: { 'X-Lookup-Cache': 'MISS' },
      });
    }

    const raw = (data.data || {}) as Record<string, unknown>;
    const cleaned = sanitizeSynAntPayload(word, raw);

    const { meanings, coreSenses } = buildOrderedMeanings(
      raw.core_senses,
      raw.results,
      {
        pos: raw.pos as string,
        definition: (raw.definition || raw.meaning) as string,
        example: raw.example as string,
        exampleVi: (raw.example_vi || raw.exampleVi) as string,
      },
    );

    const baseFamily = parseRawFamilyWords(raw.familyWords || raw.wordFamily || raw.word_family);
    const familyWords = await enrichFamilyWords(word, baseFamily, raw.morphology, supabase);

    const body: Record<string, unknown> = {
      success: true,
      source: 'global_dictionary',
      tags: data.tags || [],
      image_url: data.image_url || null,
      image_source: data.image_source || 'none',
      ...cleaned,
      core_senses: coreSenses.length > 0 ? coreSenses : raw.core_senses,
      results: [
        {
          meanings,
        },
      ],
      familyWords,
      wordFamily: familyWords,
      word_family: familyWords,
    };
    cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);

    return NextResponse.json(body, {
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'MISS' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Dictionary Lookup] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
