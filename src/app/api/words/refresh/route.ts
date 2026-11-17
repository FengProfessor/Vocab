import { sessionErrorResponse } from '@/lib/session-response';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getRouter } from '@/lib/ai-router';
import { getAuthUser, unauthorized, checkRateLimitAsync, tooManyRequests, safeErrorResponse } from '@/lib/api-security';
import { parseIpa } from '@/lib/study';
import {
  cleanViDefinition,
  getLookupCandidateKeys,
  isPendingOrInvalidTranslation,
  resolveVocabPartialFromSources,
  type GlobalDictRowInput,
} from '@/lib/vocab-entry-resolver';

/** Trần số từ gọi AI trong 1 request khi client không chỉ định wordIds (chống đốt quota). */
const MAX_AI_WORDS_PER_REQUEST = 60;
const VN_CHARS_RE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

// Enrich nhiều từ trong 1 request → có thể lâu. Hobby mặc định 10s sẽ kill sớm.
export const maxDuration = 60;

// POST /api/words/refresh
// Body: { classroomId: string, userId: string }
// Re-runs AI enrichment for all words still showing "Analyzing" or "failed"
type PendingWordRow = { id: string; word: string; translation: string | null };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type AIEnrichedWord = {
  original?: string;
  english?: string;
  vietnamese?: string;
  ipa?: string;
  pos?: string;
  example?: string;
  example_vi?: string;
};

