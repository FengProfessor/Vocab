import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getClientIp } from '@/lib/api-security';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import { getInMemWordList, fuzzySuggestFromRAM } from '@/lib/dict-trie-engine';
import {
  getCollocationVocabEntry,
  getWordFamilyCluster,
  type CollocationVocabEntry,
} from '@/lib/toeic-collocation-index';
import { getDerivationalStems } from '@/lib/dict-cache';
import { resolveProxyMediaUrl } from '@/lib/toeic-media-proxy';
import {
  buildExternalLookupPayload,
  fetchExternalDict,
  upsertExternalToGlobalDict,
} from '@/lib/external-dict';
import { translateWithDetails } from '@/lib/api/translation';
import {
  cleanBareIpaString,
  extractCleanBareIpa,
  getLookupCandidateKeys,
  resolveStaticVocabFallback,
  resolveVocabPartialFromSources,
  type GlobalDictRowInput,
} from '@/lib/vocab-entry-resolver';
import type { WordFamilyEntry, DictionaryMeaning, CoreSenseEntry } from '@/lib/supabase';

type CachedPayload = {
  status: number;
  body: Record<string, unknown>;
};

interface LookupGlobalDictRow {
  word?: string;
  data?: Record<string, unknown> | null;
  tags?: string[] | null;
  image_url?: string | null;
  image_source?: string | null;
}

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

function resolveNullableMediaUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return resolveProxyMediaUrl(trimmed);
}

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

function collectRamFamilyWords(
  word: string,
  baseFamily: WordFamilyEntry[],
  parentWord?: string,
): WordFamilyEntry[] {
  const map = new Map<string, WordFamilyEntry>();
  const headLower = word.trim().toLowerCase();

  for (const f of baseFamily) {
    if (f.word) map.set(f.word.toLowerCase().trim(), f);
  }

  const cluster = getWordFamilyCluster(word);
  if (cluster && cluster.length > 0) {
    for (const f of cluster) {
      if (f.word && !map.has(f.word.toLowerCase().trim())) {
        map.set(f.word.toLowerCase().trim(), f);
      }
    }
  }

  if (parentWord) {
    const parentCluster = getWordFamilyCluster(parentWord);
    if (parentCluster) {
      for (const f of parentCluster) {
        if (f.word && !map.has(f.word.toLowerCase().trim())) {
          map.set(f.word.toLowerCase().trim(), f);
        }
      }
    }
  }

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

  return Array.from(map.values());
}

