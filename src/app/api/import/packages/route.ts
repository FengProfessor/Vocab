import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { CATALOG_VERSION, MICRO_PACK_SIZE, getCatalogTree, resolvePack } from '@/lib/vocab-catalog';
import pro3mData from '@/data/vocab/pro3m.json';
import pro3mPlusData from '@/data/vocab/pro3m-plus.json';

// Shape JSONB của global_dictionary.data
type GdMeaning = { pos?: string; definition?: string; example?: string; synonyms?: string[]; antonyms?: string[] };
type GdData = { pronunciations?: { ipa?: string }[]; results?: { meanings?: GdMeaning[] }[] };

const MAX_PACKAGE_IMPORT = 20;

// ── Back-compat: data thô cho body cũ {package, lessonName, packIndex} (tab chưa reload) ──
type LessonInfo = { words?: string[] };
type VocabJson = Record<string, LessonInfo>;
const LEGACY_PACKAGES: Record<'pro3m' | 'pro3m-plus', VocabJson> = {
  'pro3m': pro3mData as unknown as VocabJson,
  'pro3m-plus': pro3mPlusData as unknown as VocabJson,
};
function legacyCleanWords(words: string[]): string[] {
  return [...new Set(words.map((w) => w.trim().toLowerCase()).filter((w) => w.length > 1 && w.length < 80))];
}
function legacyMicroPacks(words: string[]): string[][] {
  if (words.length === 0) return [];
  let packCount = Math.ceil(words.length / 15);
  while (packCount > 1 && Math.floor(words.length / packCount) < 10) packCount--;
  const base = Math.floor(words.length / packCount);
  const larger = words.length % packCount;
  const out: string[][] = [];
  let start = 0;
  for (let i = 0; i < packCount; i++) { const size = base + (i < larger ? 1 : 0); out.push(words.slice(start, start + size)); start += size; }
  return out;
}

