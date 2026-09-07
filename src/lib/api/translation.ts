// Translation service wrapper for LibreTranslate with Supabase caching & graceful fallback

import { supabase, createServiceClient } from '@/lib/supabase';

export interface TranslateOptions {
  sourceLang?: string; // Default: 'en'
  targetLang?: string; // Default: 'vi'
  useCache?: boolean; // Default: true
  timeoutMs?: number; // Default: 7000 ms
}

export interface TranslateResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  fromCache: boolean;
  provider: 'libretranslate' | 'cache' | 'google-fallback';
}

function getClient() {
  if (typeof window === 'undefined') {
    return createServiceClient();
  }
  return supabase;
}

/**
 * Helper to call LibreTranslate with timeout
 */
async function callLibreTranslate(
  q: string | string[],
  sourceLang: string,
  targetLang: string,
  timeoutMs: number = 7000
): Promise<string | string[]> {
  const libreUrl = process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5000';
  const apiKey = process.env.LIBRETRANSLATE_API_KEY;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: Record<string, unknown> = {
      q,
      source: sourceLang,
      target: targetLang,
      format: 'text',
    };
    if (apiKey) {
      payload.api_key = apiKey;
    }

    const response = await fetch(`${libreUrl.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`LibreTranslate HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();
    return result.translatedText || result.translation || '';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fallback to Google Translate web API via @vitalets/google-translate-api
 */
async function callGoogleFallback(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    // Dynamic import to avoid bundling issues on edge/client runtimes
    const { translate: googleTranslate } = await import('@vitalets/google-translate-api');
    const res = await googleTranslate(text, {
      from: sourceLang === 'auto' ? undefined : sourceLang,
      to: targetLang,
    });
    return res?.text || '';
  } catch (err) {
    console.warn('[Translate] Fallback to Google Translate failed:', err);
    throw err;
  }
}

async function asyncSaveCache(
  client: ReturnType<typeof getClient>,
  rows: Array<{
    source_text: string;
    source_lang: string;
    target_lang: string;
    translated_text: string;
    provider: string;
    updated_at?: string;
  }>
) {
  try {
    const { error } = await client
      .from('translations')
      .upsert(rows, { onConflict: 'source_text,source_lang,target_lang' });
    if (error && !error.message?.includes('does not exist')) {
      console.warn('[Translate] Cache insert warning:', error.message);
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Translate a single English text to a target language (default Vietnamese).
 * Checks Supabase `translations` cache first, then calls LibreTranslate, with fallback.
 *
 * @param sourceText - Text to translate.
 * @param optionsOrTargetLang - Options object or simple target language code string (e.g. 'vi').
 * @returns Translated text string.
 */
export async function translate(
  sourceText: string,
  optionsOrTargetLang: TranslateOptions | string = 'vi'
): Promise<string> {
  const options: TranslateOptions =
    typeof optionsOrTargetLang === 'string'
      ? { targetLang: optionsOrTargetLang }
      : optionsOrTargetLang || {};

  const res = await translateWithDetails(sourceText, options);
  return res.translatedText;
}

/**
 * Translate with detailed metadata (cache status, provider).
 */
export async function translateWithDetails(
  sourceText: string,
  options: TranslateOptions = {}
): Promise<TranslateResult> {
  const trimmed = sourceText?.trim();
  const sourceLang = options.sourceLang || 'en';
  const targetLang = options.targetLang || 'vi';
  const useCache = options.useCache !== false;
  const timeoutMs = options.timeoutMs || 7000;

  if (!trimmed) {
    return {
      translatedText: '',
      sourceLang,
      targetLang,
      fromCache: false,
      provider: 'libretranslate',
    };
  }

  const client = getClient();

  // 1️⃣ Check cache in Supabase
  if (useCache) {
    try {
      const { data: cached, error: cacheErr } = await client
        .from('translations')
        .select('translated_text, provider')
        .eq('source_text', trimmed)
        .eq('source_lang', sourceLang)
        .eq('target_lang', targetLang)
        .maybeSingle();

      if (!cacheErr && cached?.translated_text) {
        return {
          translatedText: cached.translated_text,
          sourceLang,
          targetLang,
          fromCache: true,
          provider: 'cache',
        };
      }
    } catch {
      // Ignore cache lookup errors and proceed
    }
  }

  // 2️⃣ Call LibreTranslate
  let translated = '';
  let provider: 'libretranslate' | 'google-fallback' = 'libretranslate';

  try {
    const raw = await callLibreTranslate(trimmed, sourceLang, targetLang, timeoutMs);
    translated = Array.isArray(raw) ? raw[0] || '' : raw;
  } catch (ltError) {
    console.warn(`[Translate] LibreTranslate error, triggering fallback:`, (ltError as Error)?.message);

    // 3️⃣ Graceful fallback to Google Translate
    try {
      translated = await callGoogleFallback(trimmed, sourceLang, targetLang);
      provider = 'google-fallback';
    } catch (fbError) {
      console.error(`[Translate] Both LibreTranslate and fallback failed:`, fbError);
      throw new Error(`Translation failed: ${(ltError as Error)?.message || 'Service unavailable'}`);
    }
  }

  // 4️⃣ Store in Supabase cache (async, ignore errors to avoid blocking return)
  if (useCache && translated) {
    void asyncSaveCache(client, [
      {
        source_text: trimmed,
        source_lang: sourceLang,
        target_lang: targetLang,
        translated_text: translated,
        provider,
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  return {
    translatedText: translated,
    sourceLang,
    targetLang,
    fromCache: false,
    provider,
  };
}

/**
 * Batch translation for an array of texts.
 */
export async function translateBatch(
  texts: string[],
  options: TranslateOptions = {}
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const sourceLang = options.sourceLang || 'en';
  const targetLang = options.targetLang || 'vi';
  const useCache = options.useCache !== false;
  const timeoutMs = options.timeoutMs || 10000;
  const client = getClient();

  const results: string[] = new Array(texts.length).fill('');
  const missingIndexes: number[] = [];
  const missingTexts: string[] = [];

  // Check cache for all texts
  if (useCache) {
    try {
      const cleanTexts = texts.map((t) => t.trim());
      const { data: cachedRows } = await client
        .from('translations')
        .select('source_text, translated_text')
        .in('source_text', cleanTexts.filter(Boolean))
        .eq('source_lang', sourceLang)
        .eq('target_lang', targetLang);

      const cacheMap = new Map<string, string>();
      cachedRows?.forEach((row: { source_text: string; translated_text: string }) => {
        cacheMap.set(row.source_text, row.translated_text);
      });

      cleanTexts.forEach((txt, idx) => {
        if (!txt) {
          results[idx] = '';
        } else if (cacheMap.has(txt)) {
          results[idx] = cacheMap.get(txt)!;
        } else {
          missingIndexes.push(idx);
          missingTexts.push(txt);
        }
      });
    } catch {
      // If cache lookup fails, fetch all
      texts.forEach((txt, idx) => {
        if (txt.trim()) {
          missingIndexes.push(idx);
          missingTexts.push(txt.trim());
        }
      });
    }
  } else {
    texts.forEach((txt, idx) => {
      if (txt.trim()) {
        missingIndexes.push(idx);
        missingTexts.push(txt.trim());
      }
    });
  }

  if (missingTexts.length === 0) {
    return results;
  }

  // Call LibreTranslate batch
  try {
    const rawTranslations = await callLibreTranslate(missingTexts, sourceLang, targetLang, timeoutMs);
    const translatedArray = Array.isArray(rawTranslations)
      ? rawTranslations
      : [rawTranslations];

    const toCache: {
      source_text: string;
      source_lang: string;
      target_lang: string;
      translated_text: string;
      provider: string;
    }[] = [];

    missingIndexes.forEach((origIdx, i) => {
      const trans = translatedArray[i] || '';
      results[origIdx] = trans;
      if (trans && missingTexts[i]) {
        toCache.push({
          source_text: missingTexts[i],
          source_lang: sourceLang,
          target_lang: targetLang,
          translated_text: trans,
          provider: 'libretranslate',
        });
      }
    });

    if (useCache && toCache.length > 0) {
      void asyncSaveCache(client, toCache);
    }

    return results;
  } catch (ltErr) {
    console.warn('[TranslateBatch] LibreTranslate batch failed, fallback sequentially:', ltErr);
    // Fallback item by item
    for (let i = 0; i < missingIndexes.length; i++) {
      const origIdx = missingIndexes[i];
      const text = missingTexts[i];
      try {
        const trans = await callGoogleFallback(text, sourceLang, targetLang);
        results[origIdx] = trans;
      } catch {
        results[origIdx] = '';
      }
    }
    return results;
  }
}