async function enrichFamilyWords(
  word: string,
  baseFamily: WordFamilyEntry[],
  morphology?: unknown,
  supabase?: ReturnType<typeof createServiceClient> | null,
  prefetchedStemRows?: Array<{ word: string; data?: Record<string, unknown> | null }>,
): Promise<WordFamilyEntry[]> {
  const map = new Map<string, WordFamilyEntry>();
  const headLower = word.trim().toLowerCase();

  for (const f of collectRamFamilyWords(word, baseFamily)) {
    if (f.word) map.set(f.word.toLowerCase().trim(), f);
  }

  const nonSelf = Array.from(map.values()).filter((f) => f.word.toLowerCase().trim() !== headLower);
  if (nonSelf.length >= 2) {
    return Array.from(map.values());
  }

  // 2. Try morphology root word in RAM first
  const morph =
    morphology && typeof morphology === 'object'
      ? (morphology as { rootWord?: unknown; rootMeaning?: unknown })
      : null;
  const root = typeof morph?.rootWord === 'string' ? morph.rootWord.trim().toLowerCase() : undefined;
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
  }

  // 3. Single concurrent/combined DB check if still < 2 non-self family words
  const candidateStems = getDerivationalStems(word)
    .filter((s) => s !== headLower && s.length >= 3)
    .slice(0, 5);
  const currentNonSelf = Array.from(map.values()).filter((f) => f.word.toLowerCase().trim() !== headLower);

  let stemRowsToApply = prefetchedStemRows;
  if (!stemRowsToApply && currentNonSelf.length < 2 && supabase) {
    const dbKeys = Array.from(
      new Set([
        ...(root && root !== headLower && root.length >= 3 ? [root] : []),
        ...candidateStems,
      ]),
    );
    if (dbKeys.length > 0) {
      try {
        const { data: stemRows } = await supabase
          .from('global_dictionary')
          .select('word, data')
          .in('word', dbKeys);
        stemRowsToApply = (stemRows || []) as Array<{ word: string; data?: Record<string, unknown> | null }>;
      } catch {
        // ignore db error
      }
    }
  }

  for (const r of stemRowsToApply || []) {
    const rData = r.data as
      | {
          familyWords?: unknown;
          definition?: string;
          pos?: string;
          results?: Array<{ meanings?: Array<{ definition?: string; pos?: string }> }>;
        }
      | undefined;
    const stemFam = parseRawFamilyWords(rData?.familyWords);
    for (const f of stemFam) {
      if (f.word && !map.has(f.word.toLowerCase().trim())) {
        map.set(f.word.toLowerCase().trim(), f);
      }
    }
    const rKey = r.word.toLowerCase().trim();
    if (rKey !== headLower && !map.has(rKey)) {
      const def = rData?.results?.[0]?.meanings?.[0]?.definition || rData?.definition;
      map.set(rKey, {
        word: r.word,
        pos: rData?.results?.[0]?.meanings?.[0]?.pos || rData?.pos || 'từ gốc',
        meaning: def || undefined,
      });
    }
  }

  if (root && root !== headLower && root.length >= 3 && !map.has(root)) {
    const rootMeaning =
      typeof morph?.rootMeaning === 'string' && morph.rootMeaning.trim()
        ? morph.rootMeaning
        : undefined;
    map.set(root, { word: root, pos: 'gốc từ', meaning: rootMeaning });
  }

  return Array.from(map.values());
}

