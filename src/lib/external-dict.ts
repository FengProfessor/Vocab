import { createServiceClient } from '@/lib/supabase-server';
import { getWordFamilyCluster } from '@/lib/toeic-collocation-index';
import { extractCleanBareIpa, extractFromGlobalDictRow } from '@/lib/vocab-entry-resolver';

/**
 * Fetch a word from dict.minhqnd.com with bounded timeout.
 * Returns raw external JSON when valid (`exists === true` and at least 1 meaning), else null.
 */
export async function fetchExternalDict(
  targetWord: string,
  timeoutMs = 2500,
): Promise<Record<string, unknown> | null> {
  const clean = targetWord.trim().toLowerCase();
  if (!clean) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://dict.minhqnd.com/api/v1/lookup?word=${encodeURIComponent(clean)}&lang=en&def_lang=vi`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;

    const extData = (await res.json()) as Record<string, unknown>;
    const results = extData?.results as Array<{ meanings?: unknown[] }> | undefined;
    if (!extData?.exists || !Array.isArray(results) || !results[0]?.meanings?.length) {
      return null;
    }
    return extData;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fire-and-forget cache write back to Supabase `global_dictionary` (`ignoreDuplicates: true`).
 */
export function upsertExternalToGlobalDict(
  word: string,
  extData: Record<string, unknown>,
): void {
  const clean = word.trim().toLowerCase();
  if (!clean) return;

  void (async () => {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('global_dictionary')
        .upsert(
          { word: clean, data: extData, tags: ['minhqnd'] },
          { onConflict: 'word', ignoreDuplicates: true },
        );
      if (error) console.error('[ext-proxy] Cache upsert error:', error.message);
    } catch (e) {
      console.error('[ext-proxy] Cache upsert exception:', e);
    }
  })();
}

/**
 * Normalize an external dictionary response into the shared LingoPro lookup payload.
 */
export function buildExternalLookupPayload(
  resolvedWord: string,
  _queriedWord: string,
  extData: Record<string, unknown>,
): Record<string, unknown> {
  const results = extData.results as Array<{ meanings?: unknown[] }> | undefined;
  const familyWords = getWordFamilyCluster(resolvedWord);

  const enrichedResults = Array.isArray(results)
    ? results.map((r, rIdx) => ({
        ...r,
        meanings: Array.isArray(r.meanings)
          ? r.meanings.map((m: unknown, mIdx: number) => ({
              ...(typeof m === 'object' && m !== null ? (m as Record<string, unknown>) : {}),
              isPrimary: rIdx === 0 && mIdx === 0,
            }))
          : r.meanings,
      }))
    : results;

  const extracted = extractFromGlobalDictRow({ word: resolvedWord, data: extData }, resolvedWord);
  const bareIpa = extractCleanBareIpa(extData, resolvedWord) || extracted.ipa || '';
  const formattedIpa = bareIpa ? `/${bareIpa.replace(/^\/+|\/+$/g, '')}/` : '';

  return {
    success: true,
    source: 'external',
    ...extData,
    word: resolvedWord,
    cleanWord: resolvedWord,
    ...(formattedIpa ? { ipa: formattedIpa } : {}),
    ...(extracted.pos ? { pos: extracted.pos } : {}),
    ...(extracted.translation ? { definition: extracted.translation } : {}),
    ...(extracted.example ? { example: extracted.example } : {}),
    ...(extracted.example_vi ? { example_vi: extracted.example_vi, exampleVi: extracted.example_vi } : {}),
    results: enrichedResults,
    ...(familyWords && familyWords.length > 0
      ? { familyWords, wordFamily: familyWords, word_family: familyWords }
      : {}),
  };
}
