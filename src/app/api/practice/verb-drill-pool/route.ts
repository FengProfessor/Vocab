import { NextResponse } from 'next/server';
import {
  checkRateLimitAsync,
  getAuthUser,
  rateLimitUnavailableResponse,
  safeErrorResponse,
  tooManyRequests,
  unauthorized,
} from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import { sessionErrorResponse } from '@/lib/session-response';
import { createServiceClient } from '@/lib/supabase-server';
import {
  cleanBareIpaString,
  getLookupCandidateKeys,
  isPendingOrInvalidTranslation,
  resolveStaticVocabFallback,
  type GlobalDictRowInput,
} from '@/lib/vocab-entry-resolver';
import {
  getTeacherPresetIpa,
  resolveBestBareIpa,
  selectReliableQuizImageUrl,
  type VerbDrillPoolItem,
  type VerbDrillRawWord,
} from '@/lib/verb-drill-pool';

const MAX_POOL = 200;
const GD_CHUNK_SIZE = 200;
const MAX_FILL_BATCH = 15;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SINGLE_ENGLISH_WORD_RE = /^[a-zA-Z-]{2,32}$/;

const WORD_COLUMNS =
  'id, word, translation, pos, ipa, example, image_url, image_source, image_confidence';

async function resolveStudentClassroomIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<string[]> {
  const [{ data: personalClass }, { data: enrolledClasses }] = await Promise.all([
    supabase
      .from('classrooms')
      .select('id')
      .eq('teacher_id', userId)
      .eq('name', '__personal__')
      .maybeSingle(),
    supabase.from('enrollments').select('classroom_id').eq('student_id', userId),
  ]);

  const ids = new Set<string>();
  if (personalClass?.id) ids.add(String(personalClass.id));
  for (const e of enrolledClasses || []) {
    if (e.classroom_id) ids.add(String(e.classroom_id));
  }
  return Array.from(ids);
}

