import { sessionErrorResponse } from '@/lib/session-response';
import { NextResponse } from 'next/server';
import { type DictionaryData, type SRSProgress, type Word, type WordFamilyEntry } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';
import { enrichWord as performAIEnrichment } from '@/lib/ai-enrich';
import { resolveWordImage } from '@/lib/image-pipeline';
import { stabilityToLevel, reviewCountToLevel } from '@/lib/srs';
import { rateLimitUnavailableResponse,
  getAuthUser,
  unauthorized,
  forbidden,
  isValidString,
  checkRateLimitAsync,
  userCanWriteClassroom,
} from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import { checkWordSaveQuota, resolveUserPlanInfo, recordWordSaved } from '@/lib/entitlement-server';
import { cacheGet, cacheSet, invalidateClassroomWordSummaryCaches, invalidateServerWordSummaryCache } from '@/lib/ttl-cache';
import { aggregateWordSummaries, mergeAndDedupeNewWords } from '@/lib/unified-student-words';
import { parseIpa } from '@/lib/study';
import { isWordValidForReview, deduplicateReviewWords } from '@/lib/review-queue';
import {
  getLookupCandidateKeys,
  isPendingOrInvalidTranslation,
  resolveStaticVocabFallback,
  resolveVocabPartialFromSources,
  type GlobalDictRowInput,
} from '@/lib/vocab-entry-resolver';

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
type WordWithSrsList = Word & {
  srs_progress?: SRSProgressWithStability[];
  fw?: unknown;
  tn?: string | null;
  sec?: string | null;
  src?: string | null;
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WORDS_LIST_SELECT =
  'id, word, translation, ipa, pos, example, example_vi, image_url, synonyms, antonyms, classroom_id, created_at, fw:dictionary_data->familyWords, tn:dictionary_data->>teacherNote, sec:dictionary_data->>section, src:dictionary_data->>source, srs_progress(user_id, stability, review_count, next_review_date, ease_factor, interval_days, difficulty, last_reviewed_at)';

function buildWordSearchOrFilter(rawQ: string): string {
  const likeEscaped = rawQ.replace(/[%_\\]/g, '\\$&');
  const pgQuoted = likeEscaped.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `word.ilike."%${pgQuoted}%",translation.ilike."%${pgQuoted}%"`;
}

function normalizeWordFamilyMeta(raw: unknown): WordFamilyEntry[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: WordFamilyEntry[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const m = item.trim().match(/^(.+?)\s*\(([^)]+)\)(?:\s*[:\-–]\s*(.+))?$/);
      if (m) {
        out.push({
          word: m[1].trim(),
          pos: m[2].trim(),
          ...(m[3]?.trim() ? { meaning: m[3].trim() } : {}),
        });
      } else if (item.trim()) {
        out.push({ word: item.trim() });
      }
    } else if (item && typeof item === 'object' && typeof (item as WordFamilyEntry).word === 'string') {
      const e = item as WordFamilyEntry;
      if (e.word.trim()) out.push(e);
    }
  }
  return out.length > 0 ? out : undefined;
}

type ReferenceMeta = {
  familyWords?: WordFamilyEntry[];
  teacherNote?: string;
  section?: string;
  source?: string;
  created_at?: string;
};

async function attachReferenceMeta<T extends { id: string }>(
  supabase: ReturnType<typeof createServiceClient>,
  items: T[],
  opts?: { includeCreatedAt?: boolean },
): Promise<Array<T & ReferenceMeta>> {
  if (items.length === 0) return items;
  const includeCreatedAt = Boolean(opts?.includeCreatedAt);
  const selectCols = includeCreatedAt
    ? 'id, created_at, fw:dictionary_data->familyWords, tn:dictionary_data->>teacherNote, sec:dictionary_data->>section, src:dictionary_data->>source'
    : 'id, fw:dictionary_data->familyWords, tn:dictionary_data->>teacherNote, sec:dictionary_data->>section, src:dictionary_data->>source';

  const uniqueIds = Array.from(new Set(items.map((i) => i.id).filter(Boolean)));
  const CHUNK_SIZE = 200;
  const idChunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    idChunks.push(uniqueIds.slice(i, i + CHUNK_SIZE));
  }

  const chunkResults = await Promise.all(
    idChunks.map((chunk) => supabase.from('words').select(selectCols).in('id', chunk)),
  );

  const metaById = new Map<string, ReferenceMeta>();

  for (const res of chunkResults) {
    if (res.error || !res.data) continue;
    for (const row of res.data as unknown as Array<{
      id: string;
      created_at?: string | null;
      fw: unknown;
      tn: string | null;
      sec: string | null;
      src: string | null;
    }>) {
      const fw = normalizeWordFamilyMeta(row.fw);
      const tn = row.tn?.trim() || undefined;
      const sec = row.sec?.trim() || undefined;
      const src = row.src?.trim() || undefined;
      const createdAt =
        includeCreatedAt && typeof row.created_at === 'string' && row.created_at
          ? row.created_at
          : undefined;
      if (fw || tn || sec || src || createdAt) {
        metaById.set(row.id, {
          ...(fw ? { familyWords: fw } : {}),
          ...(tn ? { teacherNote: tn } : {}),
          ...(sec ? { section: sec } : {}),
          ...(src ? { source: src } : {}),
          ...(createdAt ? { created_at: createdAt } : {}),
        });
      }
    }
  }

  return items.map((item) => {
    const meta = metaById.get(item.id);
    return meta ? { ...item, ...meta } : item;
  });
}

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

/**
 * Helper: Lấy danh sách ID các lớp học học sinh được phép học mặc định:
 * chỉ gồm `__personal__` của user và các lớp user đã tham gia (enrollments),
 * KHÔNG bao gồm các lớp user đứng tên dạy (tránh trộn từ giảng dạy vào kho học cá nhân của GV).
 */
