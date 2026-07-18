import { NextResponse } from 'next/server';
import { createServiceClient, type DictionaryData, type SRSProgress, type Word } from '@/lib/supabase';
import { enrichWord as performAIEnrichment } from '@/lib/ai-enrich';
import { resolveWordImage } from '@/lib/image-pipeline';
import { stabilityToLevel } from '@/lib/srs';
import {
  getAuthUser,
  unauthorized,
  forbidden,
  isValidString,
  checkRateLimitAsync,
  userCanWriteClassroom,
} from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import { checkWordSaveQuota, resolvePlanByUserId } from '@/lib/entitlement';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';

/**
 * Kiểm tra user có quyền trên word (qua classroom): user là owner classroom,
 * hoặc là người thêm từ. Trả về true nếu được phép.
 */
async function userOwnsWord(
  supabase: ReturnType<typeof createServiceClient>,
  wordId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('words')
    .select('added_by, classroom:classrooms(teacher_id)')
    .eq('id', wordId)
    .maybeSingle();
  if (!data) return false;
  const cls = data.classroom as { teacher_id?: string } | { teacher_id?: string }[] | null;
  const teacherId = Array.isArray(cls) ? cls[0]?.teacher_id : cls?.teacher_id;
  return data.added_by === userId || teacherId === userId;
}

type SRSProgressWithStability = SRSProgress & { stability?: number };
type WordWithSrsList = Word & { srs_progress?: SRSProgressWithStability[] };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


