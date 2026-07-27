import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getRouter } from '@/lib/ai-router';
import { getAuthUser, unauthorized, checkRateLimitAsync, tooManyRequests, safeErrorResponse } from '@/lib/api-security';

/** Trần số từ gọi AI trong 1 request khi client không chỉ định wordIds (chống đốt quota). */
const MAX_AI_WORDS_PER_REQUEST = 60;

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

// Shape JSONB of global_dictionary.data
type GdMeaning = {
  pos?: string;
  definition?: string;
  example?: string;
  example_vi?: string;
  collocations?: string[];
};
type GdData = { pronunciations?: { ipa?: string }[]; results?: { meanings?: GdMeaning[] }[] };

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

    // Throttle per-user: route đốt quota AI hàng loạt (sibling refresh-image cũng RL)
    const rl = await checkRateLimitAsync(`refresh:${auth.userId}`, 3, 60_000);
    if (!rl.allowed) return tooManyRequests();

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
    const filtered = ((pendingWords || []) as PendingWordRow[]).filter((w) => {
      const t = w.translation || '';
      return t === '' || t.includes('Analyzing') || t.includes('failed') || t.includes('⏳');
    });

    console.log(`[Refresh] Words in class: ${pendingWords?.length || 0}. Pending: ${filtered.length}`);
    if (filtered.length === 0) {
      return NextResponse.json({ success: true, refreshed: 0, message: 'No pending words found.' });
    }

    let refreshed = 0;
    const stillPending: PendingWordRow[] = [];

    // ── CASCADE CACHE CHECK ──
    if (filtered.length > 0) {
      const wordsToQuery = filtered.map((w) => w.word.trim().toLowerCase());
      
      // Tier 1: global_dictionary
      const { data: gdEntries } = await supabase
        .from('global_dictionary')
        .select('word, data')
        .in('word', wordsToQuery);
      
      const gdMap = new Map<string, GdData>();
      if (gdEntries) {
        for (const entry of gdEntries) {
          if (entry.word && entry.data) {
            gdMap.set(entry.word.toLowerCase().trim(), entry.data as GdData);
          }
        }
      }

      // Tier 2: peer words (matching other users' completed words)
      const unresolvedWords = filtered
        .filter((w) => !gdMap.has(w.word.trim().toLowerCase()))
        .map((w) => w.word.trim().toLowerCase());
      
      const peerMap = new Map<string, PeerWord>();
      if (unresolvedWords.length > 0) {
        const { data: peerEntries } = await supabase
          .from('words')
          .select('word, translation, ipa, pos, example, example_vi, synonyms, antonyms')
          .in('word', unresolvedWords)
          .neq('ipa', '')
          .not('translation', 'ilike', '%Analyzing%')
          .not('translation', 'ilike', '%failed%');
        
        if (peerEntries) {
          for (const entry of peerEntries as PeerWord[]) {
            if (entry.word) {
              peerMap.set(entry.word.toLowerCase().trim(), entry);
            }
          }
        }
      }

      // Resolve from cache first
      for (const w of filtered) {
        const lower = w.word.trim().toLowerCase();
        
        // Try Tier 1
        const gdData = gdMap.get(lower);
        const gdMeaning = gdData?.results?.[0]?.meanings?.[0];
        if (gdMeaning?.definition) {
          const { error: updateErr } = await supabase
            .from('words')
            .update({
              translation: gdMeaning.definition,
              ipa: gdData?.pronunciations?.[0]?.ipa || '',
              pos: gdMeaning.pos || '',
              example: gdMeaning.example || '',
              example_vi: gdMeaning.example_vi || '',
              synonyms: [],
              antonyms: [],
            })
            .eq('id', w.id);
          
          if (!updateErr) {
            console.log(`✓ Cache Cascade Hit (Tier 1: global_dict) for "${w.word}"`);
            refreshed++;
            continue;
          }
        }

        // Try Tier 2
        const peer = peerMap.get(lower);
        if (peer?.translation) {
          const { error: updateErr } = await supabase
            .from('words')
            .update({
              translation: peer.translation,
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

            // Case-insensitive matching to find the record in our current chunk
            const originalRecord = chunk.find((w) =>
              w.word.toLowerCase().trim() === (item.original || item.english || '').toLowerCase().trim()
            );

            if (originalRecord) {
              const englishWord = (item.english || originalRecord.word).toLowerCase().trim();
              const vietnameseMeaning = item.vietnamese || originalRecord.word;
              
              const { error: updateError } = await supabase.from('words').update({
                word: englishWord,           // ALWAYS English
                translation: vietnameseMeaning, // ALWAYS Vietnamese
                ipa: item.ipa || '',
                pos: item.pos || '',
                example: item.example || '',
                example_vi: item.example_vi || '',
              }).eq('id', originalRecord.id);
              
              if (updateError) {
                console.error(`DB Update error for "${originalRecord.word}":`, updateError.message);
              } else {
                console.log(`✓ Batch Refreshed: "${originalRecord.word}" → EN: "${englishWord}" / VI: "${vietnameseMeaning}"`);
                refreshed++;
              }
            }
          }
          
          // Minor delay to be safe with rate limits
          await new Promise(r => setTimeout(r, 600));

        } catch (chunkErr: unknown) {
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
    return safeErrorResponse(error, 'Server error');
  }
}