function buildToeicCollocationPayload(
  matchedKey: string,
  toeicEntry: CollocationVocabEntry,
  familyWords: WordFamilyEntry[],
  extraRow?: {
    data?: Record<string, unknown> | null;
    tags?: string[] | null;
    image_url?: string | null;
    image_source?: string | null;
  } | null,
): Record<string, unknown> {
  const extraData = (extraRow?.data || null) as Record<string, unknown> | null;
  const extraTags = extraRow?.tags || [];
  const extraImageUrl = extraRow?.image_url || null;
  const extraImageSource = extraRow?.image_source || 'none';

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

  const resolvedToeicImageUrl = resolveNullableMediaUrl(extraImageUrl || toeicEntry.imageUrl);
  const resolvedToeicAudioUs = resolveNullableMediaUrl(toeicEntry.audioUs || extraData?.audio_us);
  const resolvedToeicAudioUk = resolveNullableMediaUrl(toeicEntry.audioUk || extraData?.audio_uk);
  const resolvedToeicPhrases = (toeicEntry.phrases || []).map((p) => ({
    ...p,
    ...(p.imageUrl ? { imageUrl: resolveProxyMediaUrl(p.imageUrl) } : {}),
  }));

  return {
    success: true,
    source: 'toeic_collocation_index',
    word: toeicEntry.word,
    cleanWord: toeicEntry.cleanWord || matchedKey,
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
    image_url: resolvedToeicImageUrl,
    imageUrl: resolvedToeicImageUrl,
    image_source: extraImageSource,
    audio_us: resolvedToeicAudioUs,
    audioUs: resolvedToeicAudioUs,
    audio_uk: resolvedToeicAudioUk,
    audioUk: resolvedToeicAudioUk,
    phrases: resolvedToeicPhrases,
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
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawWord = (searchParams.get('word') || '').trim().toLowerCase();

  if (!rawWord) {
    return NextResponse.json({ success: false, error: 'word is required' }, { status: 400 });
  }
  if (rawWord.length > 100) {
    return NextResponse.json(
      { success: false, error: 'word must not exceed 100 characters' },
      { status: 400 },
    );
  }
  if (/[\x00-\x1f\x7f]/.test(rawWord)) {
    return NextResponse.json(
      { success: false, error: 'word contains invalid control characters' },
      { status: 400 },
    );
  }

  const word = rawWord.replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (!word || !/[a-z0-9]/i.test(word)) {
    return NextResponse.json(
      { success: false, error: 'Not found' },
      { status: 404, headers: { 'X-Lookup-Cache': 'MISS' } },
    );
  }

  const fallbackMode = searchParams.get('fallback');
  const fallbackExternal = fallbackMode === 'external';
  const fallbackTranslate = fallbackMode === 'translate';

  const ip = getClientIp(req);
  const denied = await assertScrapeQuota(`dict-lookup:${ip}`, QUOTA.dictLookup);
  if (denied) return denied;

  const cacheKey = `dict-lookup:${word}`;
  const cached200 = cacheGet<CachedPayload>(cacheKey);
  if (cached200) {
    return NextResponse.json(cached200.body, {
      status: cached200.status,
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT' },
    });
  }

  if (fallbackTranslate) {
    const cachedTr = cacheGet<CachedPayload>(`dict-lookup:tr:${word}`);
    if (cachedTr) {
      return NextResponse.json(cachedTr.body, {
        status: cachedTr.status,
        headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT' },
      });
    }
  }

  const negCacheKey = fallbackExternal
    ? `dict-lookup:ext404:${word}`
    : fallbackTranslate
      ? `dict-lookup:tr404:${word}`
      : `dict-lookup:404:${word}`;
  const cached404 = cacheGet<CachedPayload>(negCacheKey);
  if (cached404) {
    return NextResponse.json(cached404.body, {
      status: 404,
      headers: { 'X-Lookup-Cache': 'HIT' },
    });
  }

  const structuralKeys = getLookupCandidateKeys(word);
  const structuralSet = new Set(structuralKeys);
  const allCandidateKeys = getLookupCandidateKeys(word, { includeInflections: true });
  const inflectionalKeys = allCandidateKeys.filter((k) => !structuralSet.has(k));

  // ── 0. High-Performance TOEIC Collocation & Vocabulary Static Index (0ms RAM lookup) ──
  let matchedToeicKey = '';
  let toeicEntry: CollocationVocabEntry | null = null;
  for (const k of structuralKeys) {
    const hit = getCollocationVocabEntry(k);
    if (hit) {
      matchedToeicKey = k;
      toeicEntry = hit;
      break;
    }
  }

  if (toeicEntry) {
    const baseFamily = parseRawFamilyWords(toeicEntry.wordFamily);
    const ramFamily = collectRamFamilyWords(matchedToeicKey, baseFamily, toeicEntry.parentWord);
    const isPhrase = matchedToeicKey.includes(' ');
    const hasCore = Boolean(
      toeicEntry.definition?.trim() &&
        toeicEntry.pos?.trim() &&
        (isPhrase || (toeicEntry.ipa?.trim() && toeicEntry.example?.trim())),
    );
    const hasImage = Boolean(toeicEntry.imageUrl) || isPhrase;
    const ramNonSelfCount = ramFamily.filter((f) => f.word.toLowerCase().trim() !== matchedToeicKey).length;
    const isCompleteInRam = hasCore && hasImage && (isPhrase || ramNonSelfCount >= 2);

    if (isCompleteInRam) {
      const body = buildToeicCollocationPayload(matchedToeicKey, toeicEntry, ramFamily);
      cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);
      if (matchedToeicKey !== word) {
        cacheSet(`dict-lookup:${matchedToeicKey}`, { status: 200, body }, CACHE_TTL_MS);
      }
      return NextResponse.json(body, {
        headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT-TOEIC-COLLOCATION' },
      });
    }

    let supabaseClient: ReturnType<typeof createServiceClient> | null = null;
    try {
      supabaseClient = createServiceClient();
    } catch {
      // Offline/test/network fallback
    }

    let gdRow: LookupGlobalDictRow | null = null;
    let prefetchedStemRows: Array<{ word: string; data?: Record<string, unknown> | null }> = [];

    if (supabaseClient) {
      const candidateStems = getDerivationalStems(matchedToeicKey)
        .filter((s) => s !== matchedToeicKey && s.length >= 3)
        .slice(0, 5);
      try {
        const [gdRes, stemRes] = await Promise.all([
          supabaseClient
            .from('global_dictionary')
            .select('word, data, tags, image_url, image_source')
            .eq('word', matchedToeicKey)
            .maybeSingle(),
          ramNonSelfCount < 2 && candidateStems.length > 0
            ? supabaseClient
                .from('global_dictionary')
                .select('word, data')
                .in('word', candidateStems)
            : Promise.resolve({ data: [] as Array<{ word: string; data?: Record<string, unknown> | null }> }),
        ]);
        if (gdRes.data?.data) {
          gdRow = gdRes.data as LookupGlobalDictRow;
        }
        if (Array.isArray(stemRes.data)) {
          prefetchedStemRows = stemRes.data as typeof prefetchedStemRows;
        }
      } catch {
        // Offline/test/network fallback
      }
    }

    const extraData = gdRow?.data || null;
    const combinedBaseFamily = [
      ...parseRawFamilyWords(extraData?.familyWords || extraData?.wordFamily || extraData?.word_family),
      ...baseFamily,
    ];
    let familyWords = ramFamily;
    try {
      familyWords = await enrichFamilyWords(
        matchedToeicKey,
        combinedBaseFamily,
        extraData?.morphology,
        supabaseClient,
        prefetchedStemRows,
      );
    } catch {
      // fallback
    }

    const body = buildToeicCollocationPayload(matchedToeicKey, toeicEntry, familyWords, gdRow);
    cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);
    if (matchedToeicKey !== word) {
      cacheSet(`dict-lookup:${matchedToeicKey}`, { status: 200, body }, CACHE_TTL_MS);
    }
    return NextResponse.json(body, {
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT-TOEIC-COLLOCATION' },
    });
  }

  try {
    let supabase: ReturnType<typeof createServiceClient> | null = null;
    try {
      supabase = createServiceClient();
    } catch {
      supabase = null;
    }

    let resolvedRow: LookupGlobalDictRow | null = null;
    let matchedDbKey = '';

    if (supabase && allCandidateKeys.length > 0) {
      const { data: gdRows, error } = await supabase
        .from('global_dictionary')
        .select('word, data, tags, image_url, image_source')
        .in('word', allCandidateKeys);

      if (error) throw error;

      if (gdRows && gdRows.length > 0) {
        const altMap = new Map(
          gdRows
            .filter((r) => Boolean(r && r.data))
            .map((r) => [(r.word as string).toLowerCase().trim(), r]),
        );
        for (const key of allCandidateKeys) {
          const match = altMap.get(key);
          if (match) {
            resolvedRow = match as LookupGlobalDictRow;
            matchedDbKey = key;
            break;
          }
        }
      }
    }

    // Inflectional upgrade to TOEIC collocation index (0 extra DB round-trips)
    // Only triggers if global_dictionary did not hit an exact/structural headword
    if ((!resolvedRow || !structuralSet.has(matchedDbKey)) && inflectionalKeys.length > 0) {
      for (const ik of inflectionalKeys) {
        const inflectedToeic = getCollocationVocabEntry(ik);
        if (inflectedToeic) {
          const matchingExtraRow =
            resolvedRow && matchedDbKey === ik ? resolvedRow : null;
          const extraData = matchingExtraRow?.data || null;
          const combinedBaseFamily = [
            ...parseRawFamilyWords(extraData?.familyWords || extraData?.wordFamily || extraData?.word_family),
            ...parseRawFamilyWords(inflectedToeic.wordFamily),
          ];
          const familyWords = await enrichFamilyWords(
            ik,
            combinedBaseFamily,
            extraData?.morphology,
            supabase,
          ).catch(() => collectRamFamilyWords(ik, combinedBaseFamily, inflectedToeic.parentWord));

          const body = buildToeicCollocationPayload(ik, inflectedToeic, familyWords, matchingExtraRow);
          cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);
          cacheSet(`dict-lookup:${ik}`, { status: 200, body }, CACHE_TTL_MS);
          return NextResponse.json(body, {
            headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT-TOEIC-COLLOCATION' },
          });
        }
      }
    }

    if (!resolvedRow || !resolvedRow.data) {
      const staticFallback = resolveStaticVocabFallback(word, { includeInflections: true });
      if (staticFallback?.translation) {
        const matchedStaticKey =
          allCandidateKeys.find((k) => Boolean(resolveStaticVocabFallback(k)?.translation)) || word;
        const pronunciations = parsePronunciations(staticFallback.ipa);
        const familyWords = await enrichFamilyWords(matchedStaticKey, [], undefined, supabase);
        const body: Record<string, unknown> = {
          success: true,
          source: 'static_curriculum_fallback',
          word: matchedStaticKey,
          cleanWord: matchedStaticKey,
          ipa: staticFallback.ipa || '',
          pronunciations,
          pos: staticFallback.pos || '',
          definition: staticFallback.translation,
          example: staticFallback.example || undefined,
          example_vi: staticFallback.example_vi || undefined,
          exampleVi: staticFallback.example_vi || undefined,
          synonyms: staticFallback.synonyms || [],
          antonyms: staticFallback.antonyms || [],
          image_url: staticFallback.image_url || null,
          image_source: staticFallback.image_source || 'none',
          results: [
            {
              pronunciations,
              meanings: [
                {
                  pos: staticFallback.pos || '',
                  definition: staticFallback.translation,
                  example: staticFallback.example || undefined,
                  example_vi: staticFallback.example_vi || undefined,
                  isPrimary: true,
                  popularity: 1,
                },
              ],
            },
          ],
          meanings: [
            {
              meaning: staticFallback.translation,
              part_of_speech: staticFallback.pos || '',
              example: staticFallback.example || '',
              example_vi: staticFallback.example_vi || '',
            },
          ],
          familyWords,
          wordFamily: familyWords,
          word_family: familyWords,
        };
        cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);
        if (matchedStaticKey !== word) {
          cacheSet(`dict-lookup:${matchedStaticKey}`, { status: 200, body }, CACHE_TTL_MS);
        }
        return NextResponse.json(body, {
          headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'HIT-STATIC-FALLBACK' },
        });
      }

      // ── Optional Server-Side External Fallback (?fallback=external, single words only) ──
      if (fallbackExternal && !word.includes(' ')) {
        const extDenied = await assertScrapeQuota(`ext:${ip}`, QUOTA.dictExternal);
        if (extDenied) return extDenied;

        let resolvedLemma = word;
        let extData = await fetchExternalDict(word, 2500);

        if (!extData && inflectionalKeys.length > 0) {
          const singleLemmas = inflectionalKeys.filter((k) => !k.includes(' ')).slice(0, 3);
          if (singleLemmas.length > 0) {
            const settled = await Promise.allSettled(
              singleLemmas.map((k) => fetchExternalDict(k, 2000)),
            );
            for (let i = 0; i < settled.length; i++) {
              const r = settled[i];
              if (r.status === 'fulfilled' && r.value) {
                resolvedLemma = singleLemmas[i];
                extData = r.value;
                break;
              }
            }
          }
        }

        if (extData) {
          upsertExternalToGlobalDict(resolvedLemma, extData);
          const body = buildExternalLookupPayload(resolvedLemma, word, extData);
          cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);
          if (resolvedLemma !== word) {
            cacheSet(`dict-lookup:${resolvedLemma}`, { status: 200, body }, CACHE_TTL_MS);
          }
          return NextResponse.json(body, {
            headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'MISS-EXTERNAL' },
          });
        }
      }

      // ── Optional Server-Side Translate Fallback (?fallback=translate, multi-word phrases only) ──
      if (fallbackTranslate && word.includes(' ')) {
        try {
          const trRes = await translateWithDetails(word, {
            sourceLang: 'en',
            targetLang: 'vi',
            timeoutMs: 2500,
          });
          if (trRes?.translatedText?.trim()) {
            const translatedText = trRes.translatedText.trim();
            const body: Record<string, unknown> = {
              success: true,
              source: 'translate',
              word,
              cleanWord: word,
              pos: 'cụm từ',
              translation: translatedText,
              translatedText,
            };
            cacheSet(`dict-lookup:tr:${word}`, { status: 200, body }, CACHE_TTL_MS);
            return NextResponse.json(body, {
              headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'MISS-TRANSLATE' },
            });
          }
        } catch {
          // Graceful fallthrough to 404
        }
      }

      // Tìm kiếm gợi ý sửa lỗi gõ sai chính tả từ 40,860 từ trong RAM
      await getInMemWordList(250);
      const fuzzyMatches = fuzzySuggestFromRAM(word, 2, 4);
      const didYouMean = fuzzyMatches.map((m) => m.word);

      const body: Record<string, unknown> = {
        success: false,
        error: 'Not found',
        ...(didYouMean.length > 0 ? { didYouMean } : {}),
      };
      // 404 cache ngắn hơn — tách key theo chế độ fallback để không poison ?fallback=external
      cacheSet(negCacheKey, { status: 404, body }, 15_000);
      return NextResponse.json(body, {
        status: 404,
        headers: { 'X-Lookup-Cache': 'MISS' },
      });
    }

    const headword = ((resolvedRow.word as string) || word).trim();
    const headLower = headword.toLowerCase();
    const raw = (resolvedRow.data || {}) as Record<string, unknown>;
    const cleaned = sanitizeSynAntPayload(headword, raw);

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

    const gdEntries: Array<[string, GlobalDictRowInput]> = [
      [headLower, resolvedRow as GlobalDictRowInput],
    ];
    if (headLower !== word) {
      gdEntries.push([word, resolvedRow as GlobalDictRowInput]);
    }
    const gdMap = new Map<string, GlobalDictRowInput>(gdEntries);
    const extractedIpa = extractCleanBareIpa(raw, headword);
    const needsFallback =
      meanings.length === 0 ||
      !extractedIpa ||
      !(typeof cleaned.definition === 'string' && cleaned.definition.trim());
    const fallback = needsFallback
      ? resolveVocabPartialFromSources(word, gdMap, { includeInflections: true })
      : {};

    if (meanings.length === 0 && fallback.translation) {
      meanings.push({
        pos: fallback.pos || '',
        definition: fallback.translation,
        example: fallback.example || undefined,
        example_vi: fallback.example_vi || undefined,
        isPrimary: true,
        popularity: 1,
      });
    }

    const validBareIpa = extractedIpa || fallback.ipa || '';
    const formattedValidIpa = validBareIpa ? `/${validBareIpa.replace(/^\/+|\/+$/g, '')}/` : '';

    const rawProns = Array.isArray(cleaned.pronunciations)
      ? (cleaned.pronunciations as Array<Record<string, unknown>>)
      : [];
    const mappedProns: Array<Record<string, unknown>> = [];
    for (const p of rawProns) {
      const rawIpa = typeof p?.ipa === 'string' ? p.ipa : '';
      const cleanedPiece = cleanBareIpaString(rawIpa, headword);
      const nextIpa = cleanedPiece ? `/${cleanedPiece}/` : formattedValidIpa;
      const hasAudio = Boolean(p?.audio_uk || p?.audio_us);
      if (!nextIpa && !hasAudio) continue;
      mappedProns.push({
        ...p,
        ipa: nextIpa,
      });
    }
    const sanitizedProns =
      mappedProns.length > 0
        ? mappedProns
        : formattedValidIpa
          ? parsePronunciations(formattedValidIpa)
          : [];

    const resolvedPos =
      (typeof cleaned.pos === 'string' && cleaned.pos.trim()) ||
      meanings[0]?.pos ||
      fallback.pos ||
      '';
    const resolvedDef =
      (typeof cleaned.definition === 'string' && cleaned.definition.trim()) ||
      meanings[0]?.definition ||
      fallback.translation ||
      '';
    const resolvedMeaning =
      (typeof cleaned.meaning === 'string' && cleaned.meaning.trim()) ||
      resolvedDef;
    const resolvedExample =
      (typeof cleaned.example === 'string' && cleaned.example.trim()) ||
      meanings[0]?.example ||
      fallback.example ||
      undefined;
    const resolvedExampleVi =
      (typeof cleaned.example_vi === 'string' && cleaned.example_vi.trim()) ||
      (typeof cleaned.exampleVi === 'string' && cleaned.exampleVi.trim()) ||
      meanings[0]?.example_vi ||
      fallback.example_vi ||
      undefined;

    const baseFamily = parseRawFamilyWords(raw.familyWords || raw.wordFamily || raw.word_family);
    const familyWords = await enrichFamilyWords(headword, baseFamily, raw.morphology, supabase);

    const resolvedGlobalImageUrl = resolveNullableMediaUrl(
      resolvedRow.image_url || cleaned.image_url || cleaned.imageUrl,
    );
    const resolvedGlobalAudioUs = resolveNullableMediaUrl(
      cleaned.audio_us || cleaned.audioUs || cleaned.audio_url || cleaned.audioUrl,
    );
    const resolvedGlobalAudioUk = resolveNullableMediaUrl(cleaned.audio_uk || cleaned.audioUk);

    const body: Record<string, unknown> = {
      success: true,
      source: 'global_dictionary',
      tags: resolvedRow.tags || [],
      ...cleaned,
      word: headword,
      cleanWord: headLower,
      image_url: resolvedGlobalImageUrl,
      ...(resolvedGlobalImageUrl ? { imageUrl: resolvedGlobalImageUrl } : {}),
      ...(resolvedGlobalAudioUs ? { audio_us: resolvedGlobalAudioUs, audioUs: resolvedGlobalAudioUs } : {}),
      ...(resolvedGlobalAudioUk ? { audio_uk: resolvedGlobalAudioUk, audioUk: resolvedGlobalAudioUk } : {}),
      image_source: resolvedRow.image_source || 'none',
      ipa: formattedValidIpa,
      pos: resolvedPos,
      definition: resolvedDef,
      meaning: resolvedMeaning,
      ...(resolvedExample ? { example: resolvedExample } : {}),
      ...(resolvedExampleVi ? { example_vi: resolvedExampleVi, exampleVi: resolvedExampleVi } : {}),
      pronunciations: sanitizedProns,
      core_senses: coreSenses.length > 0 ? coreSenses : raw.core_senses,
      results: [
        {
          ...(sanitizedProns.length > 0 ? { pronunciations: sanitizedProns } : {}),
          meanings,
        },
      ],
      familyWords,
      wordFamily: familyWords,
      word_family: familyWords,
    };
    cacheSet(cacheKey, { status: 200, body }, CACHE_TTL_MS);
    if (headLower !== word) {
      cacheSet(`dict-lookup:${headLower}`, { status: 200, body }, CACHE_TTL_MS);
    }

    return NextResponse.json(body, {
      headers: { ...CACHE_HEADERS, 'X-Lookup-Cache': 'MISS' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Dictionary Lookup] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
