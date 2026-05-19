/**
 * Adapter cào Longman Dictionary of Contemporary English (ldoceonline.com).
 * LƯU Ý: selector HTML có thể đổi — verify khi chạy thật, sửa cục bộ file này.
 */
import * as cheerio from 'cheerio';
import { fetchUrl } from '../core/http-client';
import type { RawEntry, RawMeaning } from '../core/normalizer';

const BASE = 'https://www.ldoceonline.com/dictionary';

export async function scrapeWord(word: string): Promise<RawEntry | null> {
  const slug = word.trim().toLowerCase().replace(/\s+/g, '-');
  const html = await fetchUrl(`${BASE}/${encodeURIComponent(slug)}`);
  if (!html || typeof html !== 'string') return null;

  const $ = cheerio.load(html);
  const entry = $('.dictentry').first();
  if (!entry.length) return null;

  const ipa = entry.find('.PronCodes').first().text().trim();
  const pos = entry.find('.POS').first().text().trim();

  const meanings: RawMeaning[] = [];
  $('.dictentry .Sense').each((_, el) => {
    const sense = $(el);
    const definition = sense.find('.DEF').first().text().trim();
    if (!definition) return;
    const example = sense.find('.EXAMPLE').first().text().trim();
    const collocations: string[] = [];
    sense.find('.Collocations .COLLO, .COLLO').each((__, c) => {
      const t = $(c).text().trim();
      if (t) collocations.push(t);
    });
    meanings.push({ pos, definition, example, collocations });
  });

  if (!meanings.length) return null;
  return { word, ipa, meanings };
}
