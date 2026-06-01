import { NextResponse } from 'next/server';
import { createServiceClient, type DictionaryData, type SRSProgress, type Word } from '@/lib/supabase';
import { enrichWord as performAIEnrichment } from '@/lib/ai-enrich';
import { resolveWordImage } from '@/lib/image-pipeline';
import { stabilityToLevel } from '@/lib/srs';
import { getAuthUser, unauthorized, isValidString } from '@/lib/api-security';

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


// ─────────────────────────────────────────────────────────────────────────────
// Helper: Lấy hoặc tạo "personal classroom" của user
// ─────────────────────────────────────────────────────────────────────────────
async function getOrCreatePersonalClassroom(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<string> {
  // 1. Tìm classroom đã tồn tại của user này
  const { data: existing } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', userId)
    .eq('name', '__personal__')
    .single();

  if (existing?.id) return existing.id;

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
  return created.id;
}

// Shape JSONB của global_dictionary.data (Vietnamese definitions + IPA)
type GdMeaning = { pos?: string; definition?: string; example?: string; collocations?: string[] };
type GdData = { pronunciations?: { ipa?: string }[]; results?: { meanings?: GdMeaning[] }[] };

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
  try {
    let updateData: EnrichResult | null = null;
    let imageSearchQuery = '';
    let source: 'global_dict' | 'peer_word' | 'ai' = 'ai';

    // ── CASCADE (chỉ khi user không tự chọn nghĩa riêng) ──
    if (!userTargetTranslation) {
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
          synonyms: [],
          antonyms: [],
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
      if (!userTargetTranslation) {
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
    await supabase.from('words').update({
      ...updateData,
      image_url: imageUrl,
      image_source: imageSource,
      image_confidence: imageConfidence,
    }).eq('id', wordId);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`AI enrichment failed for "${originalInput}":`, msg);
    try {
      await supabase.from('words').update({
        translation: '❌ Analysis failed - click Retry',
      }).eq('id', wordId);
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

    const supabase = createServiceClient();

    // Tự động dùng personal classroom nếu không truyền classroomId
    if (!classroomId) {
      classroomId = await getOrCreatePersonalClassroom(supabase, userId);
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

    // ── Save word immediately (Basic) ──
    const { data, error } = await supabase
      .from('words')
      .insert({
        classroom_id: classroomId,
        added_by: userId,
        word,
        translation: '⏳ Analyzing...',
        source_url: body.sourceUrl || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    // ── Stage 1: Fast Dictionary Lookup (Skip if already provided by Extension) ──
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

    // Only fetch if data was not manually selected in the extension
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

    // Update DB with either manual or fetched data
    await supabase.from('words').update({
      translation: initialTranslation,
      ipa: initialIpa,
      pos: initialPos,
      dictionary_data: dictData
    }).eq('id', data.id);


    const skipAI = Boolean(body.skipAI);
    if (!skipAI) {
      // ── Background AI Enrichment (Stage 2) ──
      const { data: profile } = await supabase.from('profiles').select('gemini_api_key').eq('id', userId).single();
      enrichWord(data.id, word, userId, profile?.gemini_api_key, dictData, initialTranslation);
    }
    
    return NextResponse.json({
      success: true,
      message: `"${word}" saved!`,
      wordId: data.id,
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
//        &summary=1 → chỉ trả total count + dueCount (không fetch words)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    let classroomId = searchParams.get('classroomId') || '';
    const summary = searchParams.get('summary') === '1';
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

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

    // Chế độ summary: chỉ đếm tổng + due, không fetch full data
    if (summary) {
      const { count: total } = await supabase
        .from('words')
        .select('id', { count: 'exact', head: true })
        .eq('classroom_id', classroomId);

      const now = new Date().toISOString();
      const { count: dueCount } = await supabase
        .from('srs_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review_date', now);

      // Words chưa có SRS record nào đều coi là due
      const { count: wordsWithSrs } = await supabase
        .from('srs_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      return new NextResponse(JSON.stringify({
        success: true,
        classroomId,
        total: total || 0,
        dueCount: (dueCount || 0) + Math.max(0, (total || 0) - (wordsWithSrs || 0)),
      }), {
        headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
      });
    }

    // Lấy total count song song với fetch words
    const [countResult, wordsResult] = await Promise.all([
      supabase
        .from('words')
        .select('id', { count: 'exact', head: true })
        .eq('classroom_id', classroomId),
      supabase
        .from('words')
        .select('*, srs_progress(*)')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
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

    return new NextResponse(JSON.stringify({
      success: true,
      data: enriched,
      classroomId,
      total: countResult.count || 0,
      limit,
      offset,
      hasMore: offset + limit < (countResult.count || 0),
    }), {
      headers: { 'Cache-Control': 'no-store, must-revalidate, max-age=0' },
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