type PeerWord = {
  word: string;
  translation: string | null;
  ipa: string | null;
  pos: string | null;
  example: string | null;
  example_vi: string | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Auth bắt buộc — route đốt quota AI hàng loạt, không auth = ai cũng trigger được
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { classroomId, wordIds } = (await req.json()) as {
      classroomId?: string;
      wordIds?: unknown;
    };
    if (!classroomId) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }
    if (wordIds !== undefined && (
      !Array.isArray(wordIds)
      || wordIds.length === 0
      || wordIds.length > 20
      || wordIds.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))
    )) {
      return NextResponse.json(
        { success: false, error: 'wordIds must contain 1-20 valid UUIDs' },
        { status: 400 },
      );
    }
    const requestedIds = Array.isArray(wordIds) ? [...new Set(wordIds as string[])] : null;

    const supabase = createServiceClient();

    // Giáo viên của lớp HOẶC học sinh đã enroll mới được refresh (nút Retry AI ở flashcard là của học sinh)
    const [{ data: cls }, { data: enrollment }] = await Promise.all([
      supabase.from('classrooms').select('teacher_id').eq('id', classroomId).maybeSingle(),
      supabase.from('enrollments').select('id').eq('classroom_id', classroomId).eq('student_id', auth.userId).maybeSingle(),
    ]);
    if (cls?.teacher_id !== auth.userId && !enrollment) {
      return NextResponse.json({ success: false, error: 'Not a member of this classroom' }, { status: 403 });
    }

    // Request guard rộng cho cache hit (20 req/phút); AI guard siết riêng bên dưới khi thực sự gọi LLM
    const reqRl = await checkRateLimitAsync(`refresh-req:${auth.userId}`, 20, 60_000);
    if (!reqRl.allowed) return tooManyRequests();

    console.log(`[Refresh] Refreshing classroom: ${classroomId}`);

    // Find words that still need analysis
    let pendingQuery = supabase
      .from('words')
      .select('id, word, translation')
      .eq('classroom_id', classroomId);
    if (requestedIds) pendingQuery = pendingQuery.in('id', requestedIds);
    const { data: pendingWords, error } = await pendingQuery;

    if (error) throw error;

    // Filter in-memory using any string that looks like it needs analysis
    const filtered = ((pendingWords || []) as PendingWordRow[]).filter((w) =>
      isPendingOrInvalidTranslation(w.translation),
    );

    console.log(`[Refresh] Words in class: ${pendingWords?.length || 0}. Pending: ${filtered.length}`);
    if (filtered.length === 0) {
      return NextResponse.json({ success: true, refreshed: 0, message: 'No pending words found.' });
    }

    let refreshed = 0;
    const stillPending: PendingWordRow[] = [];

    // ── CASCADE CACHE CHECK ──
    if (filtered.length > 0) {
      const wordsToQuery = [...new Set(filtered.flatMap((w) => getLookupCandidateKeys(w.word)))];

      // Tier 1: global_dictionary (chunked by 200)
      const gdMap = new Map<string, GlobalDictRowInput>();
      for (let i = 0; i < wordsToQuery.length; i += 200) {
        const slice = wordsToQuery.slice(i, i + 200);
        const { data: gdEntries } = await supabase
          .from('global_dictionary')
          .select('word, data, image_url, image_source, image_confidence')
          .in('word', slice);
        for (const entry of gdEntries ?? []) {
          if (entry.word && entry.data) {
            gdMap.set(entry.word.toLowerCase().trim(), entry);
          }
        }
      }

      // Resolve Tier 1 + Static fallbacks first; collect remaining for Tier 2 peer lookup
      const tier1Resolved = new Map<string, ReturnType<typeof resolveVocabPartialFromSources>>();
      const unresolvedWordsSet = new Set<string>();
      for (const w of filtered) {
        const resolved = resolveVocabPartialFromSources(w.word, gdMap);
        if (resolved.translation) {
          tier1Resolved.set(w.id, resolved);
        } else {
          for (const cand of getLookupCandidateKeys(w.word)) {
            unresolvedWordsSet.add(cand);
          }
        }
      }

      // Tier 2: peer words (matching other users' completed words)
      const unresolvedWords = [...unresolvedWordsSet];
      const peerMap = new Map<string, PeerWord>();
      if (unresolvedWords.length > 0) {
        for (let i = 0; i < unresolvedWords.length; i += 200) {
          const { data: peerEntries } = await supabase
            .from('words')
            .select('word, translation, ipa, pos, example, example_vi, synonyms, antonyms')
            .in('word', unresolvedWords.slice(i, i + 200))
            .neq('ipa', '')
            .not('translation', 'ilike', '%Analyzing%')
            .not('translation', 'ilike', '%failed%');

          if (peerEntries) {
            for (const entry of peerEntries as PeerWord[]) {
              if (entry.word && !isPendingOrInvalidTranslation(entry.translation)) {
                peerMap.set(entry.word.toLowerCase().trim(), entry);
              }
            }
          }
        }
      }

      // Apply Tier 1 / Static / Tier 2 updates
      for (const w of filtered) {
        const resolved = tier1Resolved.get(w.id);
        if (resolved?.translation) {
          const updates: Record<string, unknown> = {
            translation: resolved.translation,
            ipa: resolved.ipa ? (parseIpa(resolved.ipa) || resolved.ipa) : '',
            pos: resolved.pos || '',
            example: resolved.example || '',
            example_vi: resolved.example_vi || '',
            synonyms: resolved.synonyms || [],
            antonyms: resolved.antonyms || [],
          };
          if (resolved.image_url) {
            updates.image_url = resolved.image_url;
            updates.image_source = resolved.image_source || 'global_dict';
            updates.image_confidence = resolved.image_confidence ?? null;
          }
          const { error: updateErr } = await supabase
            .from('words')
            .update(updates)
            .eq('id', w.id);

          if (!updateErr) {
            console.log(`✓ Cache Cascade Hit (Tier 1/Static) for "${w.word}"`);
            refreshed++;
            continue;
          }
        }

        // Try Tier 2 across candidate keys
        let peer: PeerWord | undefined;
        for (const cand of getLookupCandidateKeys(w.word)) {
          peer = peerMap.get(cand);
          if (peer?.translation) break;
        }
        if (peer?.translation) {
          const { error: updateErr } = await supabase
            .from('words')
            .update({
              translation: cleanViDefinition(peer.translation) || peer.translation,
              ipa: peer.ipa || '',
              pos: peer.pos || '',
              example: peer.example || '',
              example_vi: peer.example_vi || '',
              synonyms: peer.synonyms || [],
              antonyms: peer.antonyms || [],
            })
            .eq('id', w.id);

          if (!updateErr) {
            console.log(`✓ Cache Cascade Hit (Tier 2: peer_word) for "${w.word}"`);
            refreshed++;
            continue;
          }
        }

        // Cache miss -> still pending for AI
        stillPending.push(w);
      }
    }

    // Chống đốt quota: khi client không chỉ định wordIds, giới hạn số từ gọi AI/1 request
    let aiSkipped = 0;
    if (!requestedIds && stillPending.length > MAX_AI_WORDS_PER_REQUEST) {
      aiSkipped = stillPending.length - MAX_AI_WORDS_PER_REQUEST;
      stillPending.length = MAX_AI_WORDS_PER_REQUEST;
    }

    console.log(`Words pending in classroom: ${filtered.length}. Resolved via Cache: ${refreshed}. Remaining for AI: ${stillPending.length}${aiSkipped ? ` (${aiSkipped} hoãn lại)` : ''}`);

    if (stillPending.length > 0) {
      const aiRl = await checkRateLimitAsync(`refresh:${auth.userId}`, 6, 60_000);
      if (!aiRl.allowed) return tooManyRequests();

      // Process in chunks of 20 to speed up and avoid Gemini rate limits (Batch Processing)
      const CHUNK_SIZE = 20;
      const pendingChunks: PendingWordRow[][] = [];
      for (let i = 0; i < stillPending.length; i += CHUNK_SIZE) {
        pendingChunks.push(stillPending.slice(i, i + CHUNK_SIZE));
      }

      for (const chunk of pendingChunks) {
        try {
          const wordsList = chunk.map((w) => `"${w.word}"`).join(', ');
          const prompt = `You are a bilingual dictionary. Analyze these words/phrases: [${wordsList}].
Each word may be in English OR Vietnamese. Detect the language of each.
Return ONLY a valid JSON array of objects. Each object MUST have these exact keys:
- "original": the EXACT original string from the list above
- "english": the English word (if input is Vietnamese, translate to English; if English, use lowercase base form)
- "vietnamese": the Vietnamese meaning (if input is English, translate to Vietnamese; if Vietnamese, use as-is)
- "ipa": IPA phonetic transcription of the ENGLISH word
- "pos": part of speech (noun/verb/adj/adv/prep/conj/det)
- "example": one natural English sentence using the English word
- "example_vi": natural Vietnamese translation of that example (1 sentence)
The response MUST be a valid JSON array starting with '[' and ending with ']'. No markdown fences.`;

          const router = getRouter();
          const rawText = await router.generate(prompt, 'normal', true);
          const jsonMatch = rawText.match(/\[[\s\S]*\]/);

          if (!jsonMatch) {
            throw new Error('AI did not return a valid JSON array.');
          }

          const parsedArray = JSON.parse(jsonMatch[0]) as AIEnrichedWord[];

          // Validate and update each word in the database
          for (const item of parsedArray) {
            if (!item.original && !item.english) continue;

            const lookupStr = (item.original || item.english || '').toLowerCase().trim();
            const originalRecord = chunk.find((w) => {
              const lower = w.word.toLowerCase().trim();
              return lower === lookupStr || getLookupCandidateKeys(lower).includes(lookupStr);
            });

            if (originalRecord) {
              const hasViInput = VN_CHARS_RE.test(originalRecord.word);
              const englishWord = hasViInput
                ? (item.english || originalRecord.word).toLowerCase().trim()
                : originalRecord.word;
              const vietnameseMeaning = cleanViDefinition(item.vietnamese) || item.vietnamese || originalRecord.word;

              const { error: updateError } = await supabase.from('words').update({
                word: englishWord,
                translation: vietnameseMeaning,
                ipa: item.ipa ? (parseIpa(item.ipa) || item.ipa) : '',
                pos: item.pos || '',
                example: item.example || '',
                example_vi: item.example_vi || '',
              }).eq('id', originalRecord.id);

              if (updateError) {
                console.error(`DB Update error for "${originalRecord.word}":`, updateError.message);
              } else {
                console.log(`✓ Batch Refreshed: "${originalRecord.word}" → EN: "${englishWord}" / VI: "${vietnameseMeaning}"`);
                refreshed++;

                // Fire-and-forget cache write back into global_dictionary
                const cacheWord = englishWord.toLowerCase().trim();
                if (cacheWord && !isPendingOrInvalidTranslation(vietnameseMeaning)) {
                  void supabase.from('global_dictionary').upsert({
                    word: cacheWord,
                    data: {
                      word: cacheWord,
                      pronunciations: item.ipa ? [{ ipa: item.ipa }] : [],
                      results: [{
                        meanings: [{
                          pos: item.pos || '',
                          definition: vietnameseMeaning,
                          example: item.example || '',
                          example_vi: item.example_vi || '',
                          collocations: [],
                        }],
                      }],
                    },
                    tags: ['ai-generated', 'batch-refresh'],
                  }, { onConflict: 'word', ignoreDuplicates: true }).then(({ error: cacheErr }) => {
                    if (cacheErr) console.error('[Refresh] global_dictionary cache write failed:', cacheErr.message);
                  });
                }
              }
            }
          }

          // Minor delay to be safe with rate limits
          await new Promise(r => setTimeout(r, 600));

        } catch (chunkErr: unknown) {
    const sessionFailure = sessionErrorResponse(chunkErr);
    if (sessionFailure) return sessionFailure;
          const chunkMsg = chunkErr instanceof Error ? chunkErr.message : 'Unknown error';
          console.error(`Batch refresh failed:`, chunkMsg);
        }
      }
    }

    return NextResponse.json({
      success: true,
      refreshed,
      total: filtered.length,
      deferred: aiSkipped,
      message: `Refreshed ${refreshed}/${filtered.length} words${aiSkipped ? ` (${aiSkipped} từ hoãn lại, gọi lại để tiếp tục)` : ''}`,
    });

  } catch (error: unknown) {
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    return safeErrorResponse(error, 'Server error');
  }
}
