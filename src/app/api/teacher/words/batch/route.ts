import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  checkRateLimitAsync,
  forbidden,
  getAuthUser,
  isValidString,
  safeErrorResponse,
  tooManyRequests,
  unauthorized,
} from '@/lib/api-security';
import { parseIpa } from '@/lib/study';
import type { DictionaryData, WordFamilyEntry } from '@/lib/supabase';
import { invalidateServerWordSummaryCache } from '@/lib/ttl-cache';
import {
  getLookupCandidateKeys,
  isPendingOrInvalidTranslation,
  resolveVocabPartialFromSources,
  type GlobalDictRowInput,
} from '@/lib/vocab-entry-resolver';

interface BatchImportItemInput {
  word: string;
  ipa?: string;
  pos?: string;
  translation?: string;
  familyWords?: WordFamilyEntry[];
  teacherNote?: string;
  section?: string;
  example?: string;
  example_vi?: string;
  synonyms?: string[];
}

interface ExistingWordRow {
  id: string;
  word: string;
  translation: string | null;
  ipa: string | null;
  pos: string | null;
  example: string | null;
  example_vi: string | null;
  image_url: string | null;
  image_source: string | null;
  image_confidence: number | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  dictionary_data: DictionaryData | null;
}

const MAX_BATCH_ITEMS = 300;
const EXISTING_PAGE_SIZE = 1000;
const GD_CHUNK_SIZE = 200;
const INSERT_CHUNK_SIZE = 100;
const UPDATE_CONCURRENCY = 20;

function sanitizeFamilyWords(raw: unknown): WordFamilyEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: WordFamilyEntry[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as WordFamilyEntry;
    const word = typeof e.word === 'string' ? e.word.trim() : '';
    if (!word || word.length > 100) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      word,
      ...(typeof e.pos === 'string' && e.pos.trim() ? { pos: e.pos.trim().slice(0, 60) } : {}),
      ...(typeof e.meaning === 'string' && e.meaning.trim() ? { meaning: e.meaning.trim().slice(0, 300) } : {}),
    });
  }
  return out;
}

function normalizeTeacherIpa(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed.slice(0, 200);
  const stripped = trimmed.replace(/^\/+|\/+$/g, '').trim();
  return stripped ? `/${stripped}/`.slice(0, 200) : '';
}

function mergeSynonyms(teacherSyns?: string[], cacheSyns?: string[], existingSyns?: string[] | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of [teacherSyns || [], cacheSyns || [], existingSyns || []]) {
    for (const s of list) {
      const clean = typeof s === 'string' ? s.trim() : '';
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
  }
  return out;
}