async function getUserClassroomScope(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<{ classroomIds: string[]; personalClassroomId: string | null }> {
  const [{ data: personalClass }, { data: enrolledClasses }] = await Promise.all([
    supabase.from('classrooms').select('id').eq('teacher_id', userId).eq('name', '__personal__').maybeSingle(),
    supabase.from('enrollments').select('classroom_id').eq('student_id', userId),
  ]);
  const personalClassroomId = (personalClass?.id as string | undefined) ?? null;
  const cids = new Set<string>();
  if (personalClassroomId) cids.add(personalClassroomId);
  (enrolledClasses || []).forEach((e) => {
    if (e.classroom_id) cids.add(e.classroom_id as string);
  });
  return {
    classroomIds: Array.from(cids),
    personalClassroomId,
  };
}

async function getUserClassroomIds(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<string[]> {
  const scope = await getUserClassroomScope(supabase, userId);
  return scope.classroomIds;
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
 * Đếm L1–L6 trên TOÀN BỘ từ classroom (hoặc cross-classroom nếu classroomId = null).
 * Ưu tiên RPC get_word_level_counts (1 query) — migration 20260716_class_scale_db_perf.
 * Fallback: song song chunks (Promise.all) + single-flight in-flight deduplication.
 */
async function fetchLevelCounts(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  classroomId: string | null,
  totalWords: number,
): Promise<number[]> {
  const flightKey = `${userId}:${classroomId || 'all'}`;
  const existing = inFlightLevelCounts.get(flightKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      if (classroomId && Date.now() > rpcMissingCooldownUntil) {
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
      let wordQuery = supabase.from('words').select('id');
      if (classroomId) {
        wordQuery = wordQuery.eq('classroom_id', classroomId);
      } else {
        const targetIds = await getUserClassroomIds(supabase, userId);
        if (targetIds.length === 0) return levelCounts;
        wordQuery = wordQuery.in('classroom_id', targetIds);
      }

      const { data: wordRows, error: wErr } = await wordQuery;
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
  explicitClassroomId: string | null,
  includeLevels = false,
  preResolvedClassroomIds?: string[],
): Promise<WordSummaryCounts> {
  // 30s cache — 100 HS refresh cùng lúc chỉ 1 RPC/instance
  const cacheKey = `wsum:${userId}:${explicitClassroomId || 'all'}:${includeLevels ? 1 : 0}`;
  const cached = cacheGet<WordSummaryCounts>(cacheKey);
  if (cached) return cached;

  const inFlight = inFlightWordSummaryCounts.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const targetClassroomIds = explicitClassroomId
        ? [explicitClassroomId]
        : (preResolvedClassroomIds ?? await getUserClassroomIds(supabase, userId));

      if (targetClassroomIds.length === 0) {
        const emptyResult: WordSummaryCounts = {
          total: 0,
          dueCount: 0,
          newCount: 0,
          reviewDueCount: 0,
          levelCounts: [0, 0, 0, 0, 0, 0],
        };
        cacheSet(cacheKey, emptyResult, includeLevels ? 60_000 : 30_000);
        return emptyResult;
      }

      // Tuyệt đối không truyền p_classroom_id = null xuống RPC vì SQL RPC cũ quét cả lớp GV đang dạy.
      const rpcResults = await Promise.all(
        targetClassroomIds.map((cid) =>
          supabase.rpc('get_word_summary', {
            p_user_id: userId,
            p_classroom_id: cid,
          }),
        ),
      );

      const allRpcsOk = rpcResults.every((res) => !res.error && Boolean(res.data));
      if (allRpcsOk) {
        const parsedSummaries: WordSummaryCounts[] = [];
        let missingRow = false;
        for (const res of rpcResults) {
          const row = Array.isArray(res.data) ? res.data[0] : res.data;
          if (!row) {
            missingRow = true;
            break;
          }
          const rawLevels = row.level_counts;
          const parsedLevels: number[] = Array.isArray(rawLevels)
            ? rawLevels.map((n: unknown) => Number(n) || 0)
            : [0, 0, 0, 0, 0, 0];
          parsedSummaries.push({
            total: Number(row.total ?? 0),
            newCount: Number(row.new_count ?? 0),
            reviewDueCount: Number(row.review_due_count ?? 0),
            dueCount: Number(row.due_count ?? 0),
            levelCounts: parsedLevels,
          });
        }
        if (!missingRow) {
          const result =
            parsedSummaries.length === 1
              ? parsedSummaries[0]
              : aggregateWordSummaries(parsedSummaries);
          cacheSet(cacheKey, result, includeLevels ? 60_000 : 30_000);
          return result;
        }
      }

      // Fallback query (nếu RPC chưa sẵn sàng hoặc lỗi)
      const now = new Date().toISOString();
      const singleCid = targetClassroomIds.length === 1 ? targetClassroomIds[0] : null;

      let totalQuery = supabase
        .from('words')
        .select('id', { count: 'exact', head: true });
      if (singleCid) {
        totalQuery = totalQuery.eq('classroom_id', singleCid);
      } else {
        totalQuery = totalQuery.in('classroom_id', targetClassroomIds);
      }

      let srsDueQuery = supabase
        .from('srs_progress')
        .select('id, words!inner(classroom_id, translation)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review_date', now)
        .not('words.translation', 'is', null)
        .neq('words.translation', '')
        .not('words.translation', 'ilike', '%failed%')
        .not('words.translation', 'ilike', '%Analyzing%')
        .not('words.translation', 'like', '%⏳%');
      if (singleCid) {
        srsDueQuery = srsDueQuery.eq('words.classroom_id', singleCid);
      } else {
        srsDueQuery = srsDueQuery.in('words.classroom_id', targetClassroomIds);
      }

      let wordsWithSrsQuery = supabase
        .from('srs_progress')
        .select('id, words!inner(classroom_id)', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (singleCid) {
        wordsWithSrsQuery = wordsWithSrsQuery.eq('words.classroom_id', singleCid);
      } else {
        wordsWithSrsQuery = wordsWithSrsQuery.in('words.classroom_id', targetClassroomIds);
      }

      let learnedQuery = supabase
        .from('srs_progress')
        .select('id, words!inner(classroom_id)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('review_count', 0);
      if (singleCid) {
        learnedQuery = learnedQuery.eq('words.classroom_id', singleCid);
      } else {
        learnedQuery = learnedQuery.in('words.classroom_id', targetClassroomIds);
      }

      let reviewDueQuery = supabase
        .from('srs_progress')
        .select('id, words!inner(classroom_id, translation)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('review_count', 0)
        .lte('next_review_date', now)
        .not('words.translation', 'is', null)
        .neq('words.translation', '')
        .not('words.translation', 'ilike', '%failed%')
        .not('words.translation', 'ilike', '%Analyzing%')
        .not('words.translation', 'like', '%⏳%');
      if (singleCid) {
        reviewDueQuery = reviewDueQuery.eq('words.classroom_id', singleCid);
      } else {
        reviewDueQuery = reviewDueQuery.in('words.classroom_id', targetClassroomIds);
      }

      const [
        { count: total },
        { count: srsDue },
        { count: wordsWithSrs },
        { count: learnedCount },
        { count: reviewDueCount },
      ] = await Promise.all([
        totalQuery,
        srsDueQuery,
        wordsWithSrsQuery,
        learnedQuery,
        reviewDueQuery,
      ]);

      const totalN = total || 0;
      const learnedN = learnedCount || 0;
      const withSrsN = wordsWithSrs || 0;
      const result: WordSummaryCounts = {
        total: totalN,
        // due = SRS đến hạn (hợp lệ) + từ chưa có SRS (coi như cần học/ôn)
        dueCount: (srsDue || 0) + Math.max(0, totalN - withSrsN),
        newCount: Math.max(0, totalN - learnedN),
        reviewDueCount: reviewDueCount || 0,
        levelCounts: includeLevels
          ? await fetchLevelCounts(supabase, userId, singleCid ?? explicitClassroomId, totalN)
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
      // Tier 1: global_dictionary (đa schema + chuẩn hóa cụm từ) + fallback tĩnh
      const { data: gdRows } = await supabase
        .from('global_dictionary')
        .select('word, data, image_url, image_source, image_confidence')
        .in('word', getLookupCandidateKeys(lower));
      const gdMap = new Map<string, GlobalDictRowInput>();
      for (const row of gdRows ?? []) {
        if (row.word) gdMap.set(String(row.word).toLowerCase(), row);
      }
      const resolvedTier1 = resolveVocabPartialFromSources(lower, gdMap);
      if (resolvedTier1.translation) {
        updateData = {
          word: lower,
          translation: resolvedTier1.translation,
          ipa: resolvedTier1.ipa ? (parseIpa(resolvedTier1.ipa) || resolvedTier1.ipa) : '',
          pos: resolvedTier1.pos || '',
          example: resolvedTier1.example || '',
          example_vi: resolvedTier1.example_vi || '',
          synonyms: resolvedTier1.synonyms || [],
          antonyms: resolvedTier1.antonyms || [],
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
    const isExplicitClassroomPost = Boolean(classroomId);
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
    const lookupKeys = getLookupCandidateKeys(lower);
    let initialTranslation = body.translation || '⏳ Analyzing...';
    let initialIpa = body.ipa || '';
    let initialPos = body.pos || '';
    let initialExample = typeof body.example === 'string' ? body.example.trim() : '';
    let initialExampleVi = typeof body.exampleVi === 'string'
      ? body.exampleVi.trim()
      : typeof body.example_vi === 'string'
        ? body.example_vi.trim()
        : '';
    let initialImageUrl: string | null = typeof body.imageUrl === 'string' && body.imageUrl.trim()
      ? body.imageUrl.trim()
      : null;
    let initialImageSource: string | null = null;
    const needsGdLookup = isPendingOrInvalidTranslation(initialTranslation) || !initialIpa || !initialExample;

    const [existingWordsRes, planInfo, gdRes] = await Promise.all([
      supabase
        .from('words')
        .select('id, word, translation')
        .eq('classroom_id', classroomId)
        .ilike('word', word.trim()),
      resolveUserPlanInfo(supabase, userId),
      needsGdLookup && lookupKeys.length > 0
        ? supabase
            .from('global_dictionary')
            .select('word, data, image_url, image_source, image_confidence')
            .in('word', lookupKeys)
        : Promise.resolve({ data: [] as GlobalDictRowInput[] }),
    ]);

    const existingList = (existingWordsRes.data || []) as Array<{ id: string; word: string; translation?: string | null }>;
    let duplicateWord: { id: string; word: string; translation?: string | null } | null = null;

    if (existingList.length > 0) {
      const incomingTrans = (typeof body.translation === 'string' ? body.translation : '').trim();
      const hasSpecificTranslation = incomingTrans && incomingTrans !== '⏳ Analyzing...' && !incomingTrans.includes('⏳');

      if (hasSpecificTranslation) {
        const cleanIncoming = incomingTrans.toLowerCase().replace(/[.,;!?:"'()]/g, '').replace(/\s+/g, ' ');
        duplicateWord = existingList.find((item) => {
          if (!item.translation || item.translation === '⏳ Analyzing...') return false;
          const cleanExisting = item.translation.toLowerCase().replace(/[.,;!?:"'()]/g, '').replace(/\s+/g, ' ');
          return cleanExisting === cleanIncoming ||
                 (cleanExisting.length >= 3 && cleanIncoming.length >= 3 && (cleanExisting.includes(cleanIncoming) || cleanIncoming.includes(cleanExisting)));
        }) || null;
      } else {
        // Nếu người dùng lưu từ không có bản dịch cụ thể, coi là trùng nếu từ đã có trong sổ
        duplicateWord = existingList[0];
      }
    }

    if (duplicateWord) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: `"${word}" already in your list!`,
        wordId: duplicateWord.id,
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
    const dictData: DictionaryData | null = null;

    if (needsGdLookup) {
      const gdMap = new Map<string, GlobalDictRowInput>();
      for (const row of (gdRes.data || []) as GlobalDictRowInput[]) {
        if (row.word) gdMap.set(row.word.toLowerCase().trim(), row);
      }
      const resolved = resolveVocabPartialFromSources(lower, gdMap);
      if (isPendingOrInvalidTranslation(initialTranslation) && resolved.translation) {
        initialTranslation = resolved.translation;
      }
      if (!initialIpa && resolved.ipa) {
        initialIpa = parseIpa(resolved.ipa) || resolved.ipa;
      }
      if (!initialPos && resolved.pos) {
        initialPos = resolved.pos;
      }
      if (!initialExample && resolved.example) {
        initialExample = resolved.example;
      }
      if (!initialExampleVi && resolved.example_vi) {
        initialExampleVi = resolved.example_vi;
      }
      if (!initialImageUrl && resolved.image_url) {
        initialImageUrl = resolved.image_url;
        initialImageSource = resolved.image_source || null;
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
        ...(initialExample ? { example: initialExample } : {}),
        ...(initialExampleVi ? { example_vi: initialExampleVi } : {}),
        ...(initialImageUrl ? { image_url: initialImageUrl } : {}),
        ...(initialImageSource ? { image_source: initialImageSource } : {}),
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
    if (isExplicitClassroomPost) {
      await invalidateClassroomWordSummaryCaches(supabase, classroomId, userId);
    }

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
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
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
    const rawClassroomId = searchParams.get('classroomId');
    let classroomId: string | null = rawClassroomId ? rawClassroomId.trim() : null;
    if (classroomId === '') classroomId = null;
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
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const parsedOffset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 20;
    const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

    // Optional server-side filters & sorting for paginated list (Word Vault & teacher approval queue)
    const q = (searchParams.get('q') || '').trim().slice(0, 100);
    const rawStatus = (searchParams.get('status') || '').trim().toLowerCase();
    const dbStatusFilter =
      rawStatus === 'pending' || rawStatus === 'approved' || rawStatus === 'rejected'
        ? rawStatus
        : null;
    const srsStatusFilter =
      rawStatus === 'new' ||
      rawStatus === 'due' ||
      rawStatus === 'learned' ||
      rawStatus === 'mastered'
        ? rawStatus
        : null;
    const rawLevel = Number.parseInt(searchParams.get('level') || '', 10);
    const levelFilter =
      Number.isFinite(rawLevel) && rawLevel >= 1 && rawLevel <= 6 ? rawLevel : null;
    const rawSort = (searchParams.get('sort') || '').trim().toLowerCase();
    const sortParam =
      rawSort === 'newest' ||
      rawSort === 'oldest' ||
      rawSort === 'az' ||
      rawSort === 'hardest'
        ? rawSort
        : null;
    const effectiveSort = sortParam ?? 'newest';
    const idsParam = searchParams.get('ids');
    const parsedIds = idsParam === null
      ? null
      : idsParam.split(',').map((id) => id.trim().toLowerCase()).filter((id) => id.length > 0);

    if (parsedIds && (parsedIds.length === 0 || parsedIds.length > 20 || parsedIds.some((id) => !UUID_PATTERN.test(id)))) {
      return NextResponse.json({ success: false, error: 'ids must contain at most 20 valid UUIDs' }, { status: 400 });
    }
    const requestedIds = parsedIds ? [...new Set(parsedIds)] : null;

    const supabase = createServiceClient();

    const hasExplicitScope = Boolean(classroomId);
    let targetClassroomIds: string[] = [];
    let personalClassroomId: string | null = null;

    // Nếu truyền classroomId là '__personal__', tự động resolve sang UUID personal classroom
    if (classroomId === '__personal__') {
      const personalId = await getOrCreatePersonalClassroom(supabase, userId);
      classroomId = personalId;
      personalClassroomId = personalId;
      targetClassroomIds = [personalId];
    } else if (classroomId) {
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
      targetClassroomIds = [classroomId];
    } else {
      // Mặc định thống nhất: kho cá nhân + các lớp học sinh đang tham gia (không bao gồm lớp GV đang dạy)
      const scope = await getUserClassroomScope(supabase, userId);
      targetClassroomIds = scope.classroomIds;
      personalClassroomId = scope.personalClassroomId;
    }

    const responseClassroomId = hasExplicitScope ? classroomId : null;

    // ── Chế độ REVIEW: chỉ từ ĐÃ học & ĐẾN HẠN. Từ mới thuộc filter=new/LearnMode. ──
    if (filter === 'review') {
      const reviewCap = Math.min(limit, 100);

      if (targetClassroomIds.length === 0) {
        return new NextResponse(
          JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
          { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
        );
      }

      // Fast-path: RPC get_due_words_list theo từng classroomId trong scope (không truyền null)
      if (!requestedIds) {
        // Nạp dư một lượng vừa phải (tối đa 100 theo constraint DB) để sau khi deduplicate
        // giữa các classroom, hàng đợi không bị thiếu từ so với reviewCap mong muốn.
        const rpcFetchLimit = Math.min(100, reviewCap + 25);
        const rpcResults = await Promise.all(
          targetClassroomIds.map((cid) =>
            supabase.rpc('get_due_words_list', {
              p_user_id: userId,
              p_classroom_id: cid,
              p_limit: rpcFetchLimit,
            }),
          ),
        );

        const allDueRpcsOk = rpcResults.every((res) => !res.error && Array.isArray(res.data));
        if (allDueRpcsOk) {
          type RpcDueRow = {
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
            classroom_id?: string | null;
          };

          const combinedRpcWords: RpcDueRow[] = [];
          rpcResults.forEach((res, idx) => {
            const cid = targetClassroomIds[idx];
            for (const row of (res.data || []) as RpcDueRow[]) {
              combinedRpcWords.push({
                ...row,
                classroom_id: row.classroom_id || cid,
              });
            }
          });

          if (combinedRpcWords.length === 0) {
            return new NextResponse(
              JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
              { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
            );
          }

          const rawWords = combinedRpcWords.filter(isWordValidForReview);

          if (rawWords.length === 0) {
            return new NextResponse(
              JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
              { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
            );
          }

          // Lấy thông tin stability & next_review_date từ srs_progress để tính srsLevel và phục vụ deduplication
          const wordIds = rawWords.map((w) => w.id);
          const { data: srsRows, error: srsErr } = await supabase
            .from('srs_progress')
            .select('word_id, stability, review_count, next_review_date, difficulty, ease_factor, interval_days, last_reviewed_at')
            .in('word_id', wordIds)
            .eq('user_id', userId);

          if (srsErr) {
            console.warn('[api/words] failed to fetch srs_progress for due words:', srsErr);
          }

          const srsByWord = new Map<string, SRSProgressWithStability & { next_review_date?: string }>();
          if (Array.isArray(srsRows)) {
            for (const row of srsRows) {
              srsByWord.set(row.word_id, row as unknown as SRSProgressWithStability & { next_review_date?: string });
            }
          }

          const mappedCandidates = rawWords.map((w) => {
            const srs = srsByWord.get(w.id) || null;
            const reviewCount = Number(srs?.review_count ?? w.review_count ?? 0);
            const isNew = reviewCount === 0;
            const stability = Number(srs?.stability ?? 0);
            const srsLevel = isNew
              ? 0
              : stability > 0
                ? stabilityToLevel(stability)
                : reviewCountToLevel(reviewCount);
            const mastery = isNew ? 0 : Math.min(100, srsLevel * 20);
            const status = isNew ? 'new' : srsLevel >= 5 ? 'mastered' : 'learning';

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
              classroom_id: w.classroom_id || classroomId || '',
              srs,
              isDue: true,
              reviewCount,
              srsLevel,
              mastery,
              status,
              next_review_date: srs?.next_review_date || null,
            };
          });

          mappedCandidates.sort((a, b) => {
            const ta = a.next_review_date ? Date.parse(a.next_review_date) : Number.MAX_SAFE_INTEGER;
            const tb = b.next_review_date ? Date.parse(b.next_review_date) : Number.MAX_SAFE_INTEGER;
            const safeA = Number.isFinite(ta) ? ta : Number.MAX_SAFE_INTEGER;
            const safeB = Number.isFinite(tb) ? tb : Number.MAX_SAFE_INTEGER;
            return safeA - safeB;
          });

          // Deduplicate cross-classroom words by normalized word:
          // w.word.trim().toLowerCase()
          // Keeping the record with higher review count, earlier review date, or richer content (example).
          const deduped = deduplicateReviewWords(mappedCandidates);
          const enriched = await attachReferenceMeta(supabase, deduped.slice(0, reviewCap));

          return new NextResponse(
            JSON.stringify({ success: true, data: enriched, classroomId: responseClassroomId, total: enriched.length }),
            { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
          );
        }
      }

      // Fallback query (khi có requestedIds hoặc RPC chưa migrate/lỗi)
      const nowIso = new Date().toISOString();
      let dueSrsQuery = supabase
        .from('srs_progress')
        .select('word_id, user_id, next_review_date, review_count, stability, difficulty, ease_factor, interval_days, last_reviewed_at, words!inner(classroom_id)')
        .eq('user_id', userId)
        .gt('review_count', 0)
        .lte('next_review_date', nowIso)
        .order('next_review_date', { ascending: true })
        .limit(requestedIds ? requestedIds.length : Math.min(100, reviewCap + 25));

      if (requestedIds) {
        dueSrsQuery = dueSrsQuery.in('word_id', requestedIds);
      }
      if (targetClassroomIds.length === 1) {
        dueSrsQuery = dueSrsQuery.eq('words.classroom_id', targetClassroomIds[0]);
      } else {
        dueSrsQuery = dueSrsQuery.in('words.classroom_id', targetClassroomIds);
      }

      const { data: dueSrs, error: dueErr } = await dueSrsQuery;
      if (dueErr) throw dueErr;

      const requestedIdSet = requestedIds ? new Set(requestedIds) : null;
      const dueIds = (dueSrs || [])
        .map((s) => s.word_id)
        .filter((id) => !requestedIdSet || requestedIdSet.has(id));

      const srsByWord = new Map(
        (dueSrs || []).map((s) => [s.word_id as string, s as unknown as SRSProgressWithStability]),
      );

      const allIds = dueIds;
      if (allIds.length === 0) {
        return new NextResponse(
          JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
          { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
        );
      }

      // Lấy từ due + mới (id list) — không join srs_progress(*) (payload nhẹ)
      let dueWordsQuery = supabase
        .from('words')
        .select('id, word, translation, ipa, pos, example, example_vi, image_url, synonyms, antonyms, classroom_id, created_at')
        .in('id', allIds);
      if (requestedIds) {
        if (targetClassroomIds.length === 1) {
          dueWordsQuery = dueWordsQuery.eq('classroom_id', targetClassroomIds[0]);
        } else {
          dueWordsQuery = dueWordsQuery.in('classroom_id', targetClassroomIds);
        }
      }
      const { data: wordsData, error: wErr } = await dueWordsQuery;
      if (wErr) throw wErr;

      const order = new Map(allIds.map((id, i) => [id, i]));
      const enrichedCandidates = ((wordsData || []) as Word[])
        .filter(isWordValidForReview)
        .map((w) => {
          const srs = srsByWord.get(w.id) || null;
          const reviewCount = Number(srs?.review_count ?? 0);
          const isNew = reviewCount === 0;
          const stability = Number(srs?.stability ?? 0);
          const srsLevel = isNew
            ? 0
            : stability > 0
              ? stabilityToLevel(stability)
              : reviewCountToLevel(reviewCount);
          return {
            ...w,
            classroom_id: w.classroom_id || classroomId || '',
            srs,
            isDue: true,
            reviewCount,
            srsLevel,
            mastery: isNew ? 0 : Math.min(100, srsLevel * 20),
            status: isNew ? 'new' : srsLevel >= 5 ? 'mastered' : 'learning',
            next_review_date: srs?.next_review_date || null,
          };
        })
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

      const deduped = deduplicateReviewWords(enrichedCandidates);
      const enriched = await attachReferenceMeta(supabase, deduped.slice(0, reviewCap));

      return new NextResponse(
        JSON.stringify({ success: true, data: enriched, classroomId: responseClassroomId, total: enriched.length }),
        { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
      );
    }

    // ── Chế độ NEW: trả từ CHƯA học (không có SRS hoặc review_count=0) trên TOÀN BỘ words ──
    // LearnMode dùng — không kẹt pagination 300 từ mới nhất, không bỏ sót từ cũ chưa học.
    if (filter === 'new') {
      if (targetClassroomIds.length === 0) {
        return new NextResponse(
          JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
          { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
        );
      }

      // Fast-path: RPC get_new_words_list (indexed query via LEFT JOIN, ~15ms)
      if (!requestedIds) {
        type RpcNewRow = {
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
        };

        if (targetClassroomIds.length === 1) {
          const singleCid = targetClassroomIds[0];
          const { data: rpcWords, error: rpcErr } = await supabase.rpc('get_new_words_list', {
            p_user_id: userId,
            p_classroom_id: singleCid,
            p_limit: limit,
          });

          if (!rpcErr && Array.isArray(rpcWords)) {
            if (rpcWords.length === 0) {
              return new NextResponse(
                JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
                { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
              );
            }

            const enrichedBase = (rpcWords as RpcNewRow[])
              .filter(
                (w) =>
                  w.word &&
                  w.translation &&
                  w.translation.trim() !== '' &&
                  !w.translation.includes('failed') &&
                  !w.translation.includes('Analyzing') &&
                  !w.translation.includes('⏳'),
              )
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
                classroom_id: singleCid,
                srs: null,
                isDue: true,
                reviewCount: 0,
                srsLevel: 0,
                mastery: 0,
                status: 'learning',
              }));

            const enriched = await attachReferenceMeta(supabase, enrichedBase);

            return new NextResponse(
              JSON.stringify({ success: true, data: enriched, classroomId: responseClassroomId, total: enriched.length }),
              { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
            );
          }
        } else {
          const newRpcResults = await Promise.all(
            targetClassroomIds.map((cid) =>
              supabase.rpc('get_new_words_list', {
                p_user_id: userId,
                p_classroom_id: cid,
                p_limit: limit,
              }),
            ),
          );
          const allNewRpcsOk = newRpcResults.every((res) => !res.error && Array.isArray(res.data));
          if (allNewRpcsOk) {
            const combinedBase = newRpcResults.flatMap((res, idx) => {
              const cid = targetClassroomIds[idx];
              return ((res.data || []) as RpcNewRow[])
                .filter(
                  (w) =>
                    w.word &&
                    w.translation &&
                    w.translation.trim() !== '' &&
                    !w.translation.includes('failed') &&
                    !w.translation.includes('Analyzing') &&
                    !w.translation.includes('⏳'),
                )
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
                  classroom_id: cid,
                  srs: null,
                  isDue: true,
                  reviewCount: 0,
                  srsLevel: 0,
                  mastery: 0,
                  status: 'learning',
                }));
            });

            if (combinedBase.length === 0) {
              return new NextResponse(
                JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
                { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
              );
            }

            const withMeta = await attachReferenceMeta(supabase, combinedBase, { includeCreatedAt: true });
            const merged = mergeAndDedupeNewWords(withMeta, personalClassroomId, limit);

            return new NextResponse(
              JSON.stringify({ success: true, data: merged, classroomId: responseClassroomId, total: merged.length }),
              { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
            );
          }
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
        let idQuery = supabase
          .from('words')
          .select('id, word, classroom_id, created_at, src:dictionary_data->>source')
          .order('created_at', { ascending: false });
        idQuery =
          targetClassroomIds.length === 1
            ? idQuery.eq('classroom_id', targetClassroomIds[0])
            : idQuery.in('classroom_id', targetClassroomIds);

        const { data: idRows, error: idErr } = await idQuery;
        if (idErr) throw idErr;
        const unlearnedRows = ((idRows || []) as Array<{
          id: string;
          word: string;
          classroom_id?: string | null;
          created_at?: string | null;
          src?: string | null;
        }>)
          .filter((r) => !learnedIds.has(r.id))
          .map((r) => ({
            id: r.id,
            word: r.word,
            classroom_id: r.classroom_id,
            created_at: r.created_at,
            ...(r.src?.trim() ? { source: r.src.trim() } : {}),
          }));

        candidateIds =
          targetClassroomIds.length > 1
            ? mergeAndDedupeNewWords(unlearnedRows, personalClassroomId, limit).map((r) => r.id)
            : unlearnedRows.slice(0, limit).map((r) => r.id);
      }

      if (candidateIds.length === 0) {
        return new NextResponse(
          JSON.stringify({ success: true, data: [], classroomId: responseClassroomId, total: 0 }),
          { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
        );
      }

      // 3. Chỉ fetch full chi tiết cho đúng các candidateIds cần học (tối đa limit từ)
      const { data: wordsData, error: wErr } = await supabase
        .from('words')
        .select('id, word, translation, ipa, pos, example, example_vi, image_url, synonyms, antonyms, classroom_id, created_at')
        .in('id', candidateIds);
      if (wErr) throw wErr;

      const wordsMap = new Map((wordsData || []).map((w) => [w.id, w as Word]));
      const enrichedBase = candidateIds
        .map((id) => {
          const row = wordsMap.get(id);
          if (!row || !row.word) return null;
          if (isPendingOrInvalidTranslation(row.translation) || !row.ipa || !row.example) {
            const fallback = resolveStaticVocabFallback(row.word);
            if (fallback) {
              return {
                ...row,
                translation: isPendingOrInvalidTranslation(row.translation) && fallback.translation
                  ? fallback.translation
                  : row.translation,
                ipa: row.ipa || fallback.ipa || '',
                pos: row.pos || fallback.pos || '',
                example: row.example || fallback.example || '',
                example_vi: row.example_vi || fallback.example_vi || null,
                image_url: row.image_url || fallback.image_url || null,
              } as Word;
            }
          }
          return row;
        })
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

      const enriched = await attachReferenceMeta(supabase, enrichedBase);

      return new NextResponse(
        JSON.stringify({ success: true, data: enriched, classroomId: responseClassroomId, total: enriched.length }),
        { headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' } },
      );
    }

    // Chế độ summary: đếm total/due — levels chỉ khi ?levels=1
    if (summary) {
      const counts = await fetchWordSummaryCounts(
        supabase,
        userId,
        hasExplicitScope ? classroomId : null,
        includeLevels,
        targetClassroomIds,
      );
      return new NextResponse(JSON.stringify({
        success: true,
        classroomId: responseClassroomId,
        totalWords: counts.total,
        ...counts,
      }), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    // List words + total count. Counts full (new/reviewDue): ?includeCounts=1 (tránh đếm đôi với summary=1)
    const includeCounts = searchParams.get('includeCounts') === '1';
    const noCount = searchParams.get('noCount') === '1';

    if (targetClassroomIds.length === 0) {
      return new NextResponse(JSON.stringify({
        success: true,
        data: [],
        classroomId: responseClassroomId,
        total: 0,
        ...(includeCounts
          ? {
              newCount: 0,
              reviewDueCount: 0,
              dueCount: 0,
            }
          : {}),
        limit,
        offset,
        hasMore: false,
      }), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    const hasListFilters = Boolean(
      q || dbStatusFilter || srsStatusFilter || levelFilter || requestedIds,
    );
    const needsSrsScan = Boolean(
      srsStatusFilter || levelFilter || effectiveSort === 'hardest',
    );
    const searchOr = q ? buildWordSearchOrFilter(q) : null;

    const summaryCountsPromise = includeCounts
      ? fetchWordSummaryCounts(
          supabase,
          userId,
          hasExplicitScope ? classroomId : null,
          includeLevels,
          targetClassroomIds,
        )
      : Promise.resolve(null);

    let rawWordRows: WordWithSrsList[] = [];
    let countResultCount: number | null = null;
    let filteredTotal = 0;

    if (!needsSrsScan) {
      // Path A: Fast DB-only ranged query (handles q, DB approval status, oldest/az/newest)
      let countQuery = supabase
        .from('words')
        .select('id', { count: 'exact', head: true });
      // Payload nhẹ: bỏ dictionary_data / image meta — dashboard + ôn không cần.
      // Lọc srs_progress theo đúng user_id ngay tại DB để tránh nhân bản N_words * 300_students trong lớp học.
      let wordsQuery = supabase
        .from('words')
        .select(WORDS_LIST_SELECT)
        .eq('srs_progress.user_id', userId);

      if (targetClassroomIds.length === 1) {
        countQuery = countQuery.eq('classroom_id', targetClassroomIds[0]);
        wordsQuery = wordsQuery.eq('classroom_id', targetClassroomIds[0]);
      } else {
        countQuery = countQuery.in('classroom_id', targetClassroomIds);
        wordsQuery = wordsQuery.in('classroom_id', targetClassroomIds);
      }

      if (requestedIds) {
        countQuery = countQuery.in('id', requestedIds);
        wordsQuery = wordsQuery.in('id', requestedIds);
      }
      if (dbStatusFilter) {
        countQuery = countQuery.eq('status', dbStatusFilter);
        wordsQuery = wordsQuery.eq('status', dbStatusFilter);
      }
      if (searchOr) {
        countQuery = countQuery.or(searchOr);
        wordsQuery = wordsQuery.or(searchOr);
      }

      if (effectiveSort === 'oldest') {
        wordsQuery = wordsQuery
          .order('created_at', { ascending: true })
          .order('id', { ascending: true });
      } else if (effectiveSort === 'az') {
        wordsQuery = wordsQuery
          .order('word', { ascending: true })
          .order('created_at', { ascending: false });
      } else {
        wordsQuery = wordsQuery
          .order('created_at', { ascending: false })
          .order('id', { ascending: false });
      }

      const skipCountQuery = noCount || (includeCounts && !hasListFilters);
      const [countResult, wordsResult, summaryCounts] = await Promise.all([
        skipCountQuery ? Promise.resolve({ count: null as number | null }) : countQuery,
        wordsQuery.range(offset, offset + limit - 1),
        summaryCountsPromise,
      ]);

      if (wordsResult.error) throw wordsResult.error;
      rawWordRows = (wordsResult.data || []) as WordWithSrsList[];
      countResultCount = countResult.count ?? null;

      // Preserve summaryCounts variable cleanly below via resolvedSummaryCounts
      const resolvedSummaryCounts = summaryCounts;
      const now = Date.now();
      let enriched = rawWordRows.map((w) => {
        const { srs_progress, fw, tn, sec, src, ...wordFields } = w;
        const needsStaticHeal =
          Boolean(wordFields.word) &&
          (isPendingOrInvalidTranslation(wordFields.translation) || !wordFields.ipa || !wordFields.example);
        const fallback = needsStaticHeal ? resolveStaticVocabFallback(wordFields.word) : null;
        const resolvedFields = fallback
          ? {
              ...wordFields,
              translation: isPendingOrInvalidTranslation(wordFields.translation) && fallback.translation
                ? fallback.translation
                : wordFields.translation,
              ipa: wordFields.ipa || fallback.ipa || '',
              pos: wordFields.pos || fallback.pos || '',
              example: wordFields.example || fallback.example || '',
              example_vi: wordFields.example_vi || fallback.example_vi || null,
              image_url: wordFields.image_url || fallback.image_url || null,
            }
          : wordFields;

        const srs = (srs_progress || []).find((s) => s.user_id === userId) || null;
        const nextReviewDate = srs?.next_review_date ? new Date(srs.next_review_date).getTime() : now;

        // FSRS calculation: Map stability to a virtual Level 1-6 (Level 0 for new/unstudied words)
        const reviewCount = srs?.review_count || 0;
        const isNew = !srs || reviewCount === 0;
        const stability = srs?.stability || 0;
        const srsLevel = isNew
          ? 0
          : stability > 0
            ? stabilityToLevel(stability)
            : reviewCountToLevel(reviewCount);
        const isDue = isNew || nextReviewDate <= now;
        const familyWords = normalizeWordFamilyMeta(fw);
        const teacherNote = tn?.trim() || undefined;
        const section = sec?.trim() || undefined;
        const source = src?.trim() || undefined;

        return {
          ...resolvedFields,
          ...(familyWords ? { familyWords } : {}),
          ...(teacherNote ? { teacherNote } : {}),
          ...(section ? { section } : {}),
          ...(source ? { source } : {}),
          srs,
          isDue,
          reviewCount,
          srsLevel,
          mastery: isNew ? 0 : Math.min(100, srsLevel * 20),
          status: isNew ? 'new' : srsLevel >= 5 ? 'mastered' : 'learning',
        };
      });

      if (requestedIds && requestedIds.length > 0 && !sortParam) {
        const orderMap = new Map(requestedIds.map((id, idx) => [id, idx]));
        enriched = [...enriched].sort(
          (a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER),
        );
      }

      const total = hasListFilters
        ? (noCount ? null : (countResultCount ?? 0))
        : (resolvedSummaryCounts?.total ?? countResultCount ?? (noCount ? null : 0));

      return new NextResponse(JSON.stringify({
        success: true,
        data: enriched,
        classroomId: responseClassroomId,
        total,
        ...(resolvedSummaryCounts
          ? {
              newCount: resolvedSummaryCounts.newCount,
              reviewDueCount: resolvedSummaryCounts.reviewDueCount,
              dueCount: resolvedSummaryCounts.dueCount,
            }
          : {}),
        limit,
        offset,
        hasMore: total != null ? offset + enriched.length < total : enriched.length >= limit,
      }), {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }

    // Path B: SRS-aware two-phase query for status=new|due|learned|mastered, level=1..6, or sort=hardest
    const SCAN_CHUNK = 1000;
    type CandidateWordRow = { id: string; word: string; created_at: string };
    const candidateWords: CandidateWordRow[] = [];

    for (let from = 0; ; from += SCAN_CHUNK) {
      let candQuery = supabase
        .from('words')
        .select('id, word, created_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + SCAN_CHUNK - 1);

      if (targetClassroomIds.length === 1) {
        candQuery = candQuery.eq('classroom_id', targetClassroomIds[0]);
      } else {
        candQuery = candQuery.in('classroom_id', targetClassroomIds);
      }
      if (requestedIds) {
        candQuery = candQuery.in('id', requestedIds);
      }
      if (dbStatusFilter) {
        candQuery = candQuery.eq('status', dbStatusFilter);
      }
      if (searchOr) {
        candQuery = candQuery.or(searchOr);
      }

      const { data: chunkRows, error: candErr } = await candQuery;
      if (candErr) throw candErr;
      const rows = (chunkRows || []) as CandidateWordRow[];
      candidateWords.push(...rows);
      if (rows.length < SCAN_CHUNK) break;
    }

    type LightSrsRow = {
      word_id: string;
      stability?: number | null;
      review_count?: number | null;
      next_review_date?: string | null;
      difficulty?: number | null;
    };
    const srsByWord = new Map<string, LightSrsRow>();

    if (candidateWords.length > 0) {
      if (candidateWords.length <= 200) {
        const { data: srsRows, error: srsErr } = await supabase
          .from('srs_progress')
          .select('word_id, stability, review_count, next_review_date, difficulty')
          .eq('user_id', userId)
          .in('word_id', candidateWords.map((w) => w.id));
        if (srsErr) throw srsErr;
        for (const row of (srsRows || []) as LightSrsRow[]) {
          if (row.word_id) srsByWord.set(row.word_id, row);
        }
      } else {
        for (let from = 0; ; from += SCAN_CHUNK) {
          const { data: srsRows, error: srsErr } = await supabase
            .from('srs_progress')
            .select('word_id, stability, review_count, next_review_date, difficulty')
            .eq('user_id', userId)
            .order('word_id', { ascending: true })
            .range(from, from + SCAN_CHUNK - 1);
          if (srsErr) throw srsErr;
          const rows = (srsRows || []) as LightSrsRow[];
          for (const row of rows) {
            if (row.word_id) srsByWord.set(row.word_id, row);
          }
          if (rows.length < SCAN_CHUNK) break;
        }
      }
    }

    const scanNow = Date.now();
    type MatchedWordCandidate = {
      id: string;
      word: string;
      createdAtMs: number;
      difficulty: number;
    };
    const matchedCandidates: MatchedWordCandidate[] = [];

    for (const cw of candidateWords) {
      const srs = srsByWord.get(cw.id) || null;
      const reviewCount = srs?.review_count || 0;
      const isNew = !srs || reviewCount === 0;
      const stability = srs?.stability || 0;
      const srsLevel = isNew
        ? 0
        : stability > 0
          ? stabilityToLevel(stability)
          : reviewCountToLevel(reviewCount);
      const nextReviewMs = srs?.next_review_date ? new Date(srs.next_review_date).getTime() : scanNow;
      const isDue = isNew || nextReviewMs <= scanNow;

      if (srsStatusFilter === 'new' && !isNew) continue;
      if (srsStatusFilter === 'due' && !(reviewCount > 0 && isDue)) continue;
      if (srsStatusFilter === 'learned' && !(reviewCount > 0 && !isDue && srsLevel < 5)) continue;
      if (srsStatusFilter === 'mastered' && !(srsLevel >= 5)) continue;

      if (levelFilter !== null) {
        // L1 summary bucket includes both unstudied words (srsLevel === 0) and stability < 2 (srsLevel === 1)
        if (levelFilter === 1) {
          if (srsLevel > 1) continue;
        } else if (srsLevel !== levelFilter) {
          continue;
        }
      }

      const parsedCreated = Date.parse(cw.created_at);
      matchedCandidates.push({
        id: cw.id,
        word: cw.word,
        createdAtMs: Number.isFinite(parsedCreated) ? parsedCreated : 0,
        difficulty: Number(srs?.difficulty ?? 0),
      });
    }

    if (requestedIds && requestedIds.length > 0 && !sortParam) {
      const orderMap = new Map(requestedIds.map((id, idx) => [id, idx]));
      matchedCandidates.sort(
        (a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
    } else if (effectiveSort === 'oldest') {
      matchedCandidates.sort((a, b) => a.createdAtMs - b.createdAtMs || a.id.localeCompare(b.id));
    } else if (effectiveSort === 'az') {
      matchedCandidates.sort((a, b) => a.word.localeCompare(b.word) || b.createdAtMs - a.createdAtMs);
    } else if (effectiveSort === 'hardest') {
      matchedCandidates.sort((a, b) => b.difficulty - a.difficulty || b.createdAtMs - a.createdAtMs);
    } else {
      matchedCandidates.sort((a, b) => b.createdAtMs - a.createdAtMs || b.id.localeCompare(a.id));
    }

    filteredTotal = matchedCandidates.length;
    const pageIds = matchedCandidates.slice(offset, offset + limit).map((m) => m.id);

    const [pageWordsResult, resolvedSummaryCounts] = await Promise.all([
      pageIds.length > 0
        ? supabase
            .from('words')
            .select(WORDS_LIST_SELECT)
            .in('id', pageIds)
            .eq('srs_progress.user_id', userId)
        : Promise.resolve({ data: [] as WordWithSrsList[], error: null }),
      summaryCountsPromise,
    ]);

    if (pageWordsResult.error) throw pageWordsResult.error;
    const pageRowById = new Map(
      ((pageWordsResult.data || []) as WordWithSrsList[]).map((row) => [row.id, row]),
    );
    rawWordRows = pageIds
      .map((id) => pageRowById.get(id))
      .filter((row): row is WordWithSrsList => Boolean(row));

    const now = Date.now();
    const enriched = rawWordRows.map((w) => {
      const { srs_progress, fw, tn, sec, src, ...wordFields } = w;
      const needsStaticHeal =
        Boolean(wordFields.word) &&
        (isPendingOrInvalidTranslation(wordFields.translation) || !wordFields.ipa || !wordFields.example);
      const fallback = needsStaticHeal ? resolveStaticVocabFallback(wordFields.word) : null;
      const resolvedFields = fallback
        ? {
            ...wordFields,
            translation: isPendingOrInvalidTranslation(wordFields.translation) && fallback.translation
              ? fallback.translation
              : wordFields.translation,
            ipa: wordFields.ipa || fallback.ipa || '',
            pos: wordFields.pos || fallback.pos || '',
            example: wordFields.example || fallback.example || '',
            example_vi: wordFields.example_vi || fallback.example_vi || null,
            image_url: wordFields.image_url || fallback.image_url || null,
          }
        : wordFields;

      const srs = (srs_progress || []).find((s) => s.user_id === userId) || null;
      const nextReviewDate = srs?.next_review_date ? new Date(srs.next_review_date).getTime() : now;

      // FSRS calculation: Map stability to a virtual Level 1-6 (Level 0 for new/unstudied words)
      const reviewCount = srs?.review_count || 0;
      const isNew = !srs || reviewCount === 0;
      const stability = srs?.stability || 0;
      const srsLevel = isNew
        ? 0
        : stability > 0
          ? stabilityToLevel(stability)
          : reviewCountToLevel(reviewCount);
      const isDue = isNew || nextReviewDate <= now;
      const familyWords = normalizeWordFamilyMeta(fw);
      const teacherNote = tn?.trim() || undefined;
      const section = sec?.trim() || undefined;
      const source = src?.trim() || undefined;

      return {
        ...resolvedFields,
        ...(familyWords ? { familyWords } : {}),
        ...(teacherNote ? { teacherNote } : {}),
        ...(section ? { section } : {}),
        ...(source ? { source } : {}),
        srs,
        isDue,
        reviewCount,
        srsLevel,
        mastery: isNew ? 0 : Math.min(100, srsLevel * 20),
        status: isNew ? 'new' : srsLevel >= 5 ? 'mastered' : 'learning',
      };
    });

    const total = noCount && !includeCounts ? null : filteredTotal;
    return new NextResponse(JSON.stringify({
      success: true,
      data: enriched,
      classroomId: responseClassroomId,
      total,
      ...(resolvedSummaryCounts
        ? {
            newCount: resolvedSummaryCounts.newCount,
            reviewDueCount: resolvedSummaryCounts.reviewDueCount,
            dueCount: resolvedSummaryCounts.dueCount,
          }
        : {}),
      limit,
      offset,
      hasMore: total != null ? offset + enriched.length < total : enriched.length >= limit,
    }), {
      // Private browser cache 15s — bớt spam khi user reload/đổi tab
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error: unknown) {
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
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
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
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

    const { data: deletedWord, error } = await supabase
      .from('words')
      .delete()
      .eq('id', wordId)
      .select('classroom_id')
      .maybeSingle();
    if (error) throw error;
    purgeLocalWordSummaryCache(auth.userId);
    if (deletedWord?.classroom_id) {
      await invalidateClassroomWordSummaryCaches(supabase, deletedWord.classroom_id as string, auth.userId);
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