// ─────────────────────────────────────────────────────────────────────────────
// Helper: Lấy hoặc tạo "personal classroom" của user
// ─────────────────────────────────────────────────────────────────────────────
async function getOrCreatePersonalClassroom(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<string> {
  const cacheKey = `personal-cls:${userId}`;
  const hit = cacheGet<string>(cacheKey);
  if (hit) return hit;

  // 1. Tìm classroom đã tồn tại của user này
  const { data: existing } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', userId)
    .eq('name', '__personal__')
    .single();

  if (existing?.id) {
    cacheSet(cacheKey, existing.id as string, 10 * 60_000);
    return existing.id as string;
  }

  // 2. Tạo mới nếu chưa có
  const { data: created, error } = await supabase
    .from('classrooms')
    .insert({
      teacher_id: userId,
      name: '__personal__',
      description: 'Personal word list',
      invite_code: `P-${userId.slice(0, 8).toUpperCase()}`,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Cannot create personal classroom: ${error.message}`);
  cacheSet(cacheKey, created.id as string, 10 * 60_000);
  return created.id as string;
}

type WordSummaryCounts = {
  total: number;
  dueCount: number;
  newCount: number;
  reviewDueCount: number;
  /** Phân bố full kho theo stability → L1…L6 (index 0 = L1) */
  levelCounts: number[];
};

/**
 * Đếm L1–L6 trên TOÀN BỘ từ classroom.
 * Ưu tiên RPC get_word_level_counts (1 query) — migration 20260716_class_scale_db_perf.
 * Fallback chunk cũ nếu RPC chưa apply.
 */
async function fetchLevelCounts(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  classroomId: string,
  totalWords: number,
): Promise<number[]> {
  const { data: rpcRows, error: rpcErr } = await supabase.rpc('get_word_level_counts', {
    p_user_id: userId,
    p_classroom_id: classroomId,
  });
  if (!rpcErr && rpcRows) {
    const row = (Array.isArray(rpcRows) ? rpcRows[0] : rpcRows) as {
      l1?: number; l2?: number; l3?: number; l4?: number; l5?: number; l6?: number;
    } | null;
    if (row) {
      return [
        Number(row.l1 ?? 0),
        Number(row.l2 ?? 0),
        Number(row.l3 ?? 0),
        Number(row.l4 ?? 0),
        Number(row.l5 ?? 0),
        Number(row.l6 ?? 0),
      ];
    }
  }

  // Fallback: chunk (chậm) — chỉ khi migration chưa chạy
  const levelCounts = [0, 0, 0, 0, 0, 0];
  const { data: wordRows, error: wErr } = await supabase
    .from('words')
    .select('id')
    .eq('classroom_id', classroomId);
  if (wErr || !wordRows?.length) {
    if (totalWords > 0 && (!wordRows || wordRows.length === 0)) {
      levelCounts[0] = totalWords;
    }
    return levelCounts;
  }

  const wordIds = wordRows.map((w) => w.id as string);
  const CHUNK = 200;
  const stabilityByWord = new Map<string, number>();
  for (let i = 0; i < wordIds.length; i += CHUNK) {
    const chunk = wordIds.slice(i, i + CHUNK);
    const { data: srsRows } = await supabase
      .from('srs_progress')
      .select('word_id, stability')
      .eq('user_id', userId)
      .in('word_id', chunk);
    for (const row of srsRows ?? []) {
      if (row.word_id) {
        stabilityByWord.set(row.word_id as string, Number(row.stability ?? 0));
      }
    }
  }

  for (const id of wordIds) {
    const s = stabilityByWord.get(id);
    const level = s === undefined ? 1 : stabilityToLevel(s);
    levelCounts[level - 1] += 1;
  }
  return levelCounts;
}

/**
 * Đếm total / new / review-due — RPC + fallback.
 * levelCounts (O(n) quét full kho) CHỈ khi includeLevels=true — poll 30s không được gọi.
 */
async function fetchWordSummaryCounts(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  classroomId: string,
  includeLevels = false,
): Promise<WordSummaryCounts> {
  // 30s cache — 100 HS refresh cùng lúc chỉ 1 RPC/instance
  const cacheKey = `wsum:${userId}:${classroomId}:${includeLevels ? 1 : 0}`;
  const cached = cacheGet<WordSummaryCounts>(cacheKey);
  if (cached) return cached;

  // Ưu tiên RPC (migration 20260709_word_summary_perf)
  const { data: rpcRows, error: rpcErr } = await supabase.rpc('get_word_summary', {
    p_user_id: userId,
    p_classroom_id: classroomId,
  });
  if (!rpcErr && rpcRows) {
    const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    if (row) {
      const total = Number(row.total ?? 0);
      const result: WordSummaryCounts = {
        total,
        newCount: Number(row.new_count ?? 0),
        reviewDueCount: Number(row.review_due_count ?? 0),
        dueCount: Number(row.due_count ?? 0),
        levelCounts: includeLevels
          ? await fetchLevelCounts(supabase, userId, classroomId, total)
          : [0, 0, 0, 0, 0, 0],
      };
      cacheSet(cacheKey, result, includeLevels ? 60_000 : 30_000);
      return result;
    }
  }

  const now = new Date().toISOString();
  const [
    { count: total },
    { count: dueCount },
    { count: wordsWithSrs },
    { count: learnedCount },
    { count: reviewDueCount },
  ] = await Promise.all([
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('classroom_id', classroomId),
    supabase
      .from('srs_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_date', now),
    supabase
      .from('srs_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('srs_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('review_count', 0),
    supabase
      .from('srs_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('review_count', 0)
      .lte('next_review_date', now),
  ]);

  const totalN = total || 0;
  const learnedN = learnedCount || 0;
  const withSrsN = wordsWithSrs || 0;
  const result: WordSummaryCounts = {
    total: totalN,
    // due = SRS đến hạn + từ chưa có SRS (coi như cần học/ôn)
    dueCount: (dueCount || 0) + Math.max(0, totalN - withSrsN),
    newCount: Math.max(0, totalN - learnedN),
    reviewDueCount: reviewDueCount || 0,
    levelCounts: includeLevels
      ? await fetchLevelCounts(supabase, userId, classroomId, totalN)
      : [0, 0, 0, 0, 0, 0],
  };
  cacheSet(cacheKey, result, includeLevels ? 60_000 : 30_000);
  return result;
}

// Shape JSONB của global_dictionary.data (Vietnamese definitions + IPA)
type GdMeaning = { pos?: string; definition?: string; example?: string; collocations?: string[] };
type GdData = { pronunciations?: { ipa?: string }[]; results?: { meanings?: GdMeaning[] }[]; synonyms?: string[]; antonyms?: string[] };

type EnrichResult = {
  word: string; translation: string; ipa: string; pos: string;
  example: string; synonyms: string[]; antonyms: string[];
};

/**
 * Background enrichment với THÁC 3 TẦNG tiết kiệm request AI:
 *   Tier 1: global_dictionary (kho chung — bot cào / AI đã cache)  → 0 AI
 *   Tier 2: từ của user khác đã enrich xong (cùng từ)              → 0 AI
 *   Tier 3: Gemini AI (chỉ khi 2 tầng trên trượt) + ghi cache ngược → 1 AI
 * Nếu user TỰ CHỌN nghĩa cụ thể (userTargetTranslation) → bỏ qua cache, dùng AI để tôn trọng lựa chọn.
 */
async function enrichWord(wordId: string, originalInput: string, userId: string, customApiKey?: string, dictionaryData?: DictionaryData | null, userTargetTranslation?: string): Promise<void> {
  const supabase = createServiceClient();
  const lower = originalInput.trim().toLowerCase();
  const hasUserTranslation = userTargetTranslation && userTargetTranslation !== '⏳ Analyzing...' && !userTargetTranslation.includes('⏳') && !userTargetTranslation.includes('Analyzing');

  try {
    let updateData: EnrichResult | null = null;
    let imageSearchQuery = '';
    let source: 'global_dict' | 'peer_word' | 'ai' = 'ai';

    // ── CASCADE (chỉ khi user không tự chọn nghĩa riêng) ──
    if (!hasUserTranslation) {
      // Tier 1: global_dictionary
      const { data: gd } = await supabase
        .from('global_dictionary')
        .select('data')
        .eq('word', lower)
        .maybeSingle();
      const gdData = (gd?.data ?? null) as GdData | null;
      const gdMeaning = gdData?.results?.[0]?.meanings?.[0];
      if (gdMeaning?.definition) {
        updateData = {
          word: lower,
          translation: gdMeaning.definition,
          ipa: gdData?.pronunciations?.[0]?.ipa || '',
          pos: gdMeaning.pos || '',
          example: gdMeaning.example || '',
          synonyms: gdData?.synonyms || [],
          antonyms: gdData?.antonyms || [],
        };
        source = 'global_dict';
      } else {
        // Tier 2: từ của user khác đã enrich (translation sạch + có IPA)
        const { data: peer } = await supabase
          .from('words')
          .select('translation, ipa, pos, example, synonyms, antonyms')
          .ilike('word', lower)
          .neq('id', wordId)
          .neq('ipa', '')
          .not('translation', 'ilike', '%Analyzing%')
          .not('translation', 'ilike', '%failed%')
          .limit(1)
          .maybeSingle();
        if (peer?.translation) {
          updateData = {
            word: lower,
            translation: peer.translation,
            ipa: peer.ipa || '',
            pos: peer.pos || '',
            example: peer.example || '',
            synonyms: peer.synonyms || [],
            antonyms: peer.antonyms || [],
          };
          source = 'peer_word';
        }
      }
    }

    // ── Tier 3: AI (cache miss, hoặc user chọn nghĩa riêng) ──
    if (!updateData) {
      const parsed = await performAIEnrichment(originalInput, customApiKey, dictionaryData, userTargetTranslation);
      updateData = {
        word: parsed.english,
        translation: parsed.vietnamese,
        ipa: parsed.ipa,
        pos: parsed.pos,
        example: parsed.example,
        synonyms: parsed.synonyms,
        antonyms: parsed.antonyms,
      };
      imageSearchQuery = parsed.image_search_query;
      source = 'ai';

      // Ghi cache ngược vào global_dictionary để lần sau hit Tier 1.
      // Chỉ ghi khi KHÔNG phải nghĩa user tự chọn (tránh ghi đè nghĩa hiếm lên kho chung).
      if (!hasUserTranslation) {
        void supabase.from('global_dictionary').upsert({
          word: parsed.english,
          data: {
            word: parsed.english,
            pronunciations: parsed.ipa ? [{ ipa: parsed.ipa }] : [],
            results: [{ meanings: [{ pos: parsed.pos, definition: parsed.vietnamese, example: parsed.example, collocations: [] }] }],
          },
          tags: ['ai-generated', 'save-enrich'],
        }, { onConflict: 'word' }).then(({ error }) => {
          if (error) console.error('[Enrich] global_dictionary cache write failed:', error.message);
        });
      }
    }

    console.log(`[Enrich] "${lower}" via ${source}`);

    // ── Ảnh: ưu tiên ảnh của từ trùng (mọi user), cuối cùng mới fetch pipeline ──
    let imageUrl: string | null = null;
    let imageSource = 'none';
    let imageConfidence: number | null = null;

    const { data: cachedWord } = await supabase
      .from('words')
      .select('image_url, image_source, image_confidence')
      .eq('word', updateData.word)
      .eq('translation', updateData.translation) // Khớp nghĩa tiếng Việt để tránh sao chép nhầm ảnh của nghĩa khác
      .not('image_url', 'is', null)
      .neq('id', wordId)
      .limit(1)
      .maybeSingle();

    if (cachedWord?.image_url) {
      imageUrl = cachedWord.image_url;
      imageSource = cachedWord.image_source || 'cache';
      imageConfidence = cachedWord.image_confidence ?? null;
    } else {
      const meaningCount = dictionaryData?.results?.[0]?.meanings?.length || 1;
      const img = await resolveWordImage({
        word: updateData.word,
        pos: updateData.pos,
        definition: updateData.translation,
        exampleSentence: updateData.example,
        imageSearchQuery,
        meaningCount,
      });
      imageUrl = img.url;
      imageSource = img.source;
      imageConfidence = img.confidence;
    }

    // Final Update
    const finalUpdate: EnrichResult & {
      image_url: string | null;
      image_source: string;
      image_confidence: number | null;
    } = {
      ...updateData,
      image_url: imageUrl,
      image_source: imageSource,
      image_confidence: imageConfidence,
    };

    // If the user explicitly selected a translation, we guarantee it is NOT overwritten by AI
    if (hasUserTranslation && userTargetTranslation) {
      finalUpdate.translation = userTargetTranslation;
    }

    await supabase.from('words').update(finalUpdate).eq('id', wordId);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`AI enrichment failed for "${originalInput}":`, msg);
    try {
      // Fetch current translation to protect it from being overwritten by failure messages
      const { data: currentWord } = await supabase
        .from('words')
        .select('translation')
        .eq('id', wordId)
        .maybeSingle();
      
      const currentT = currentWord?.translation || '';
      const isPending = !currentT || currentT.includes('⏳') || currentT.includes('Analyzing');
      
      if (isPending) {
        await supabase.from('words').update({
          translation: '❌ Analysis failed - click Retry',
        }).eq('id', wordId);
      }
    } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST: Lưu từ ngay lập tức, AI enrichment chạy nền
// Body: { word, userId }  hoặc  { word, userId, classroomId }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const body = await req.json();
    const word = (typeof body.word === 'string' ? body.word : '').trim().slice(0, 100);
    let classroomId = (typeof body.classroomId === 'string' ? body.classroomId : '').trim();

    if (!word) {
      return NextResponse.json({ success: false, error: 'Word is required' }, { status: 400 });
    }
    // Reject quá dài để tránh abuse (raw input trước khi slice)
    if (typeof body.word === 'string' && body.word.length > 200) {
      return NextResponse.json({ success: false, error: 'Word too long' }, { status: 400 });
    }

    // Rate limit: chỉ áp lên path kích hoạt AI enrichment (skipAI=false) — 15 req/min mỗi user
    if (!body.skipAI) {
      const rl = await checkRateLimitAsync(`ai:words:${userId}`, 15, 60_000);
      if (!rl.allowed) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded' },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
        );
      }
    }

    const supabase = createServiceClient();

    // Tự động dùng personal classroom nếu không truyền classroomId
    if (!classroomId) {
      classroomId = await getOrCreatePersonalClassroom(supabase, userId);
    } else {
      // IDOR: không cho ghi vào classroom lạ (chỉ teacher / enrolled / personal owner)
      const canWrite = await userCanWriteClassroom(supabase, userId, classroomId);
      if (!canWrite) {
        return forbidden('Không có quyền thêm từ vào lớp này');
      }
    }

    // ── Check duplicate (case-insensitive) ──
    const { data: existing } = await supabase
      .from('words')
      .select('id, word, translation')
      .eq('classroom_id', classroomId)
      .ilike('word', word.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: `"${word}" already in your list!`,
        wordId: existing.id,
      });
    }

    // Free: tối đa 200 từ mới/tháng (không đếm duplicate; từ cũ vẫn ôn được)
    const plan = await resolvePlanByUserId(supabase, userId);
    const saveQuota = await checkWordSaveQuota(supabase, userId, plan, 1);
    if (!saveQuota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'FREE_WORD_LIMIT',
          message: `Gói Free lưu tối đa ${saveQuota.limit ?? 200} từ mới/tháng. Nâng Pro để lưu không giới hạn.`,
          used: saveQuota.used,
          limit: saveQuota.limit,
          remaining: saveQuota.remaining,
          upgradeTo: saveQuota.upgradeTo ?? 'pro',
        },
        { status: 403 },
      );
    }

    // ── Stage 1: Fast Dictionary Lookup (Skip if already provided by Extension/Spreadsheet) ──
    // External API trả về shape có thêm `pronunciations` ở mỗi result entry — dùng narrow type
    type DictApiResult = {
      pronunciations?: { ipa?: string }[];
      meanings?: { definition?: string; pos?: string }[];
    };
    type DictApiResponse = { results?: DictApiResult[] } & DictionaryData;

    let dictData: DictApiResponse | null = null;
    let initialTranslation = body.translation || '⏳ Analyzing...';
    let initialIpa = body.ipa || '';
    let initialPos = body.pos || '';

    // Only fetch if data was not manually selected or imported
    if (initialTranslation === '⏳ Analyzing...') {
      try {
        const dictRes = await fetch(`https://dict.minhqnd.com/api/v1/lookup?word=${encodeURIComponent(word)}&lang=en&def_lang=vi`);
        if (dictRes.ok) {
          dictData = (await dictRes.json()) as DictApiResponse;
          const actualDictData = dictData?.results?.[0];
          // Extract primary meaning and IPA from the nested data
          if (actualDictData?.meanings && actualDictData.meanings.length > 0) {
            initialIpa = actualDictData.pronunciations?.[0]?.ipa || '';
            initialTranslation = actualDictData.meanings[0].definition || initialTranslation;
            initialPos = actualDictData.meanings[0].pos || '';
          }
        }
      } catch (dictErr) {
        console.warn('[Dictionary API] Failed:', dictErr);
      }
    }

    // ── Save word immediately with manual or fetched dictionary data ──
    const { data, error } = await supabase
      .from('words')
      .insert({
        classroom_id: classroomId,
        added_by: userId,
        word,
        translation: initialTranslation,
        ipa: initialIpa,
        pos: initialPos,
        dictionary_data: dictData,
        source_url: body.sourceUrl || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    const skipAI = Boolean(body.skipAI);
    if (!skipAI) {
      // ── Background AI Enrichment (Stage 2) ──
      const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', userId).single();
      
      // Pass userSelectedTranslation (only if explicitly provided in body.translation)
      const userSelectedTranslation = (typeof body.translation === 'string' && body.translation.trim().length > 0 && body.translation !== '⏳ Analyzing...')
        ? body.translation.trim()
        : undefined;

      enrichWord(data.id, word, userId, profile?.gemini_api_key, dictData, userSelectedTranslation);
    }
    
    // used trước insert; sau insert +1 (cho UI near-limit 150+)
    const usedAfter = (saveQuota.used ?? 0) + 1;
    const limit = saveQuota.limit;
    const remainingAfter =
      limit != null ? Math.max(0, limit - usedAfter) : null;

    return NextResponse.json({
      success: true,
      message: `"${word}" saved!`,
      wordId: data.id,
      wordQuota:
        limit != null
          ? { used: usedAfter, limit, remaining: remainingAfter }
          : null,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/words Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to save word', details: msg },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET: Lấy từ của user (personal list)
// Query: ?userId=xxx  hoặc  ?classroomId=xxx&userId=xxx
//        &limit=N (default 100, max 500)  &offset=N (default 0)
//        &summary=1 → chỉ trả total/due counts (không fetch words)
//        &levels=1  → kèm levelCounts L1–L6 (đắt — chỉ first paint dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    // Chống dump pagination (offset tăng liên tục) — đủ cho học/dashboard
    const listDenied = await assertScrapeQuota(`words-list:${userId}`, QUOTA.wordsList);
    if (listDenied) return listDenied;

    const { searchParams } = new URL(req.url);
    let classroomId = searchParams.get('classroomId') || '';
    const summary = searchParams.get('summary') === '1';
    const includeLevels = searchParams.get('levels') === '1';
    const filter = searchParams.get('filter'); // 'review' = từ đã học & đến hạn | 'new' = từ chưa học (review_count=0)
    // Cap page size — cào full kho bằng limit=500 bị chặn
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const idsParam = searchParams.get('ids');
    const parsedIds = idsParam === null
      ? null
      : idsParam.split(',').map((id) => id.trim().toLowerCase()).filter((id) => id.length > 0);

    if (parsedIds && (parsedIds.length === 0 || parsedIds.length > 20 || parsedIds.some((id) => !UUID_PATTERN.test(id)))) {
      return NextResponse.json({ success: false, error: 'ids must contain at most 20 valid UUIDs' }, { status: 400 });
    }
    const requestedIds = parsedIds ? [...new Set(parsedIds)] : null;

    const supabase = createServiceClient();

    // Nếu truyền classroomId, xác minh user là teacher của classroom đó (chống đọc lén)
    if (classroomId) {
      const { data: cls } = await supabase
        .from('classrooms')
        .select('teacher_id')
        .eq('id', classroomId)
        .maybeSingle();
      const isTeacher = cls?.teacher_id === userId;
      const { data: enrolled } = isTeacher
        ? { data: true }
        : await supabase
            .from('enrollments')
            .select('id')
            .eq('classroom_id', classroomId)
            .eq('student_id', userId)
            .maybeSingle();
      if (!isTeacher && !enrolled) return unauthorized();
    } else {
      // Tự động dùng personal classroom của chính user
      classroomId = await getOrCreatePersonalClassroom(supabase, userId);
    }

    // ── Chế độ REVIEW: từ ĐÃ học & ĐẾN HẠN (cap theo limit, default 100) ──
    // Tránh limit 1000 + select * bloated khi session chỉ cần ~25 thẻ.
    if (filter === 'review') {
      const nowIso = new Date().toISOString();
      const reviewCap = Math.min(limit, 100);
      const { data: dueSrs, error: dueErr } = await supabase
        .from('srs_progress')
        .select('word_id, user_id, next_review_date, review_count, stability, difficulty, ease_factor, interval_days, last_reviewed_at')
        .eq('user_id', userId)
        .gt('review_count', 0)
        .lte('next_review_date', nowIso)
        .order('next_review_date', { ascending: true })
        .limit(reviewCap);
      if (dueErr) throw dueErr;

      const requestedIdSet = requestedIds ? new Set(requestedIds) : null;
      const dueIds = (dueSrs || [])
        .map((s) => s.word_id)
        .filter((id) => !requestedIdSet || requestedIdSet.has(id));
      if (dueIds.length === 0) {
        return new NextResponse(JSON.stringify({ success: true, data: [], classroomId, total: 0 }), {
          headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
        });
      }

      const srsByWord = new Map(
        (dueSrs || []).map((s) => [s.word_id as string, s as SRSProgressWithStability]),
      );

      // Lấy từ due (id list từ SRS user) — không join srs_progress(*) (payload nhẹ)
      let dueWordsQuery = supabase
        .from('words')
        .select('id, word, translation, ipa, pos, example, image_url, synonyms, antonyms, classroom_id, created_at')
        .in('id', dueIds);
      if (requestedIds) {
        dueWordsQuery = dueWordsQuery.eq('classroom_id', classroomId);
      }
      const { data: wordsData, error: wErr } = await dueWordsQuery;
      if (wErr) throw wErr;

      const order = new Map(dueIds.map((id, i) => [id, i])); // giữ thứ tự due lâu nhất trước
      const enriched = ((wordsData || []) as Word[])
        .map((w) => {
          const srs = srsByWord.get(w.id) || null;
          const srsLevel = stabilityToLevel(srs?.stability || 0);
          return {
            ...w,
            srs,
            isDue: true,
            reviewCount: srs?.review_count || 0,
            srsLevel,
            mastery: Math.min(100, srsLevel * 20),
            status: srsLevel >= 5 ? 'mastered' : 'learning',
          };
        })
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

      return new NextResponse(JSON.stringify({ success: true, data: enriched, classroomId, total: enriched.length }), {
        headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
      });
    }

    // ── Chế độ NEW: trả từ CHƯA học (không có SRS hoặc review_count=0) trên TOÀN BỘ words ──
    // LearnMode dùng — không kẹt pagination 300 từ mới nhất, không bỏ sót từ cũ chưa học.
    if (filter === 'new') {
      // 1. Tập word_id ĐÃ học của user (review_count > 0)
      // ⚠️ Perf cliff: user học >10k từ → hàng vượt limit bị drop → từ đã học hiện lại như "mới".
      // Khi chạm ngưỡng: chuyển sang RPC đếm phía DB hoặc paginate vòng lặp.
      const { data: learnedRows, error: lErr } = await supabase
        .from('srs_progress')
        .select('word_id')
        .eq('user_id', userId)
        .gt('review_count', 0)
        .limit(10000);
      if (lErr) throw lErr;
      const learnedIds = new Set((learnedRows || []).map((r) => r.word_id));

      // 2. Id mọi từ trong classroom (nhẹ — chỉ id) theo thứ tự mới nhất trước
      let wordIdsQuery = supabase
        .from('words')
        .select('id')
        .eq('classroom_id', classroomId);
      if (requestedIds) {
        wordIdsQuery = wordIdsQuery.in('id', requestedIds);
      }
      const { data: idRows, error: idErr } = await wordIdsQuery
        .order('created_at', { ascending: false })
        .limit(5000);
      if (idErr) throw idErr;

      // 3. Lấy dư gấp 3 limit để còn lọc từ chưa enrich xong
      const candidateIds = (idRows || [])
        .map((r) => r.id)
        .filter((id) => !learnedIds.has(id))
        .slice(0, limit * 3);

      if (candidateIds.length === 0) {
        return new NextResponse(JSON.stringify({ success: true, data: [], classroomId, total: 0 }), {
          headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
        });
      }

      const { data: wordsData, error: wErr } = await supabase
        .from('words')
        .select('*, srs_progress(*)')
        .in('id', candidateIds);
      if (wErr) throw wErr;

      const order = new Map(candidateIds.map((id, i) => [id, i]));
      const enriched = ((wordsData || []) as WordWithSrsList[])
        .filter((w) =>
          w.word && w.translation &&
          !w.translation.includes('failed') &&
          !w.translation.includes('Analyzing') &&
          !w.translation.includes('⏳'))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        .slice(0, limit)
        .map((w) => {
          const srs = (w.srs_progress || []).find((s) => s.user_id === userId) || null;
          return {
            ...w,
            srs,
            isDue: true,
            reviewCount: 0,
            srsLevel: stabilityToLevel(srs?.stability || 0),
            mastery: 0,
            status: 'learning',
          };
        });

      return new NextResponse(JSON.stringify({ success: true, data: enriched, classroomId, total: enriched.length }), {
        headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
      });
    }

    // Chế độ summary: đếm total/due — levels chỉ khi ?levels=1
    if (summary) {
      const counts = await fetchWordSummaryCounts(supabase, userId, classroomId, includeLevels);
      return new NextResponse(JSON.stringify({
        success: true,
        classroomId,
        ...counts,
      }), {
        headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
      });
    }

    // List words + total count. Counts full (new/reviewDue): ?includeCounts=1 (tránh đếm đôi với summary=1)
    const includeCounts = searchParams.get('includeCounts') === '1';
    let countQuery = supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('classroom_id', classroomId);
    // Payload nhẹ: bỏ dictionary_data / image meta — dashboard + ôn không cần
    let wordsQuery = supabase
      .from('words')
      .select('id, word, translation, ipa, pos, example, image_url, synonyms, antonyms, classroom_id, created_at, srs_progress(user_id, stability, review_count, next_review_date, ease_factor, interval_days, difficulty, last_reviewed_at)')
      .eq('classroom_id', classroomId);
    if (requestedIds) {
      countQuery = countQuery.in('id', requestedIds);
      wordsQuery = wordsQuery.in('id', requestedIds);
    }

    const [countResult, wordsResult, summaryCounts] = await Promise.all([
      includeCounts ? Promise.resolve({ count: null as number | null }) : countQuery,
      wordsQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      includeCounts
        ? fetchWordSummaryCounts(supabase, userId, classroomId, includeLevels)
        : Promise.resolve(null),
    ]);

    if (wordsResult.error) throw wordsResult.error;

    const now = new Date().getTime();
    const enriched = ((wordsResult.data || []) as WordWithSrsList[]).map((w) => {
      const srs = (w.srs_progress || []).find((s) => s.user_id === userId) || null;
      const nextReviewDate = srs?.next_review_date ? new Date(srs.next_review_date).getTime() : now;

      // FSRS calculation: Map stability to a virtual Level 1-6
      const stability = srs?.stability || 0;
      const srsLevel = stabilityToLevel(stability);
      const isDue = !srs || nextReviewDate <= now;

      return {
        ...w,
        srs,
        isDue,
        reviewCount: srs?.review_count || 0,
        srsLevel,
        mastery: Math.min(100, srsLevel * 20),
        status: srsLevel >= 5 ? 'mastered' : 'learning',
      };
    });

    const total = summaryCounts?.total ?? countResult.count ?? 0;
    return new NextResponse(JSON.stringify({
      success: true,
      data: enriched,
      classroomId,
      total,
      ...(summaryCounts
        ? {
            newCount: summaryCounts.newCount,
            reviewDueCount: summaryCounts.reviewDueCount,
            dueCount: summaryCounts.dueCount,
          }
        : {}),
      limit,
      offset,
      hasMore: offset + limit < total,
    }), {
      // Private browser cache 15s — bớt spam khi user reload/đổi tab
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/words Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT: Cập nhật nghĩa từ thủ công (Dùng cho tính năng chọn nghĩa)
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { wordId, translation, pos, ipa } = await req.json();
    if (!isValidString(wordId, 100)) return NextResponse.json({ success: false, error: 'wordId is required' }, { status: 400 });

    const supabase = createServiceClient();
    if (!(await userOwnsWord(supabase, wordId, auth.userId))) return unauthorized();

    // Validate optional fields (chống lưu rác/quá dài)
    const updates: Record<string, string> = {};
    if (translation !== undefined) {
      if (typeof translation !== 'string' || translation.length > 1000) {
        return NextResponse.json({ success: false, error: 'invalid translation' }, { status: 400 });
      }
      updates.translation = translation;
    }
    if (pos !== undefined) {
      if (typeof pos !== 'string' || pos.length > 100) {
        return NextResponse.json({ success: false, error: 'invalid pos' }, { status: 400 });
      }
      updates.pos = pos;
    }
    if (ipa !== undefined) {
      if (typeof ipa !== 'string' || ipa.length > 200) {
        return NextResponse.json({ success: false, error: 'invalid ipa' }, { status: 400 });
      }
      updates.ipa = ipa;
    }

    const { error } = await supabase.from('words').update(updates).eq('id', wordId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { wordId } = await req.json();
    if (!isValidString(wordId, 100)) return NextResponse.json({ success: false, error: 'wordId is required' }, { status: 400 });
    const supabase = createServiceClient();
    if (!(await userOwnsWord(supabase, wordId, auth.userId))) return unauthorized();

    const { error } = await supabase.from('words').delete().eq('id', wordId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
