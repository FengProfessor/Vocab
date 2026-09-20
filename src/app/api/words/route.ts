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
import { checkWordSaveQuota, resolvePlanByUserId, resolveUserPlanInfo, recordWordSaved } from '@/lib/entitlement-server';
import { cacheGet, cacheSet, cacheDelete, invalidateServerWordSummaryCache } from '@/lib/ttl-cache';
import { parseIpa } from '@/lib/study';

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

const inFlightLevelCounts = new Map<string, Promise<number[]>>();
let rpcMissingCooldownUntil = 0;

/**
 * Đếm L1–L6 trên TOÀN BỘ từ classroom.
 * Ưu tiên RPC get_word_level_counts (1 query) — migration 20260716_class_scale_db_perf.
 * Fallback: song song chunks (Promise.all) + single-flight in-flight deduplication.
 */
async function fetchLevelCounts(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  classroomId: string,
  totalWords: number,
): Promise<number[]> {
  const flightKey = `${userId}:${classroomId}`;
  const existing = inFlightLevelCounts.get(flightKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      if (Date.now() > rpcMissingCooldownUntil) {
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
        } else if (rpcErr?.message?.includes('schema cache')) {
          // RPC chưa được migrate: bật circuit breaker 2 phút để không chịu 350ms delay mỗi request
          rpcMissingCooldownUntil = Date.now() + 120_000;
        }
      }

      // Fallback: parallel chunks — tránh vòng lặp tuần tự gây lag
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
      const chunks: string[][] = [];
      for (let i = 0; i < wordIds.length; i += CHUNK) {
        chunks.push(wordIds.slice(i, i + CHUNK));
      }

      const stabilityByWord = new Map<string, number>();
      const chunkResults = await Promise.all(
        chunks.map((chunk) =>
          supabase
            .from('srs_progress')
            .select('word_id, stability')
            .eq('user_id', userId)
            .in('word_id', chunk)
        )
      );

      for (const res of chunkResults) {
        for (const row of res.data ?? []) {
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
    } finally {
      inFlightLevelCounts.delete(flightKey);
    }
  })();

  inFlightLevelCounts.set(flightKey, promise);
  return promise;
}

const inFlightWordSummaryCounts = new Map<string, Promise<WordSummaryCounts>>();

function purgeLocalWordSummaryCache(userId: string): void {
  invalidateServerWordSummaryCache(userId);
  for (const k of inFlightWordSummaryCounts.keys()) {
    if (k.startsWith(`wsum:${userId}:`)) {
      inFlightWordSummaryCounts.delete(k);
    }
  }
}