async function fetchWordsInClassrooms(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  classroomIds: string[],
): Promise<VerbDrillRawWord[]> {
  if (classroomIds.length === 0) return [];
  let query = supabase
    .from('words')
    .select(WORD_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(240);

  if (classroomIds.length === 1) {
    query = query.eq('classroom_id', classroomIds[0]);
  } else {
    query = query.in('classroom_id', classroomIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as VerbDrillRawWord[];
}

function dedupeRawWords(rows: VerbDrillRawWord[]): VerbDrillRawWord[] {
  const seen = new Set<string>();
  const out: VerbDrillRawWord[] = [];

  for (const w of rows) {
    const lemma = (w.word || '').trim();
    if (!lemma || lemma.length > 48) continue;
    const key = lemma.toLowerCase();
    if (seen.has(key)) continue;
    const vi = (w.translation || '').trim().replace(/\s+/g, ' ');
    if (isPendingOrInvalidTranslation(vi)) continue;
    seen.add(key);
    out.push({ ...w, word: lemma, translation: vi });
    if (out.length >= MAX_POOL) break;
  }

  return out;
}

/**
 * GET /api/practice/verb-drill-pool?classroomId=...
 * Single fast payload for Quick ABCD Quiz: loads up to 200 valid words in 1 query,
 * heals missing IPA from static/presets/global_dictionary, and filters slow/low-quality images.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const listDenied = await assertScrapeQuota(`verb-drill-pool:${auth.userId}`, QUOTA.wordsList);
    if (listDenied) return listDenied;

    const { searchParams } = new URL(req.url);
    const rawClassroomId = (searchParams.get('classroomId') || '').trim();
    const explicitClassId =
      rawClassroomId && rawClassroomId !== '__personal__' ? rawClassroomId : null;

    const supabase = createServiceClient();
    let targetClassroomIds: string[] = [];

    if (explicitClassId) {
      if (!UUID_PATTERN.test(explicitClassId)) {
        return NextResponse.json({ success: false, error: 'Invalid classroomId' }, { status: 400 });
      }
      const [{ data: cls }, { data: enrollment }] = await Promise.all([
        supabase.from('classrooms').select('teacher_id').eq('id', explicitClassId).maybeSingle(),
        supabase
          .from('enrollments')
          .select('id')
          .eq('classroom_id', explicitClassId)
          .eq('student_id', auth.userId)
          .maybeSingle(),
      ]);
      if (cls?.teacher_id !== auth.userId && !enrollment) {
        return unauthorized();
      }
      targetClassroomIds = [explicitClassId];
    } else {
      targetClassroomIds = await resolveStudentClassroomIds(supabase, auth.userId);
    }

    let rawRows = dedupeRawWords(await fetchWordsInClassrooms(supabase, targetClassroomIds));

    // Auto-expand to full user scope if a single classroom doesn't yet have 4 words for ABCD distractors
    if (explicitClassId && rawRows.length < 4) {
      const globalIds = await resolveStudentClassroomIds(supabase, auth.userId);
      const expanded = dedupeRawWords(await fetchWordsInClassrooms(supabase, globalIds));
      if (expanded.length > rawRows.length) {
        rawRows = expanded;
      }
    }

    // Identify rows needing IPA or image fallback from global_dictionary
    const needsLookupKeys = new Set<string>();
    for (const row of rawRows) {
      const hasStaticIpa =
        Boolean(cleanBareIpaString(row.ipa, row.word)) ||
        Boolean(cleanBareIpaString(resolveStaticVocabFallback(row.word)?.ipa, row.word)) ||
        Boolean(getTeacherPresetIpa(row.word));
      const hasReliableImg = Boolean(
        selectReliableQuizImageUrl({
          word: row.word,
          pos: row.pos,
          translation: row.translation,
          imageUrl: row.image_url,
          imageSource: row.image_source,
          imageConfidence: row.image_confidence,
        }),
      );
      if (!hasStaticIpa || !hasReliableImg) {
        for (const k of getLookupCandidateKeys(row.word)) {
          needsLookupKeys.add(k);
        }
      }
    }

    const gdMap = new Map<string, GlobalDictRowInput>();
    if (needsLookupKeys.size > 0) {
      const keys = Array.from(needsLookupKeys);
      const chunks: string[][] = [];
      for (let i = 0; i < keys.length; i += GD_CHUNK_SIZE) {
        chunks.push(keys.slice(i, i + GD_CHUNK_SIZE));
      }
      const results = await Promise.all(
        chunks.map((chunk) =>
          supabase
            .from('global_dictionary')
            .select('word, data, image_url, image_source, image_confidence')
            .in('word', chunk),
        ),
      );
      for (const res of results) {
        for (const row of (res.data || []) as GlobalDictRowInput[]) {
          if (row.word) {
            gdMap.set(row.word.toLowerCase().trim(), row);
          }
        }
      }
    }

    const items: VerbDrillPoolItem[] = rawRows.map((row) => {
      const ipa = resolveBestBareIpa(row.ipa, row.word, gdMap);
      let imageUrl = selectReliableQuizImageUrl({
        word: row.word,
        pos: row.pos,
        translation: row.translation,
        imageUrl: row.image_url,
        imageSource: row.image_source,
        imageConfidence: row.image_confidence,
      });

      if (!imageUrl) {
        for (const k of getLookupCandidateKeys(row.word)) {
          const gd = gdMap.get(k);
          if (!gd) continue;
          imageUrl = selectReliableQuizImageUrl({
            word: row.word,
            pos: row.pos,
            translation: row.translation,
            imageUrl: gd.image_url,
            imageSource: gd.image_source,
            imageConfidence: gd.image_confidence,
          });
          if (imageUrl) break;
        }
      }

      return {
        id: row.id,
        lemma: row.word,
        vi: row.translation || '',
        pos: (row.pos || '').trim(),
        ipa,
        example: (row.example || '').trim(),
        ...(imageUrl ? { imageUrl } : {}),
      };
    });

    return NextResponse.json(
      { success: true, items },
      { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' } },
    );
  } catch (err: unknown) {
    const sessionFailure = sessionErrorResponse(err);
    if (sessionFailure) return sessionFailure;
    return safeErrorResponse(err, 'Không tải được kho từ Quiz');
  }
}

async function fetchDictionaryApiIpa(word: string): Promise<string> {
  if (!SINGLE_ENGLISH_WORD_RE.test(word)) return '';
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (!res.ok) return '';
    const payload = (await res.json()) as Array<{
      phonetic?: string;
      phonetics?: Array<{ text?: string }>;
    }>;
    const entry = Array.isArray(payload) ? payload[0] : null;
    if (!entry) return '';
    const raw =
      entry.phonetics?.find((p) => p?.text && p.text.trim())?.text ||
      entry.phonetic ||
      '';
    return cleanBareIpaString(raw, word);
  } catch {
    return '';
  }
}

/**
 * POST /api/practice/verb-drill-pool
 * Background IPA enrichment for user's words still missing phonetic transcription.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const rl = await checkRateLimitAsync(`verb-drill-ipa:${auth.userId}`, 10, 60_000);
    if (!rl.allowed) return tooManyRequests();

    const body = (await req.json()) as { wordIds?: unknown };
    const rawIds = Array.isArray(body?.wordIds) ? body.wordIds : [];
    const wordIds = Array.from(
      new Set(
        rawIds.filter(
          (id): id is string => typeof id === 'string' && UUID_PATTERN.test(id),
        ),
      ),
    ).slice(0, MAX_FILL_BATCH);

    if (wordIds.length === 0) {
      return NextResponse.json({ success: true, updated: {} });
    }

    const supabase = createServiceClient();
    const [studentClassrooms, { data: ownedClasses }] = await Promise.all([
      resolveStudentClassroomIds(supabase, auth.userId),
      supabase.from('classrooms').select('id').eq('teacher_id', auth.userId),
    ]);
    const allowedSet = new Set<string>(studentClassrooms);
    for (const c of ownedClasses || []) {
      if (c.id) allowedSet.add(String(c.id));
    }
    const allowedClassrooms = Array.from(allowedSet);
    if (allowedClassrooms.length === 0) {
      return NextResponse.json({ success: true, updated: {} });
    }

    const { data: rows, error } = await supabase
      .from('words')
      .select('id, word, ipa, classroom_id')
      .in('id', wordIds)
      .in('classroom_id', allowedClassrooms);

    if (error) throw error;

    const candidates = (rows || []).filter(
      (r: { id: string; word: string; ipa: string | null }) =>
        !cleanBareIpaString(r.ipa, r.word) && SINGLE_ENGLISH_WORD_RE.test(r.word.trim()),
    );

    const updated: Record<string, string> = {};
    const lookups = await Promise.all(
      candidates.map(async (r: { id: string; word: string }) => {
        const ipa = await fetchDictionaryApiIpa(r.word.trim());
        return { id: r.id, ipa };
      }),
    );

    const toPersist = lookups.filter((item) => item.ipa.length > 0);
    if (toPersist.length > 0) {
      await Promise.all(
        toPersist.map((item) =>
          supabase
            .from('words')
            .update({ ipa: `/${item.ipa}/` })
            .eq('id', item.id),
        ),
      );
      for (const item of toPersist) {
        updated[item.id] = item.ipa;
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (err: unknown) {
    const sessionFailure = sessionErrorResponse(err);
    if (sessionFailure) return sessionFailure;
    const unavailable = rateLimitUnavailableResponse(err);
    if (unavailable) return unavailable;
    return safeErrorResponse(err, 'Không thể bổ sung phiên âm');
  }
}