/**
 * POST /api/teacher/words/batch
 * Nhập hàng loạt từ vựng do giáo viên soạn vào lớp học.
 * Giữ 100% nghĩa, IPA, POS của giáo viên; lưu familyWords & teacherNote vào dictionary_data để HS tham khảo.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const rl = await checkRateLimitAsync(`teacher-words-batch:${auth.userId}`, 15, 60_000);
    if (!rl.allowed) return tooManyRequests(Math.ceil(rl.resetIn / 1000));

    const body = (await req.json()) as {
      classroomId?: unknown;
      items?: unknown;
      duplicateStrategy?: unknown;
      enrichMissingFromCache?: unknown;
    };

    if (!isValidString(body.classroomId, 100)) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_BATCH_ITEMS) {
      return NextResponse.json(
        { success: false, error: `Danh sách phải có từ 1 đến ${MAX_BATCH_ITEMS} từ.` },
        { status: 400 },
      );
    }

    const classroomId = body.classroomId.trim();
    const duplicateStrategy: 'update' | 'skip' =
      body.duplicateStrategy === 'skip' ? 'skip' : 'update';
    const enrichMissingFromCache = body.enrichMissingFromCache !== false;

    const supabase = createServiceClient();
    const { data: cls, error: clsErr } = await supabase
      .from('classrooms')
      .select('id, name, teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (clsErr) throw clsErr;
    if (!cls || cls.teacher_id !== auth.userId || cls.name === '__personal__') {
      return forbidden('Bạn không có quyền nhập hàng loạt vào lớp học này');
    }

    // 1. Khử trùng trong batch theo lowercase word, giữ nguyên thứ tự gốc
    const dedupedItems: BatchImportItemInput[] = [];
    const seenWords = new Set<string>();
    for (const rawItem of body.items as BatchImportItemInput[]) {
      if (!rawItem || typeof rawItem.word !== 'string') continue;
      const word = rawItem.word.replace(/\s+/g, ' ').trim().slice(0, 100);
      if (!word) continue;
      const key = word.toLowerCase();
      if (seenWords.has(key)) continue;
      seenWords.add(key);
      dedupedItems.push({
        word,
        ipa: typeof rawItem.ipa === 'string' ? rawItem.ipa.trim().slice(0, 200) : '',
        pos: typeof rawItem.pos === 'string' ? rawItem.pos.trim().slice(0, 100) : '',
        translation: typeof rawItem.translation === 'string' ? rawItem.translation.trim().slice(0, 1000) : '',
        familyWords: sanitizeFamilyWords(rawItem.familyWords),
        teacherNote: typeof rawItem.teacherNote === 'string' ? rawItem.teacherNote.trim().slice(0, 2000) : '',
        section: typeof rawItem.section === 'string' ? rawItem.section.trim().slice(0, 250) : '',
        example: typeof rawItem.example === 'string' ? rawItem.example.trim().slice(0, 2000) : '',
        example_vi: typeof rawItem.example_vi === 'string' ? rawItem.example_vi.trim().slice(0, 2000) : '',
        synonyms: Array.isArray(rawItem.synonyms)
          ? rawItem.synonyms.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim())
          : [],
      });
    }

    if (dedupedItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Không có từ hợp lệ để lưu.' }, { status: 400 });
    }

    // 2. Lấy toàn bộ từ đang có trong lớp để phân loại insert vs update/skip
    const existingRows: ExistingWordRow[] = [];
    let from = 0;
    while (true) {
      const { data: page, error: exErr } = await supabase
        .from('words')
        .select(
          'id, word, translation, ipa, pos, example, example_vi, image_url, image_source, image_confidence, synonyms, antonyms, dictionary_data',
        )
        .eq('classroom_id', classroomId)
        .range(from, from + EXISTING_PAGE_SIZE - 1);

      if (exErr) throw exErr;
      if (!page || page.length === 0) break;
      existingRows.push(...(page as ExistingWordRow[]));
      if (page.length < EXISTING_PAGE_SIZE) break;
      from += EXISTING_PAGE_SIZE;
    }

    const existingMap = new Map<string, ExistingWordRow>();
    for (const row of existingRows) {
      if (row.word) {
        existingMap.set(row.word.trim().toLowerCase(), row);
      }
    }

    // 3. Tra global_dictionary (0 AI) cho các trường giáo viên để trống (ví dụ, ảnh, hoặc nghĩa nếu chỉ nhập list từ)
    const gdMap = new Map<string, GlobalDictRowInput>();
    if (enrichMissingFromCache) {
      const lookupKeysSet = new Set<string>();
      for (const item of dedupedItems) {
        const ex = existingMap.get(item.word.toLowerCase());
        const needsCache =
          !item.translation ||
          !item.ipa ||
          !item.pos ||
          (!item.example && !ex?.example) ||
          !ex?.image_url;
        if (needsCache) {
          for (const cand of getLookupCandidateKeys(item.word)) {
            lookupKeysSet.add(cand);
          }
        }
      }

      const lookupKeys = [...lookupKeysSet];
      const gdChunks: string[][] = [];
      for (let i = 0; i < lookupKeys.length; i += GD_CHUNK_SIZE) {
        gdChunks.push(lookupKeys.slice(i, i + GD_CHUNK_SIZE));
      }

      const gdResults = await Promise.all(
        gdChunks.map((chunk) =>
          supabase
            .from('global_dictionary')
            .select('word, data, image_url, image_source, image_confidence')
            .in('word', chunk),
        ),
      );

      for (const res of gdResults) {
        for (const row of (res.data || []) as GlobalDictRowInput[]) {
          if (row.word) {
            gdMap.set(row.word.toLowerCase().trim(), row);
          }
        }
      }
    }

    // 4. Chuẩn bị danh sách insert và update
    let skipped = 0;
    let needsAiRefresh = false;

    const toInsert: Array<Record<string, unknown>> = [];
    const toUpdate: Array<{ id: string; payload: Record<string, unknown> }> = [];
    const baseNow = Date.now();

    for (const item of dedupedItems) {
      const lower = item.word.toLowerCase();
      const existing = existingMap.get(lower);

      if (existing && duplicateStrategy === 'skip') {
        skipped++;
        continue;
      }

      const cached = enrichMissingFromCache
        ? resolveVocabPartialFromSources(lower, gdMap)
        : null;

      // Bảo toàn 100% nội dung giáo viên soạn
      const teacherTrans = (item.translation || '').trim();
      const teacherIpa = normalizeTeacherIpa(item.ipa);
      const teacherPos = (item.pos || '').trim();
      const teacherExample = (item.example || '').trim();
      const teacherExampleVi = (item.example_vi || '').trim();

      let finalTranslation = teacherTrans;
      if (!finalTranslation) {
        const cachedTrans = cached?.translation && !isPendingOrInvalidTranslation(cached.translation)
          ? cached.translation
          : '';
        if (cachedTrans) {
          finalTranslation = cachedTrans;
        } else if (existing?.translation && !isPendingOrInvalidTranslation(existing.translation)) {
          finalTranslation = existing.translation;
        } else {
          finalTranslation = '⏳ Analyzing...';
          needsAiRefresh = true;
        }
      }

      const finalIpa =
        teacherIpa ||
        (cached?.ipa ? parseIpa(cached.ipa) || cached.ipa : '') ||
        existing?.ipa ||
        '';
      const finalPos = teacherPos || cached?.pos || existing?.pos || '';
      const finalExample = teacherExample || existing?.example || cached?.example || '';
      const finalExampleVi = teacherExampleVi || existing?.example_vi || cached?.example_vi || null;
      const finalImageUrl = existing?.image_url || cached?.image_url || null;
      const finalImageSource = existing?.image_source || (cached?.image_url ? cached.image_source || 'global_dict' : null);
      const finalImageConfidence = existing?.image_confidence ?? cached?.image_confidence ?? null;
      const finalSynonyms = mergeSynonyms(item.synonyms, cached?.synonyms, existing?.synonyms);
      const finalAntonyms =
        existing?.antonyms && existing.antonyms.length > 0
          ? existing.antonyms
          : cached?.antonyms || [];

      const nextDict: DictionaryData = {
        ...((existing?.dictionary_data as DictionaryData | null) || {}),
        source: 'teacher_import',
        familyWords: item.familyWords || [],
      };
      if (item.teacherNote) {
        nextDict.teacherNote = item.teacherNote;
      } else {
        delete nextDict.teacherNote;
      }
      if (item.section) {
        nextDict.section = item.section;
      } else {
        delete nextDict.section;
      }

      if (existing) {
        toUpdate.push({
          id: existing.id,
          payload: {
            word: item.word,
            translation: finalTranslation,
            ipa: finalIpa,
            pos: finalPos,
            example: finalExample || null,
            example_vi: finalExampleVi,
            image_url: finalImageUrl,
            image_source: finalImageSource,
            image_confidence: finalImageConfidence,
            synonyms: finalSynonyms,
            antonyms: finalAntonyms,
            dictionary_data: nextDict,
          },
        });
      } else {
        const insertIdx = toInsert.length;
        toInsert.push({
          classroom_id: classroomId,
          added_by: auth.userId,
          word: item.word,
          translation: finalTranslation,
          ipa: finalIpa,
          pos: finalPos,
          ...(finalExample ? { example: finalExample } : {}),
          ...(finalExampleVi ? { example_vi: finalExampleVi } : {}),
          ...(finalImageUrl ? { image_url: finalImageUrl } : {}),
          ...(finalImageSource ? { image_source: finalImageSource } : {}),
          ...(finalImageConfidence != null ? { image_confidence: finalImageConfidence } : {}),
          synonyms: finalSynonyms,
          antonyms: finalAntonyms,
          dictionary_data: nextDict,
          created_at: new Date(baseNow - insertIdx * 10).toISOString(),
        });
      }
    }

    // 5. Execute inserts theo chunk 100
    let inserted = 0;
    let failed = 0;
    for (let i = 0; i < toInsert.length; i += INSERT_CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + INSERT_CHUNK_SIZE);
      const { error: insErr } = await supabase.from('words').insert(chunk);
      if (insErr) {
        console.error('[teacher/words/batch] insert chunk failed:', insErr.message);
        failed += chunk.length;
      } else {
        inserted += chunk.length;
      }
    }

    // 6. Execute updates song song theo lô 20 (giữ nguyên srs_progress của học sinh)
    let updated = 0;
    for (let i = 0; i < toUpdate.length; i += UPDATE_CONCURRENCY) {
      const chunk = toUpdate.slice(i, i + UPDATE_CONCURRENCY);
      const results = await Promise.all(
        chunk.map((u) => supabase.from('words').update(u.payload).eq('id', u.id)),
      );
      for (const r of results) {
        if (r.error) {
          console.error('[teacher/words/batch] update failed:', r.error.message);
          failed++;
        } else {
          updated++;
        }
      }
    }

    invalidateServerWordSummaryCache(auth.userId);

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      skipped,
      failed,
      needsAiRefresh,
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể nhập hàng loạt từ vựng vào lớp');
  }
}