/**
 * Đếm total / new / review-due — RPC + fallback.
 * levelCounts (O(n) quét full kho) CHỈ khi includeLevels=true — poll 30s không được gọi.
 * Có single-flight promise cache để tránh chạy trùng nhiều query khi nhiều request cùng đến.
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

  const inFlight = inFlightWordSummaryCounts.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      // Ưu tiên RPC (migration 20260919_optimize_word_summary_rpc)
      const { data: rpcRows, error: rpcErr } = await supabase.rpc('get_word_summary', {
        p_user_id: userId,
        p_classroom_id: classroomId || null,
      });
      if (!rpcErr && rpcRows) {
        const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
        if (row) {
          const total = Number(row.total ?? 0);
          const rawLevels = row.level_counts;
          const parsedLevels: number[] = Array.isArray(rawLevels)
            ? rawLevels.map((n: unknown) => Number(n) || 0)
            : [0, 0, 0, 0, 0, 0];

          const result: WordSummaryCounts = {
            total,
            newCount: Number(row.new_count ?? 0),
            reviewDueCount: Number(row.review_due_count ?? 0),
            dueCount: Number(row.due_count ?? 0),
            levelCounts: includeLevels ? parsedLevels : [0, 0, 0, 0, 0, 0],
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
          .select('id, words!inner(classroom_id)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('words.classroom_id', classroomId)
          .lte('next_review_date', now),
        supabase
          .from('srs_progress')
          .select('id, words!inner(classroom_id)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('words.classroom_id', classroomId),
        supabase
          .from('srs_progress')
          .select('id, words!inner(classroom_id)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('words.classroom_id', classroomId)
          .gt('review_count', 0),
        supabase
          .from('srs_progress')
          .select('id, words!inner(classroom_id)', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('words.classroom_id', classroomId)
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
    } finally {
      inFlightWordSummaryCounts.delete(cacheKey);
    }
  })();

  inFlightWordSummaryCounts.set(cacheKey, promise);
  return promise;
}

// Shape JSONB của global_dictionary.data (Vietnamese definitions + IPA)
type GdMeaning = {
  pos?: string;
  definition?: string;
  example?: string;
  example_vi?: string;
  collocations?: string[];
};
type GdData = { pronunciations?: { ipa?: string }[]; results?: { meanings?: GdMeaning[] }[]; synonyms?: string[]; antonyms?: string[] };

type EnrichResult = {
  word: string; translation: string; ipa: string; pos: string;
  example: string; example_vi: string; synonyms: string[]; antonyms: string[];
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
          ipa: parseIpa(gdData?.pronunciations?.[0]?.ipa) || '',
          pos: gdMeaning.pos || '',
          example: gdMeaning.example || '',
          example_vi: gdMeaning.example_vi || '',
          synonyms: gdData?.synonyms || [],
          antonyms: gdData?.antonyms || [],
        };
        source = 'global_dict';
      } else {
        // Tier 2: từ của user khác đã enrich (translation sạch + có IPA)
        const { data: peer } = await supabase
          .from('words')
          .select('translation, ipa, pos, example, example_vi, synonyms, antonyms')
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
            example_vi: peer.example_vi || '',
            synonyms: peer.synonyms || [],
            antonyms: peer.antonyms || [],
          };
          source = 'peer_word';
        }
      }

      // Tier 2.5: External dictionary API chạy ngầm (không chặn người dùng khi lưu từ)
      if (!updateData && !dictionaryData) {
        try {
          const dictRes = await fetch(`https://dict.minhqnd.com/api/v1/lookup?word=${encodeURIComponent(lower)}&lang=en&def_lang=vi`, {
            signal: AbortSignal.timeout(1800),
          });
          if (dictRes.ok) {
            const extData = (await dictRes.json()) as {
              results?: Array<{
                pronunciations?: { ipa?: string }[];
                meanings?: { definition?: string; pos?: string; example?: string; example_vi?: string }[];
              }>;
              synonyms?: string[];
              antonyms?: string[];
            };
            const firstMeaning = extData?.results?.[0]?.meanings?.[0];
            if (firstMeaning?.definition && !firstMeaning.definition.includes('failed')) {
              updateData = {
                word: lower,
                translation: firstMeaning.definition,
                ipa: parseIpa(extData.results?.[0]?.pronunciations?.[0]?.ipa) || '',
                pos: firstMeaning.pos || '',
                example: firstMeaning.example || '',
                example_vi: firstMeaning.example_vi || '',
                synonyms: extData.synonyms || [],
                antonyms: extData.antonyms || [],
              };
              source = 'global_dict';
              dictionaryData = extData as unknown as DictionaryData;
            }
          }
        } catch {
          // Proceed to Tier 3 AI
        }
      }
    }

    // ── Tier 3: AI (cache miss, hoặc user chọn nghĩa riêng) ──
    if (!updateData) {
      let apiKey = customApiKey;
      if (!apiKey) {
        const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', userId).maybeSingle();
        apiKey = profile?.gemini_api_key;
      }
      const parsed = await performAIEnrichment(originalInput, apiKey, dictionaryData, userTargetTranslation);
      updateData = {
        word: parsed.english,
        translation: parsed.vietnamese,
        ipa: parsed.ipa,
        pos: parsed.pos,
        example: parsed.example,
        example_vi: parsed.example_vi || '',
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
            results: [{
              meanings: [{
                pos: parsed.pos,
                definition: parsed.vietnamese,
                example: parsed.example,
                example_vi: parsed.example_vi || '',
                collocations: [],
              }],
            }],
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

    // Rate limit: chỉ áp lên path kích hoạt AI enrichment (skipAI=false) — 45 req/min mỗi user
    if (!body.skipAI) {
      const rl = await checkRateLimitAsync(`ai:words:${userId}`, 45, 60_000);
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

    // ── Pre-checks in Parallel: Duplicate Check + Plan Resolution + Global Dict Lookup ──
    const lower = word.toLowerCase().trim();
    let initialTranslation = body.translation || '⏳ Analyzing...';
    let initialIpa = body.ipa || '';
    let initialPos = body.pos || '';
    const needsGdLookup = initialTranslation === '⏳ Analyzing...';

    const [existingRes, planInfo, gdRes] = await Promise.all([
      supabase
        .from('words')
        .select('id, word, translation')
        .eq('classroom_id', classroomId)
        .ilike('word', word.trim())
        .maybeSingle(),
      resolveUserPlanInfo(supabase, userId),
      needsGdLookup
        ? supabase
            .from('global_dictionary')
            .select('data')
            .eq('word', lower)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (existingRes.data) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: `"${word}" already in your list!`,
        wordId: existingRes.data.id,
      });
    }

    // Free: tối đa 200 từ mới/tháng (không đếm duplicate; từ cũ vẫn ôn được)
    const saveQuota = await checkWordSaveQuota(supabase, userId, planInfo.plan, 1, planInfo.createdAt);
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

    // ── Stage 1: Fast Local Dictionary Check (Không chặn network ngoài trên foreground) ──
    let dictData: DictionaryData | null = null;

    if (needsGdLookup) {
      const gdData = (gdRes.data?.data ?? null) as GdData | null;
      const gdMeaning = gdData?.results?.[0]?.meanings?.[0];
      if (gdMeaning?.definition) {
        initialTranslation = gdMeaning.definition;
        initialIpa = parseIpa(gdData?.pronunciations?.[0]?.ipa) || '';
        initialPos = gdMeaning.pos || '';
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
      // ── Background AI Enrichment (Stage 2) — chạy hoàn toàn nền, không chặn HTTP response ──
      const userSelectedTranslation = (typeof body.translation === 'string' && body.translation.trim().length > 0 && body.translation !== '⏳ Analyzing...')
        ? body.translation.trim()
        : undefined;

      void enrichWord(data.id, word, userId, undefined, dictData, userSelectedTranslation);
    }
    
    // used trước insert; sau insert +1 (cho UI near-limit 150+)
    const usedAfter = (saveQuota.used ?? 0) + 1;
    const limit = saveQuota.limit;
    const remainingAfter =
      limit != null ? Math.max(0, limit - usedAfter) : null;

    recordWordSaved(userId);
    purgeLocalWordSummaryCache(userId);

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

    const { searchParams } = new URL(req.url);
    let classroomId = searchParams.get('classroomId') || '';
    const summary = searchParams.get('summary') === '1';
    const includeLevels = searchParams.get('levels') === '1';
    const filter = searchParams.get('filter'); // 'review' = từ đã học & đến hạn | 'new' = từ chưa học (review_count=0)

    // Chống dump pagination: chỉ áp dụng khi browse/list từ thông thường (không áp dụng lên phiên ôn tập SRS hay tóm tắt summary)
    const isStudyRequest = summary || filter === 'review' || filter === 'new';
    if (!isStudyRequest) {
      const listDenied = await assertScrapeQuota(`words-list:${userId}`, QUOTA.wordsList);
      if (listDenied) return listDenied;
    }
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

    // ── Chế độ REVIEW: từ ĐÃ học & ĐẾN HẠN + từ MỚI chưa học (cap theo limit, default 100) ──
    // Từ mới (chưa có srs_progress) cũng được trộn vào để HS tạo từ xong ôn ngay.
    if (filter === 'review') {
      const reviewCap = Math.min(limit, 100);

      // Fast-path: RPC get_due_words_list (1 query duy nhất ~200ms thay vì 3-4 roundtrips mạng)
      if (!requestedIds) {
        const { data: rpcWords, error: rpcErr } = await supabase.rpc('get_due_words_list', {
          p_user_id: userId,
          p_classroom_id: classroomId,
          p_limit: reviewCap,
        });

        if (!rpcErr && Array.isArray(rpcWords)) {
          if (rpcWords.length === 0) {
            return new NextResponse(JSON.stringify({ success: true, data: [], classroomId, total: 0 }), {
              headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
            });
          }

          const enriched = (rpcWords as Array<{
            id: string;
            word: string;
            translation: string;
            ipa?: string | null;
            pos?: string | null;
            example?: string | null;
            example_vi?: string | null;
            synonyms?: string[] | null;
            antonyms?: string[] | null;
            image_url?: string | null;
            review_count?: number | null;
          }>)
            .filter((w) =>
              w.word && w.translation &&
              !w.translation.includes('failed') &&
              !w.translation.includes('Analyzing') &&
              !w.translation.includes('⏳'))
            .map((w) => {
              const reviewCount = Number(w.review_count ?? 0);
              const isNew = reviewCount === 0;
              return {
                id: w.id,
                word: w.word,
                translation: w.translation,
                ipa: w.ipa || '',
                pos: w.pos || '',
                example: w.example || '',
                example_vi: w.example_vi || null,
                image_url: w.image_url || null,
                synonyms: w.synonyms || [],
                antonyms: w.antonyms || [],
                classroom_id: classroomId,
                srs: null,
                isDue: true,
                reviewCount,
                srsLevel: isNew ? 0 : 1,
                mastery: isNew ? 0 : 20,
                status: isNew ? 'new' : 'learning',
              };
            });

          return new NextResponse(JSON.stringify({ success: true, data: enriched, classroomId, total: enriched.length }), {
            headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
          });
        }
      }

      const nowIso = new Date().toISOString();
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

      const srsByWord = new Map(
        (dueSrs || []).map((s) => [s.word_id as string, s as SRSProgressWithStability]),
      );

      // ── Bổ sung từ MỚI (chưa có srs_progress) để HS tạo từ xong ôn ngay ──
      const remaining = reviewCap - dueIds.length;
      let newWordIds: string[] = [];
      if (remaining > 0) {
        // Lấy danh sách ID từ trong classroom để lọc từ mới chính xác
        const dueIdSet = new Set(dueIds);
        const { data: idRows } = await supabase
          .from('words')
          .select('id')
          .eq('classroom_id', classroomId)
          .order('created_at', { ascending: false });

        const candidateIds = (idRows || [])
          .map((r) => r.id as string)
          .filter((id) => !dueIdSet.has(id));

        if (candidateIds.length > 0) {
          const { data: hasSrsRows } = await supabase
            .from('srs_progress')
            .select('word_id')
            .eq('user_id', userId)
            .gt('review_count', 0);
          const hasSrsSet = new Set((hasSrsRows || []).map((r) => r.word_id as string));

          newWordIds = candidateIds
            .filter((id) => !hasSrsSet.has(id))
            .slice(0, remaining);
        }
      }

      const allIds = [...dueIds, ...newWordIds];
      if (allIds.length === 0) {
        return new NextResponse(JSON.stringify({ success: true, data: [], classroomId, total: 0 }), {
          headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
        });
      }

      // Lấy từ due + mới (id list) — không join srs_progress(*) (payload nhẹ)
      let dueWordsQuery = supabase
        .from('words')
        .select('id, word, translation, ipa, pos, example, example_vi, image_url, synonyms, antonyms, classroom_id, created_at')
        .in('id', allIds);
      if (requestedIds) {
        dueWordsQuery = dueWordsQuery.eq('classroom_id', classroomId);
      }
      const { data: wordsData, error: wErr } = await dueWordsQuery;
      if (wErr) throw wErr;

      const newIdSet = new Set(newWordIds);
      const order = new Map(allIds.map((id, i) => [id, i])); // due trước, mới sau
      const enriched = ((wordsData || []) as Word[])
        .filter((w) =>
          w.word && w.translation &&
          !w.translation.includes('failed') &&
          !w.translation.includes('Analyzing') &&
          !w.translation.includes('⏳'))
        .map((w) => {
          const isNew = newIdSet.has(w.id);
          const srs = isNew ? null : (srsByWord.get(w.id) || null);
          const srsLevel = isNew ? 0 : stabilityToLevel(srs?.stability || 0);
          return {
            ...w,
            srs,
            isDue: true,
            reviewCount: isNew ? 0 : (srs?.review_count || 0),
            srsLevel,
            mastery: isNew ? 0 : Math.min(100, srsLevel * 20),
            status: isNew ? 'new' : (srsLevel >= 5 ? 'mastered' : 'learning'),
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
      // Fast-path: RPC get_new_words_list (indexed query via LEFT JOIN, ~15ms)
      if (!requestedIds) {
        const { data: rpcWords, error: rpcErr } = await supabase.rpc('get_new_words_list', {
          p_user_id: userId,
          p_classroom_id: classroomId,
          p_limit: limit,
        });

        if (!rpcErr && Array.isArray(rpcWords)) {
          if (rpcWords.length === 0) {
            return new NextResponse(JSON.stringify({ success: true, data: [], classroomId, total: 0 }), {
              headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
            });
          }

          const enriched = (rpcWords as Array<{
            id: string;
            word: string;
            translation: string;
            ipa?: string | null;
            pos?: string | null;
            example?: string | null;
            example_vi?: string | null;
            synonyms?: string[] | null;
            antonyms?: string[] | null;
            image_url?: string | null;
            review_count?: number | null;
          }>)
            .filter((w) =>
              w.word && w.translation &&
              !w.translation.includes('failed') &&
              !w.translation.includes('Analyzing') &&
              !w.translation.includes('⏳'))
            .map((w) => ({
              id: w.id,
              word: w.word,
              translation: w.translation,
              ipa: w.ipa || '',
              pos: w.pos || '',
              example: w.example || '',
              example_vi: w.example_vi || null,
              image_url: w.image_url || null,
              synonyms: w.synonyms || [],
              antonyms: w.antonyms || [],
              classroom_id: classroomId,
              srs: null,
              isDue: true,
              reviewCount: 0,
              srsLevel: 0,
              mastery: 0,
              status: 'learning',
            }));

          return new NextResponse(JSON.stringify({ success: true, data: enriched, classroomId, total: enriched.length }), {
            headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
          });
        }
      }

      // Fallback / requestedIds path:
      // 1. Lấy danh sách ID các từ đã học (review_count > 0)
      const { data: srsRows, error: sErr } = await supabase
        .from('srs_progress')
        .select('word_id')
        .eq('user_id', userId)
        .gt('review_count', 0);
      if (sErr) throw sErr;
      const learnedIds = new Set((srsRows || []).map((r) => r.word_id as string));

      // 2. Tìm danh sách candidate ID chưa học
      let candidateIds: string[] = [];
      if (requestedIds) {
        candidateIds = requestedIds.filter((id) => !learnedIds.has(id)).slice(0, limit);
      } else {
        const { data: idRows, error: idErr } = await supabase
          .from('words')
          .select('id')
          .eq('classroom_id', classroomId)
          .order('created_at', { ascending: false });
        if (idErr) throw idErr;
        candidateIds = (idRows || [])
          .map((r) => r.id as string)
          .filter((id) => !learnedIds.has(id))
          .slice(0, limit);
      }

      if (candidateIds.length === 0) {
        return new NextResponse(JSON.stringify({ success: true, data: [], classroomId, total: 0 }), {
          headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
        });
      }

      // 3. Chỉ fetch full chi tiết cho đúng các candidateIds cần học (tối đa limit từ)
      const { data: wordsData, error: wErr } = await supabase
        .from('words')
        .select('id, word, translation, ipa, pos, example, example_vi, image_url, synonyms, antonyms, classroom_id, created_at')
        .in('id', candidateIds);
      if (wErr) throw wErr;

      const wordsMap = new Map((wordsData || []).map((w) => [w.id, w as Word]));
      const enriched = candidateIds
        .map((id) => wordsMap.get(id))
        .filter((w): w is Word => Boolean(w && w.word && w.translation &&
          !w.translation.includes('failed') &&
          !w.translation.includes('Analyzing') &&
          !w.translation.includes('⏳')))
        .map((w) => ({
          ...w,
          srs: null,
          isDue: true,
          reviewCount: 0,
          srsLevel: 0,
          mastery: 0,
          status: 'learning',
        }));

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
        totalWords: counts.total,
        ...counts,
      }), {
        headers: { 'Cache-Control': 'private, no-cache, stale-while-revalidate=15' },
      });
    }

    // List words + total count. Counts full (new/reviewDue): ?includeCounts=1 (tránh đếm đôi với summary=1)
    const includeCounts = searchParams.get('includeCounts') === '1';
    const noCount = searchParams.get('noCount') === '1';
    let countQuery = supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('classroom_id', classroomId);
    // Payload nhẹ: bỏ dictionary_data / image meta — dashboard + ôn không cần
    let wordsQuery = supabase
      .from('words')
      .select('id, word, translation, ipa, pos, example, example_vi, image_url, synonyms, antonyms, classroom_id, created_at, srs_progress(user_id, stability, review_count, next_review_date, ease_factor, interval_days, difficulty, last_reviewed_at)')
      .eq('classroom_id', classroomId);
    if (requestedIds) {
      countQuery = countQuery.in('id', requestedIds);
      wordsQuery = wordsQuery.in('id', requestedIds);
    }

    const [countResult, wordsResult, summaryCounts] = await Promise.all([
      (includeCounts || noCount) ? Promise.resolve({ count: null as number | null }) : countQuery,
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

    const total = summaryCounts?.total ?? countResult.count ?? (noCount ? null : 0);
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
      hasMore: total != null ? offset + limit < total : enriched.length >= limit,
    }), {
      // Private browser cache 15s — bớt spam khi user reload/đổi tab
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message)
        : 'Unknown error';
    console.error('GET /api/words Error:', msg, error);
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

    const { wordId, translation, pos, ipa, example, example_vi } = await req.json();
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
    if (example !== undefined) {
      if (typeof example !== 'string' || example.length > 2000) {
        return NextResponse.json({ success: false, error: 'invalid example' }, { status: 400 });
      }
      updates.example = example;
    }
    if (example_vi !== undefined) {
      if (typeof example_vi !== 'string' || example_vi.length > 2000) {
        return NextResponse.json({ success: false, error: 'invalid example_vi' }, { status: 400 });
      }
      updates.example_vi = example_vi;
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
    purgeLocalWordSummaryCache(auth.userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
