/**
 * Adapter cào Vocabulary.com.
 * LƯU Ý: selector HTML có thể đổi — verify khi chạy thật, sửa cục bộ file này.
 */
import * as cheerio from 'cheerio';
import { fetchUrl } from '../core/http-client';
import type { RawEntry, RawMeaning } from '../core/normalizer';

const BASE = 'https://www.vocabulary.com/dictionary';

export async function scrapeWord(word: string): Promise<RawEntry | null> {
  const html = await fetchUrl(`${BASE}/${encodeURIComponent(word.trim())}`);
  if (!html || typeof html !== 'string') return null;

  const $ = cheerio.load(html);
  const meanings: RawMeaning[] = [];

  $('.word-definitions .sense, .definitions .sense, ol.definitions li').each((_, el) => {
    const node = $(el);
    const pos = node.find('.pos-icon, .pos').first().attr('title')?.trim()
      || node.find('.pos-icon, .pos').first().text().trim();
    // definition = text của sense, loại bỏ phần ví dụ
    const example = node.find('.example').first().text().trim();
    const definition = node
      .clone()
      .find('.example, .pos-icon, .ordinal')
      .remove()
      .end()
      .find('.definition')
      .first()
      .text()
      .trim()
      || node.find('.definition').first().text().trim();
    if (!definition) return;
    meanings.push({ pos, definition, example });
  });

  if (!meanings.length) return null;
  return { word, meanings };
}