async function getOrCreatePersonalClassroom(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<string> {
  const { data: existing } = await supabase.from('classrooms').select('id').eq('teacher_id', userId).eq('name', '__personal__').single();
  if (existing?.id) return existing.id;
  const { data: created, error } = await supabase.from('classrooms').insert({
    teacher_id: userId, name: '__personal__', description: 'Personal word list', invite_code: `P-${userId.slice(0, 8).toUpperCase()}`,
  }).select('id').single();
  if (error) throw new Error(`Cannot create personal classroom: ${error.message}`);
  return created.id;
}

interface ImportArgs { userId: string; packId: string; words: string[]; topicId: string; topicTitle: string; packIndex: number; catalogVersion: string }

/** Import 1 pack: resolve/insert words từ global_dictionary, ghi membership + progress. Idempotent. */
async function importPack(supabase: ReturnType<typeof createServiceClient>, { userId, packId, words, topicId, topicTitle, packIndex, catalogVersion }: ImportArgs) {
  if (words.length === 0) return { error: { status: 404, message: 'Gói từ này không tồn tại hoặc đang trống.' } };
  if (words.length > MAX_PACKAGE_IMPORT) return { error: { status: 400, message: `Mỗi lượt chỉ được thêm tối đa ${MAX_PACKAGE_IMPORT} từ.` } };

  const classroomId = await getOrCreatePersonalClassroom(supabase, userId);

  const { data: existingRows, error: fetchErr } = await supabase.from('words').select('id, word').eq('classroom_id', classroomId).in('word', words);
  if (fetchErr) throw fetchErr;
  const existingSet = new Set(existingRows?.map((r) => r.word.toLowerCase()) || []);
  const wordsToInsert = words.filter((w) => !existingSet.has(w));

  const { data: gdEntries, error: gdErr } = wordsToInsert.length > 0
    ? await supabase.from('global_dictionary').select('word, data, image_url, image_source, image_confidence').in('word', wordsToInsert)
    : { data: [], error: null };
  if (gdErr) throw gdErr;
  const gdMap = new Map<string, NonNullable<typeof gdEntries>[number]>();
  for (const entry of gdEntries ?? []) gdMap.set(entry.word.toLowerCase(), entry);

  const rows = wordsToInsert.map((word) => {
    const gdEntry = gdMap.get(word);
    const gdData = (gdEntry?.data ?? {}) as GdData;
    const m = gdData.results?.[0]?.meanings?.[0] ?? {};
    return {
      classroom_id: classroomId, added_by: userId, word,
      translation: m.definition || '⏳ Analyzing...', ipa: gdData.pronunciations?.[0]?.ipa || '',
      pos: m.pos || '', example: m.example || '',
      image_url: gdEntry?.image_url || null, image_source: gdEntry?.image_source || 'none',
      image_confidence: gdEntry?.image_confidence ?? null, synonyms: m.synonyms || [], antonyms: m.antonyms || [],
    };
  });

  const { data: insertedRows, error: insertErr } = rows.length > 0
    ? await supabase.from('words').insert(rows).select('id, word')
    : { data: [], error: null };
  if (insertErr) throw insertErr;

  const wordIdMap = new Map<string, string>();
  for (const row of [...(existingRows ?? []), ...(insertedRows ?? [])]) wordIdMap.set(row.word.toLowerCase(), row.id);
  const orderedWordIds = words.map((w) => wordIdMap.get(w)).filter((id): id is string => Boolean(id));
  if (orderedWordIds.length !== words.length) throw new Error('Could not resolve every word ID for this pack');

  // Pack + membership + progress trong MỘT transaction (RPC) — tránh trạng thái nhập dở.
  const { error: rpcError } = await supabase.rpc('import_vocab_pack', {
    p_user_id: userId, p_pack_id: packId, p_catalog_version: catalogVersion,
    p_topic_id: topicId, p_topic_title: topicTitle, p_pack_index: packIndex, p_word_ids: orderedWordIds,
  });
  if (rpcError) throw rpcError;

  return { ok: { imported: rows.length, classroomId, packId, wordIds: orderedWordIds } };
}

/** GET /api/import/packages — cây route→topic→subtopic→pack (chỉ published) + progress của user. */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const tree = getCatalogTree();
    const supabase = createServiceClient();
    const { data: progressRows, error: progressError } = await supabase
      .from('user_vocab_packs')
      .select('pack_id, status, reviewed_count, word_count, started_at, last_studied_at, completed_at')
      .eq('user_id', auth.userId);
    if (progressError) console.warn('[VocabCatalog] Pack progress unavailable:', progressError.message);
    const progressMap = new Map((progressRows ?? []).map((r) => [r.pack_id, r]));

    const routes = tree.map((route) => ({
      ...route,
      topics: route.topics.map((topic) => ({
        ...topic,
        subtopics: topic.subtopics.map((sub) => ({
          ...sub,
          packs: sub.packs.map((pack) => {
            const p = progressMap.get(pack.id);
            return p ? {
              ...pack,
              progress: { status: p.status as 'in_progress' | 'completed', reviewedCount: p.reviewed_count, wordCount: p.word_count, startedAt: p.started_at, lastStudiedAt: p.last_studied_at, completedAt: p.completed_at },
            } : pack;
          }),
        })),
      })),
    }));

    return NextResponse.json({ success: true, routes, microPackSize: MICRO_PACK_SIZE, catalogVersion: CATALOG_VERSION });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET packages error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/import/packages
 * Mới (V3):  { packId, catalogVersion }
 * Back-compat: { package, lessonName, packIndex, catalogVersion } (tab cũ chưa reload)
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;
    const body = (await req.json()) as { packId?: string; catalogVersion?: string; package?: string; lessonName?: string; packIndex?: number };
    const supabase = createServiceClient();

    // ── Path V3: packId ──
    if (typeof body.packId === 'string' && body.packId) {
      if (body.catalogVersion !== CATALOG_VERSION) {
        return NextResponse.json({ success: false, error: 'Danh mục đã được cập nhật. Hãy tải lại trang trước khi bắt đầu học.' }, { status: 409 });
      }
      const pack = resolvePack(body.packId);
      if (!pack) return NextResponse.json({ success: false, error: 'Gói từ không tồn tại trong danh mục.' }, { status: 404 });
      if (!pack.published) return NextResponse.json({ success: false, error: 'Chủ đề này chưa đạt tiêu chuẩn để xuất bản.' }, { status: 400 });

      const result = await importPack(supabase, {
        userId, packId: pack.packId, words: pack.words, topicId: pack.topicId, topicTitle: pack.subtopicTitle, packIndex: pack.index, catalogVersion: CATALOG_VERSION,
      });
      if (result.error) return NextResponse.json({ success: false, error: result.error.message }, { status: result.error.status });
      return NextResponse.json({ success: true, ...result.ok, message: result.ok!.imported > 0 ? `Đã thêm ${result.ok!.imported} từ. Bắt đầu học ngay khi trí nhớ còn mới!` : 'Đã mở lại chặng học này.' });
    }

    // ── Back-compat: body cũ ──
    const { package: pkg, lessonName, packIndex } = body;
    if (!pkg || !lessonName || (pkg !== 'pro3m' && pkg !== 'pro3m-plus')) {
      return NextResponse.json({ success: false, error: 'packId (hoặc package + lessonName) là bắt buộc.' }, { status: 400 });
    }
    const lessonInfo = LEGACY_PACKAGES[pkg][lessonName];
    if (!lessonInfo?.words) return NextResponse.json({ success: false, error: `Lesson "${lessonName}" not found in package` }, { status: 404 });
    const allWords = legacyCleanWords(lessonInfo.words);
    if (allWords.length < 10 || allWords.length > 200) return NextResponse.json({ success: false, error: 'Chủ đề này chưa đạt tiêu chuẩn để xuất bản.' }, { status: 400 });
    const reqPack = typeof packIndex === 'number' && Number.isInteger(packIndex) && packIndex >= 0 ? packIndex : 0;
    const words = legacyMicroPacks(allWords)[reqPack] ?? [];
    const legacyPackId = `${body.catalogVersion ?? 'legacy'}:${pkg}:${lessonName}:pack:${reqPack}`;
    const result = await importPack(supabase, {
      userId, packId: legacyPackId, words, topicId: `${pkg}:${lessonName}`, topicTitle: lessonName, packIndex: reqPack, catalogVersion: body.catalogVersion ?? 'legacy',
    });
    if (result.error) return NextResponse.json({ success: false, error: result.error.message }, { status: result.error.status });
    return NextResponse.json({ success: true, ...result.ok, message: result.ok!.imported > 0 ? `Đã thêm ${result.ok!.imported} từ.` : 'Đã mở lại chặng học này.' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST import package error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
