// Translation service wrapper for LibreTranslate with Supabase caching

import { supabase } from '@/lib/supabase';

/**
 * Translate a given English text to a target language (default Vietnamese) using LibreTranslate.
 * Caches the result in Supabase `translations` table for future lookups.
 *
 * @param sourceText - English text to translate.
 * @param targetLang - Target language code (e.g., 'vi', 'es'). Defaults to 'vi'.
 * @returns Translated text.
 */
export async function translate(sourceText: string, targetLang: string = 'vi'): Promise<string> {
  const trimmed = sourceText.trim();
  if (!trimmed) return '';

  // 1️⃣ Check cache in Supabase
  try {
    const { data: cached, error: cacheErr } = await supabase
      .from('translations')
      .select('translated_text')
      .eq('source_text', trimmed)
      .eq('target_lang', targetLang)
      .single();
    if (!cacheErr && cached?.translated_text) {
      return cached.translated_text;
    }
  } catch (e) {
    // ignore cache miss errors
  }

  // 2️⃣ Call LibreTranslate API
  const libreUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com';
  const payload = {
    q: trimmed,
    source: 'en',
    target: targetLang,
    format: 'text',
  };

  const response = await fetch(`${libreUrl}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // TODO: fallback provider could be added here
    throw new Error(`LibreTranslate error: ${response.statusText}`);
  }
  const result = await response.json();
  const translated: string = result.translatedText || result.translation || '';

  // 3️⃣ Store in Supabase cache (ignore errors)
  try {
    await supabase.from('translations').insert([
      {
        source_text: trimmed,
        target_lang: targetLang,
        translated_text: translated,
      },
    ]);
  } catch (_) {}

  return translated;
}
